// ビタ押し狙い位置（ターゲット & プリセット）管理
import { load, save, settings } from './settings.js';

export const POSITIONS = [
  { id: 'top', name: '上段', offset: -1 },
  { id: 'mid', name: '中段', offset: 0 },
  { id: 'bot', name: '下段', offset: 1 }
];

const DEFAULT_PRESETS_BY_MACHINE = {
  discup_ultraremix: [
    { id: 'dc_1', name: '中リール 16番 赤7 中段ビタ', komaIndex: 15, posId: 'mid' },
    { id: 'dc_2', name: '中リール 11番 BAR 下段ビタ', komaIndex: 10, posId: 'bot' },
    { id: 'dc_3', name: '中リール 6番 白7 中段ビタ', komaIndex: 5, posId: 'mid' },
    { id: 'dc_4', name: '左リール 16番 赤7 上段ビタ', komaIndex: 15, posId: 'top' },
  ],
  thunderv: [
    { id: 'tv_1', name: '左リール 19番 3連V(赤) 上段ビタ', komaIndex: 18, posId: 'top' },
    { id: 'tv_2', name: '左リール 17番 3連V(黄) 下段ビタ', komaIndex: 16, posId: 'bot' },
    { id: 'tv_3', name: '左リール 12番 単独V 上段ビタ', komaIndex: 11, posId: 'top' },
    { id: 'tv_4', name: '左リール 8番 BAR 上段ビタ', komaIndex: 7, posId: 'top' },
    { id: 'tv_5', name: '中リール 18番 V 中段ビタ', komaIndex: 17, posId: 'mid' },
    { id: 'tv_6', name: '中リール 9番 赤7 中段ビタ', komaIndex: 8, posId: 'mid' },
  ]
};

export class TargetManager {
  constructor() {
    this.init();
  }

  init() {
    // 各機種のプリセットとターゲットを初期化
  }

  getMachineId() {
    return settings.get().machineId || 'discup_ultraremix';
  }

  getCurrentTarget() {
    const mId = this.getMachineId();
    const fallback = mId === 'thunderv'
      ? { komaIndex: 18, posId: 'top' } // サンダーVは19番V上段
      : { komaIndex: 15, posId: 'mid' }; // ディスクアップは16番赤7中段

    return load(`current_target_${mId}`, fallback);
  }

  setCurrentTarget(komaIndex, posId) {
    const mId = this.getMachineId();
    save(`current_target_${mId}`, { komaIndex, posId });
  }

  getPresets() {
    const mId = this.getMachineId();
    const defaults = DEFAULT_PRESETS_BY_MACHINE[mId] || DEFAULT_PRESETS_BY_MACHINE.discup_ultraremix;
    return load(`target_presets_${mId}`, defaults);
  }

  addPreset(name, komaIndex, posId) {
    const mId = this.getMachineId();
    const presets = this.getPresets();
    const newPreset = {
      id: 'preset_' + Date.now(),
      name,
      komaIndex,
      posId
    };
    presets.push(newPreset);
    save(`target_presets_${mId}`, presets);
    return newPreset;
  }

  removePreset(id) {
    const mId = this.getMachineId();
    const presets = this.getPresets().filter(p => p.id !== id);
    save(`target_presets_${mId}`, presets);
  }

  pickRandomTarget(totalKoma = 20) {
    const presets = this.getPresets();
    if (presets.length > 0) {
      const idx = Math.floor(Math.random() * presets.length);
      return presets[idx];
    }
    const randKoma = Math.floor(Math.random() * totalKoma);
    const randPos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)].id;
    return { komaIndex: randKoma, posId: randPos };
  }

  static getOffsetByPosId(posId) {
    const p = POSITIONS.find(item => item.id === posId);
    return p ? p.offset : 0;
  }
}

export const targetManager = new TargetManager();
