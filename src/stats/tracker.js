// 統計トラッカー & ランキング管理
import { load, save } from '../core/settings.js';

const STATS_KEY = 'play_stats';
const RANKINGS_KEY = 'rankings';

export class StatsTracker {
  constructor() {
    this.stats = load(STATS_KEY, {
      practice: [],
      real: []
    });
    this.rankings = load(RANKINGS_KEY, {});
  }

  /**
   * 1プレイの結果を記録
   */
  record(mode, result, target, meta = {}) {
    const entry = {
      timestamp: Date.now(),
      mode, // 'practice' | 'real'
      isSuccess: result.isSuccess,
      komaDiff: result.komaDiff,
      diffMs: result.diffMs,
      rpm: result.rpm,
      targetKoma: target.komaIndex,
      targetPos: target.posId,
      symbol: meta.symbolName || 'unknown',
      machineId: meta.machineId || 'generic',
      reel: meta.reel || 'left'
    };

    if (mode === 'real') {
      this.stats.real.push(entry);
    } else {
      this.stats.practice.push(entry);
    }

    save(STATS_KEY, this.stats);
    return entry;
  }

  getEntries(mode = 'practice') {
    return this.stats[mode] || [];
  }

  clearEntries(mode = 'practice') {
    this.stats[mode] = [];
    save(STATS_KEY, this.stats);
  }

  /**
   * 統計サマリーの計算
   */
  getSummary(mode = 'practice') {
    const entries = this.getEntries(mode);
    const total = entries.length;
    if (total === 0) {
      return { total: 0, successCount: 0, successRate: 0, avgDiffMs: 0, histogram: {} };
    }

    let successCount = 0;
    let sumMs = 0;
    const histogram = { '-3+': 0, '-2': 0, '-1': 0, '0': 0, '+1': 0, '+2': 0, '+3+': 0 };

    entries.forEach(e => {
      if (e.isSuccess) successCount++;
      sumMs += e.diffMs;

      if (e.komaDiff <= -3) histogram['-3+']++;
      else if (e.komaDiff === -2) histogram['-2']++;
      else if (e.komaDiff === -1) histogram['-1']++;
      else if (e.komaDiff === 0) histogram['0']++;
      else if (e.komaDiff === 1) histogram['+1']++;
      else if (e.komaDiff === 2) histogram['+2']++;
      else histogram['+3+']++;
    });

    return {
      total,
      successCount,
      successRate: Math.round((successCount / total) * 100),
      avgDiffMs: Math.round(sumMs / total),
      histogram
    };
  }

  /**
   * 本番モード：ランキング登録
   */
  addRanking(key, record) {
    // key: e.g. "generic:left:fixed:30G"
    const list = this.rankings[key] || [];
    list.push({
      ...record,
      date: new Date().toLocaleDateString('ja-JP')
    });

    // スコア降順ソートの上位10件
    list.sort((a, b) => b.score - a.score);
    this.rankings[key] = list.slice(0, 10);

    save(RANKINGS_KEY, this.rankings);
    return this.rankings[key];
  }

  getRanking(key) {
    return this.rankings[key] || [];
  }
}

export const statsTracker = new StatsTracker();

/**
 * Canvasにズレヒストグラムを描画するヘルパー
 */
export function drawHistogram(canvas, histogram) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const keys = ['-3+', '-2', '-1', '0', '+1', '+2', '+3+'];
  const maxVal = Math.max(1, ...Object.values(histogram));

  const barW = (width - 40) / keys.length;
  const paddingBottom = 28;
  const chartH = height - paddingBottom - 16;

  keys.forEach((k, i) => {
    const val = histogram[k] || 0;
    const h = (val / maxVal) * chartH;
    const x = 20 + i * barW;
    const y = height - paddingBottom - h;

    // ビタ(0)はゴールド/グリーン、早い(マイナス)はブルー、遅い(プラス)はレッド
    let color = '#38bdf8';
    if (k === '0') color = '#eab308';
    else if (k.startsWith('+')) color = '#f87171';

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 4, y, barW - 8, h, [4, 4, 0, 0]);
    ctx.fill();

    // 回数ラベル
    if (val > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val, x + barW / 2, y - 4);
    }

    // X軸ラベル
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(k, x + barW / 2, height - 8);
  });
}
