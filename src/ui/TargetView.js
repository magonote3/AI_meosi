// 狙い（ターゲット）設定ビュー
import { targetManager, POSITIONS } from '../core/target.js';
import { settings } from '../core/settings.js';
import { getSymbolSVG } from '../core/symbols.js';

export class TargetView {
  constructor(container, machineData) {
    this.container = container;
    this.machineData = machineData;
    this.selectedKoma = 0;
    this.selectedPosId = 'mid';

    this.init();
  }

  init() {
    const cur = targetManager.getCurrentTarget();
    this.selectedKoma = cur.komaIndex;
    this.selectedPosId = cur.posId;

    this.renderDOM();
    this.setupEvents();
  }

  renderDOM() {
    const s = settings.get();
    const reelKey = s.reel || 'left';
    const seq = this.machineData.reels[reelKey] || [];

    this.container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px; max-width:800px; margin:0 auto; width:100%;">
        <!-- Active Target Header -->
        <div class="glass-panel" style="padding:20px;">
          <h2 style="font-size:1.3rem; margin-bottom:12px; color:var(--accent-gold);">狙うビタ押し箇所の指定</h2>
          <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:center;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="color:var(--text-muted);">選択中のコマ:</span>
              <strong id="display-selected-koma" style="font-size:1.2rem; color:#fff;">${this.selectedKoma + 1}番</strong>
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:var(--text-muted);">停止する段:</span>
              <div style="display:flex; gap:6px;">
                ${POSITIONS.map(p => `
                  <button class="btn btn-secondary ${this.selectedPosId === p.id ? 'active' : ''}" 
                          data-pos="${p.id}" id="btn-pos-${p.id}" style="padding:6px 14px;">
                    ${p.name}
                  </button>
                `).join('')}
              </div>
            </div>

            <button class="btn btn-primary" id="btn-apply-target" style="margin-left:auto;">
              この狙いに設定する
            </button>
          </div>
        </div>

        <!-- Presets Section -->
        <div class="glass-panel" style="padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3>保存済みプリセット</h3>
            <button class="btn btn-secondary" id="btn-add-preset" style="font-size:0.85rem; padding:6px 12px;">
              ＋ 現在の狙いをプリセット保存
            </button>
          </div>
          <div id="presets-list" style="display:flex; flex-wrap:wrap; gap:10px;"></div>
        </div>

        <!-- Sequence Table -->
        <div class="glass-panel" style="padding:20px;">
          <h3 style="margin-bottom:12px;">リール配列 (${this.machineData.totalKoma || 21}コマ一覧)</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
            狙いたいコマをタップまたはクリックしてください。
          </p>

          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:10px;">
            ${seq.map((sym, idx) => {
              const meta = this.machineData.symbols[sym] || { name: sym };
              const isSelected = this.selectedKoma === idx;
              return `
                <div class="glass-card koma-card ${isSelected ? 'selected' : ''}" data-koma="${idx}"
                     style="padding:10px; display:flex; flex-direction:column; align-items:center; gap:6px; cursor:pointer;
                            border:1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-subtle)'};
                            box-shadow: ${isSelected ? '0 0 12px rgba(234,179,8,0.4)' : 'none'};
                            transition: all 0.2s;">
                  <span style="font-family:var(--font-display); font-size:0.8rem; color:${isSelected ? 'var(--accent-gold)' : 'var(--text-dim)'};">
                    #${idx + 1}
                  </span>
                  <div style="width:50px; height:40px; display:flex; align-items:center; justify-content:center;">
                    ${getSymbolSVG(sym, this.machineData.id)}
                  </div>
                  <strong style="font-size:0.85rem; color:#fff;">${meta.name}</strong>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.renderPresetsList();
  }

  renderPresetsList() {
    const list = document.getElementById('presets-list');
    const presets = targetManager.getPresets();
    const cur = targetManager.getCurrentTarget();

    if (presets.length === 0) {
      list.innerHTML = `<span style="color:var(--text-muted); font-size:0.9rem;">保存されたプリセットはありません</span>`;
      return;
    }

    list.innerHTML = presets.map(p => {
      const isCurrent = cur.komaIndex === p.komaIndex && cur.posId === p.posId;
      return `
        <div class="glass-card" style="padding:8px 12px; display:flex; align-items:center; gap:10px; border-color:${isCurrent ? 'var(--accent-purple)' : 'var(--border-subtle)'};">
          <strong style="font-size:0.9rem; color:#fff;">${p.name}</strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">(${p.komaIndex + 1}番 / ${POSITIONS.find(pos => pos.id === p.posId)?.name})</span>
          <button class="btn btn-secondary btn-icon" data-use-preset="${p.id}" style="padding:4px 8px; font-size:0.8rem;">適用</button>
          <button class="btn btn-danger btn-icon" data-del-preset="${p.id}" style="padding:4px 8px; font-size:0.8rem;">✕</button>
        </div>
      `;
    }).join('');
  }

  setupEvents() {
    // 段ボタン
    POSITIONS.forEach(p => {
      const btn = document.getElementById(`btn-pos-${p.id}`);
      btn.onclick = () => {
        this.selectedPosId = p.id;
        POSITIONS.forEach(other => {
          document.getElementById(`btn-pos-${other.id}`).classList.toggle('active', other.id === p.id);
        });
      };
    });

    // コマ選択
    this.container.querySelectorAll('.koma-card').forEach(el => {
      el.onclick = () => {
        this.selectedKoma = Number(el.dataset.koma);
        this.container.querySelectorAll('.koma-card').forEach(c => {
          const isSelected = Number(c.dataset.koma) === this.selectedKoma;
          c.classList.toggle('selected', isSelected);
          c.style.borderColor = isSelected ? 'var(--accent-gold)' : 'var(--border-subtle)';
          c.style.boxShadow = isSelected ? '0 0 12px rgba(234,179,8,0.4)' : 'none';
        });
        document.getElementById('display-selected-koma').innerText = `${this.selectedKoma + 1}番`;
      };
    });

    // 適用ボタン
    document.getElementById('btn-apply-target').onclick = () => {
      targetManager.setCurrentTarget(this.selectedKoma, this.selectedPosId);
      this.renderPresetsList();
      const posName = POSITIONS.find(p => p.id === this.selectedPosId)?.name;
      const btn = document.getElementById('btn-apply-target');
      const originalText = btn.innerText;
      btn.innerText = `✓ ${this.selectedKoma + 1}番 (${posName}) に設定完了`;
      btn.style.background = 'linear-gradient(135deg, #16a34a, #059669)';
      setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = '';
      }, 1500);
    };

    // プリセット追加
    document.getElementById('btn-add-preset').onclick = () => {
      const s = settings.get();
      const seq = this.machineData.reels[s.reel || 'left'] || [];
      const sym = seq[this.selectedKoma] || 'r7';
      const meta = this.machineData.symbols[sym] || { name: sym };
      const posName = POSITIONS.find(p => p.id === this.selectedPosId)?.name || '中段';
      const defaultName = `${meta.name} ${posName}ビタ`;

      const name = prompt('プリセット名を入力してください:', defaultName);
      if (name && name.trim()) {
        targetManager.addPreset(name.trim(), this.selectedKoma, this.selectedPosId);
        this.renderPresetsList();
      }
    };

    // プリセット操作イベント委任
    this.container.addEventListener('click', (e) => {
      const useId = e.target.closest('[data-use-preset]')?.dataset.usePreset;
      if (useId) {
        const found = targetManager.getPresets().find(p => p.id === useId);
        if (found) {
          this.selectedKoma = found.komaIndex;
          this.selectedPosId = found.posId;
          targetManager.setCurrentTarget(found.komaIndex, found.posId);
          this.renderDOM();
          this.setupEvents();
        }
      }

      const delId = e.target.closest('[data-del-preset]')?.dataset.delPreset;
      if (delId) {
        if (confirm('このプリセットを削除しますか？')) {
          targetManager.removePreset(delId);
          this.renderPresetsList();
        }
      }
    });
  }
}
