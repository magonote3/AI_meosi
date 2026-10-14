// 設定・記録の保存（localStorage）
const PREFIX = 'bita:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return structuredClone(fallback);
    const v = JSON.parse(raw);
    // オブジェクトは既定値とマージ（項目追加に備える）
    if (fallback && typeof fallback === 'object' && !Array.isArray(fallback)) {
      const merged = deepMerge(structuredClone(fallback), v);
      if (key === 'settings') {
        if (merged._sizeMigrated !== 'v3_90') {
          merged.sizePct = 90;
          merged._sizeMigrated = 'v3_90';
        }
      }
      return merged;
    }
    return v;
  } catch {
    return structuredClone(fallback);
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('保存に失敗しました', e);
  }
}

function deepMerge(base, over) {
  for (const k of Object.keys(over ?? {})) {
    const b = base[k];
    const o = over[k];
    if (b && o && typeof b === 'object' && typeof o === 'object' && !Array.isArray(b) && !Array.isArray(o)) {
      base[k] = deepMerge(b, o);
    } else {
      base[k] = o;
    }
  }
  return base;
}

/** アプリ全体の設定 */
export const DEFAULT_SETTINGS = {
  _sizeMigrated: 'v3_90',
  machineId: 'discup_ultraremix',
  reel: 'center', // left | center | right
  sizePct: 90, // 実機比（70〜250、実サイズの90%）
  baseKomaHmm: 30, // 実機の1コマ高さ（mm）
  baseReelWmm: 55, // 実機のリール幅（mm）
  pxPerMm: null, // キャリブレーション結果（CSS px / mm）。null は既定値
  inputOffsetMs: 0, // 遅延補正（正の値＝押した時刻を早める）
  volume: 0.6,
  muted: false,
  keys: {
    lever: ['Space', 'ArrowUp'],
    stop: ['ArrowDown', 'Enter', 'KeyZ'],
  },
};

/** 練習モードの補助設定 */
export const DEFAULT_PRACTICE = {
  rpm: 40,
  autoStep: false,
  autoStepRate: 80, // %
  autoStepGames: 10,
  dimOthers: 35, // ターゲット以外の不透明度（%）。100で補助なし
  dimEnabled: true,
  glowTarget: true,
  guideLine: true,
  timingBar: true, // リール横のタイミングバー
  markerEnabled: false,
  markerOffset: 2, // 目印：狙いの何コマ上
  tickSound: false,
  showDeviation: true,
  showAnswer: true,
  order: 'fixed', // fixed | random
};

class Store {
  constructor(key, defaults) {
    this.key = key;
    this.data = load(key, defaults);
    this.listeners = new Set();
  }
  get() {
    return this.data;
  }
  set(patch) {
    this.data = { ...this.data, ...patch };
    save(this.key, this.data);
    this.listeners.forEach((fn) => fn(this.data));
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const settings = new Store('settings', DEFAULT_SETTINGS);
export const practiceSettings = new Store('practice', DEFAULT_PRACTICE);

/** 既定のpx/mm（CSS仕様の96dpi相当） */
export const DEFAULT_PX_PER_MM = 96 / 25.4;
export function pxPerMm() {
  return settings.get().pxPerMm || DEFAULT_PX_PER_MM;
}
