// 統計・分析グラフ & ランキング ビュー
import { statsTracker, drawHistogram } from '../stats/tracker.js';
import { settings } from '../core/settings.js';

export class StatsView {
  constructor(container) {
    this.container = container;
    this.activeTab = 'practice'; // practice | real | ranking
    this.selectedRankGame = '30G';

    this.init();
  }

  init() {
    this.renderDOM();
    this.setupEvents();
    this.renderContent();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px; max-width:800px; margin:0 auto; width:100%;">
        <!-- Tabs Header -->
        <div class="glass-panel" style="padding:12px; display:flex; gap:8px;">
          <button class="nav-tab ${this.activeTab === 'practice' ? 'active' : ''}" id="tab-stat-practice">
            練習モード統計
          </button>
          <button class="nav-tab ${this.activeTab === 'real' ? 'active' : ''}" id="tab-stat-real">
            本番モード統計
          </button>
          <button class="nav-tab ${this.activeTab === 'ranking' ? 'active' : ''}" id="tab-stat-ranking">
            本番ランキング
          </button>
        </div>

        <!-- Dynamic Content Body -->
        <div id="stats-content-body"></div>
      </div>
    `;
  }

  renderContent() {
    const body = document.getElementById('stats-content-body');

    if (this.activeTab === 'ranking') {
      this.renderRanking(body);
    } else {
      this.renderSummary(body, this.activeTab);
    }
  }

  renderSummary(body, mode) {
    const data = statsTracker.getSummary(mode);
    const modeName = mode === 'practice' ? '練習モード' : '本番モード';

    body.innerHTML = `
      <div class="glass-panel" style="padding:24px; display:flex; flex-direction:column; gap:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="font-size:1.3rem; color:var(--accent-cyan);">${modeName} パフォーマンス分析</h2>
          <button class="btn btn-secondary btn-icon" id="btn-clear-stats" style="font-size:0.8rem; color:var(--accent-red);">
            履歴を消去
          </button>
        </div>

        <!-- KPI Cards -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
          <div class="glass-card" style="padding:16px; text-align:center;">
            <div style="color:var(--text-muted); font-size:0.85rem;">ビタ成功率</div>
            <div style="font-size:2rem; font-weight:900; color:var(--accent-green); font-family:var(--font-display);">
              ${data.successRate}%
            </div>
            <div style="font-size:0.75rem; color:var(--text-dim);">${data.successCount} / ${data.total} 回</div>
          </div>

          <div class="glass-card" style="padding:16px; text-align:center;">
            <div style="color:var(--text-muted); font-size:0.85rem;">平均タイミングズレ</div>
            <div style="font-size:2rem; font-weight:900; color:var(--accent-gold); font-family:var(--font-display);">
              ${data.avgDiffMs > 0 ? '+' : ''}${data.avgDiffMs} ms
            </div>
            <div style="font-size:0.75rem; color:var(--text-dim);">${data.avgDiffMs < 0 ? '早押し傾向' : (data.avgDiffMs > 0 ? '遅押し傾向' : 'ジャスト')}</div>
          </div>

          <div class="glass-card" style="padding:16px; text-align:center;">
            <div style="color:var(--text-muted); font-size:0.85rem;">総試行ゲーム数</div>
            <div style="font-size:2rem; font-weight:900; color:var(--accent-purple); font-family:var(--font-display);">
              ${data.total}
            </div>
            <div style="font-size:0.75rem; color:var(--text-dim);">G</div>
          </div>
        </div>

        <!-- Histogram Section -->
        <div class="glass-card" style="padding:20px;">
          <h3 style="font-size:1rem; margin-bottom:12px; color:#fff;">ズレの分布ヒストグラム (コマ数)</h3>
          <div style="width:100%; height:200px; position:relative;">
            <canvas id="chart-histogram" style="width:100%; height:100%;"></canvas>
          </div>
          <div style="display:flex; justify-content:center; gap:20px; margin-top:8px; font-size:0.8rem; color:var(--text-muted);">
            <span style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#38bdf8; border-radius:2px;"></span> 早い</span>
            <span style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#eab308; border-radius:2px;"></span> ビタ成功(±0)</span>
            <span style="display:flex; align-items:center; gap:4px;"><span style="width:10px; height:10px; background:#f87171; border-radius:2px;"></span> 遅い</span>
          </div>
        </div>
      </div>
    `;

    const canvas = document.getElementById('chart-histogram');
    if (canvas) {
      drawHistogram(canvas, data.histogram);
    }

    document.getElementById('btn-clear-stats').onclick = () => {
      if (confirm(`本当に${modeName}の履歴をすべて消去しますか？`)) {
        statsTracker.clearEntries(mode);
        this.renderContent();
      }
    };
  }

  renderRanking(body) {
    const s = settings.get();
    const rankKey = `${s.machineId}:${s.reel}:fixed:${this.selectedRankGame}`;
    const ranks = statsTracker.getRanking(rankKey);

    body.innerHTML = `
      <div class="glass-panel" style="padding:24px; display:flex; flex-direction:column; gap:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <h2 style="font-size:1.3rem; color:var(--accent-gold);">🏆 本番モード 端末内ランキング</h2>
          <div style="display:flex; gap:6px;">
            ${['10G', '30G', '50G', '100G'].map(g => `
              <button class="btn btn-secondary ${this.selectedRankGame === g ? 'active' : ''}" 
                      data-game="${g}" style="padding:6px 12px; font-size:0.85rem;">
                ${g}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-subtle); color:var(--text-muted);">
                <th style="padding:10px;">順位</th>
                <th style="padding:10px;">プレイヤー</th>
                <th style="padding:10px;">スコア</th>
                <th style="padding:10px;">成功率</th>
                <th style="padding:10px;">最大連ビタ</th>
                <th style="padding:10px;">平均ズレ</th>
                <th style="padding:10px;">日時</th>
              </tr>
            </thead>
            <tbody>
              ${ranks.length === 0 ? `
                <tr><td colspan="7" style="padding:24px; text-align:center; color:var(--text-dim);">記録がまだありません</td></tr>
              ` : ranks.map((r, i) => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05); color:#fff;">
                  <td style="padding:10px; font-family:var(--font-display); font-weight:700; color:${i === 0 ? 'var(--accent-gold)' : (i === 1 ? '#cbd5e1' : (i === 2 ? '#b45309' : 'inherit'))};">
                    #${i + 1}
                  </td>
                  <td style="padding:10px; font-weight:600;">${r.name}</td>
                  <td style="padding:10px; font-family:var(--font-display); font-weight:900; color:var(--accent-gold);">${r.score}</td>
                  <td style="padding:10px; color:var(--accent-green);">${r.rate}%</td>
                  <td style="padding:10px; color:var(--accent-cyan);">${r.maxCombo}連</td>
                  <td style="padding:10px;">${r.avgMs}ms</td>
                  <td style="padding:10px; color:var(--text-dim); font-size:0.8rem;">${r.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    body.querySelectorAll('[data-game]').forEach(btn => {
      btn.onclick = () => {
        this.selectedRankGame = btn.dataset.game;
        this.renderContent();
      };
    });
  }

  setupEvents() {
    const setTab = (tab) => {
      this.activeTab = tab;
      document.getElementById('tab-stat-practice').classList.toggle('active', tab === 'practice');
      document.getElementById('tab-stat-real').classList.toggle('active', tab === 'real');
      document.getElementById('tab-stat-ranking').classList.toggle('active', tab === 'ranking');
      this.renderContent();
    };

    document.getElementById('tab-stat-practice').onclick = () => setTab('practice');
    document.getElementById('tab-stat-real').onclick = () => setTab('real');
    document.getElementById('tab-stat-ranking').onclick = () => setTab('ranking');
  }
}
