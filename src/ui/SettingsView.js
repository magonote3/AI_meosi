// 設定ビュー（実寸キャリブレーション・実機画像取り込み・遅延補正）
import { settings, pxPerMm, DEFAULT_PX_PER_MM } from '../core/settings.js';
import { saveImage, removeImage, getImage } from '../storage/imageStore.js';

export class SettingsView {
  constructor(container, machineData, onReloadNeeded) {
    this.container = container;
    this.machineData = machineData;
    this.onReloadNeeded = onReloadNeeded;

    this.init();
  }

  init() {
    this.renderDOM();
    this.setupEvents();
    this.checkCurrentStrip();
  }

  renderDOM() {
    const s = settings.get();

    this.container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px; max-width:800px; margin:0 auto; width:100%;">
        <!-- Real Machine Image Import Section -->
        <div class="glass-panel" style="padding:24px;">
          <h2 style="font-size:1.3rem; color:var(--accent-purple); margin-bottom:8px;">実機リール帯画像の取り込み</h2>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
            リール1本分（21コマ縦長）の画像をアップロードすると、実際の図柄で練習できます。（ブラウザ内にのみ安全に保存されます）
          </p>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; gap:12px; align-items:center;">
              <input type="file" id="file-strip-upload" accept="image/*" style="display:none;" />
              <button class="btn btn-primary" id="btn-trigger-upload">
                📷 リール画像を選択・取り込み
              </button>
              <button class="btn btn-danger" id="btn-remove-image" style="display:none;">
                画像を削除して標準SVGに戻す
              </button>
            </div>
            <div id="image-status-text" style="font-size:0.85rem; color:var(--text-dim);">
              現在: 標準SVG図柄を使用中
            </div>
          </div>
        </div>

        <!-- Reel & Layout Settings -->
        <div class="glass-panel" style="padding:24px;">
          <h2 style="font-size:1.3rem; color:var(--accent-cyan); margin-bottom:16px;">リール表示・機種設定</h2>
          
          <div class="form-group" style="margin-bottom:16px;">
            <label>練習する機種</label>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              <button class="btn btn-secondary ${s.machineId === 'discup_ultraremix' ? 'active' : ''}" data-machine="discup_ultraremix">
                ディスクアップ ULTRAREMIX (20コマ)
              </button>
              <button class="btn btn-secondary ${s.machineId === 'thunderv' ? 'active' : ''}" data-machine="thunderv">
                スマスロ サンダーV (21コマ)
              </button>
            </div>
          </div>

          <div class="form-group" style="margin-bottom:16px;">
            <label>練習するリール位置</label>
            <div style="display:flex; gap:8px;">
              ${['left', 'center', 'right'].map(r => `
                <button class="btn btn-secondary ${s.reel === r ? 'active' : ''}" data-reel="${r}">
                  ${r === 'left' ? '左リール' : (r === 'center' ? '中リール' : '右リール')}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="form-group" style="margin-bottom:16px;">
            <label>
              <span>リールサイズ比率 (実機比 70%〜250%)</span>
              <strong id="val-size-pct">${s.sizePct}%</strong>
            </label>
            <input type="range" id="input-size-pct" min="70" max="250" step="5" value="${s.sizePct}" />
          </div>

          <div class="form-group">
            <label>
              <span>入力遅延補正 (ms)</span>
              <strong id="val-offset-ms">${s.inputOffsetMs > 0 ? '+' : ''}${s.inputOffsetMs} ms</strong>
            </label>
            <input type="range" id="input-offset-ms" min="-100" max="100" step="5" value="${s.inputOffsetMs}" />
            <small style="color:var(--text-dim); font-size:0.75rem;">
              目押しが実機より早く止まる/遅く止まる場合の端末遅延補正値です。
            </small>
          </div>
        </div>

        <!-- Calibration Section (Credit Card) -->
        <div class="glass-panel" style="padding:24px;">
          <h2 style="font-size:1.3rem; color:var(--accent-gold); margin-bottom:8px;">実寸キャリブレーション</h2>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
            画面上の青い枠に実物のクレジットカード（横幅85.6mm）を重ね、スライダーで幅をぴったり合わせてください。実機サイズ（70〜250%）がミリ単位で正確に再現されます。
          </p>

          <div style="display:flex; flex-direction:column; align-items:center; gap:16px; margin:16px 0;">
            <div id="card-guide-box" style="
              width: ${(s.pxPerMm || DEFAULT_PX_PER_MM) * 85.6}px;
              height: ${(s.pxPerMm || DEFAULT_PX_PER_MM) * 53.98}px;
              border: 2px dashed var(--accent-cyan);
              border-radius: 8px;
              background: rgba(6, 182, 212, 0.08);
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--accent-cyan);
              font-size: 0.85rem;
              text-align: center;
              transition: width 0.05s ease, height 0.05s ease;
            ">
              💳 クレジットカードをここに合わせる<br/>(幅 85.6mm)
            </div>

            <div style="width:100%; max-width:400px;" class="form-group">
              <label>
                <span>カード枠幅の調整</span>
                <strong id="val-card-px">${Math.round((s.pxPerMm || DEFAULT_PX_PER_MM) * 85.6)} px</strong>
              </label>
              <input type="range" id="input-card-width" min="200" max="500" step="1" 
                     value="${Math.round((s.pxPerMm || DEFAULT_PX_PER_MM) * 85.6)}" />
            </div>

            <button class="btn btn-secondary" id="btn-reset-calibration" style="font-size:0.85rem;">
              標準解像度 (96 DPI) にリセット
            </button>
          </div>
        </div>

        <!-- Audio Settings -->
        <div class="glass-panel" style="padding:24px;">
          <h2 style="font-size:1.3rem; color:#fff; margin-bottom:16px;">サウンド設定</h2>
          <div class="form-group" style="margin-bottom:16px;">
            <label>
              <span>効果音ボリューム</span>
              <strong id="val-vol">${Math.round(s.volume * 100)}%</strong>
            </label>
            <input type="range" id="input-vol" min="0" max="1" step="0.05" value="${s.volume}" />
          </div>
          <div class="form-group" style="flex-direction:row; justify-content:space-between; align-items:center;">
            <label style="margin:0;">ミュート (消音)</label>
            <input type="checkbox" id="check-mute" ${s.muted ? 'checked' : ''} />
          </div>
        </div>
      </div>
    `;
  }

  async checkCurrentStrip() {
    const s = settings.get();
    const key = `strip:${s.machineId}:${s.reel}`;
    const data = await getImage(key);
    const statusText = document.getElementById('image-status-text');
    const removeBtn = document.getElementById('btn-remove-image');

    if (data) {
      statusText.innerText = '現在: ユーザー登録のカスタム実機画像を使用中';
      statusText.style.color = 'var(--accent-green)';
      removeBtn.style.display = 'inline-flex';
    } else if (s.machineId === 'discup_ultraremix') {
      statusText.innerText = '現在: ディスクアップ ULTRAREMIX 実機配列表画像を使用中 (有効)';
      statusText.style.color = 'var(--accent-green)';
      removeBtn.style.display = 'none';
    } else {
      statusText.innerText = '現在: 標準SVG図柄を使用中';
      statusText.style.color = 'var(--text-dim)';
      removeBtn.style.display = 'none';
    }
  }

  setupEvents() {
    // 機種選択ボタン
    this.container.querySelectorAll('[data-machine]').forEach(btn => {
      btn.onclick = () => {
        const machineId = btn.dataset.machine;
        const defaultReel = machineId === 'thunderv' ? 'left' : 'center';
        settings.set({ machineId, reel: defaultReel });
        this.container.querySelectorAll('[data-machine]').forEach(b => {
          b.classList.toggle('active', b.dataset.machine === machineId);
        });
        this.checkCurrentStrip();
        this.onReloadNeeded?.();
      };
    });

    // リール選択ボタン
    this.container.querySelectorAll('[data-reel]').forEach(btn => {
      btn.onclick = () => {
        const reel = btn.dataset.reel;
        settings.set({ reel });
        this.container.querySelectorAll('[data-reel]').forEach(b => {
          b.classList.toggle('active', b.dataset.reel === reel);
        });
        this.checkCurrentStrip();
        this.onReloadNeeded?.();
      };
    });

    // リールサイズ比率
    document.getElementById('input-size-pct').oninput = (e) => {
      const val = Number(e.target.value);
      document.getElementById('val-size-pct').innerText = `${val}%`;
      settings.set({ sizePct: val });
      this.onReloadNeeded?.();
    };

    // 遅延補正
    document.getElementById('input-offset-ms').oninput = (e) => {
      const val = Number(e.target.value);
      document.getElementById('val-offset-ms').innerText = `${val > 0 ? '+' : ''}${val} ms`;
      settings.set({ inputOffsetMs: val });
    };

    // キャリブレーションスライダー
    const cardGuide = document.getElementById('card-guide-box');
    document.getElementById('input-card-width').oninput = (e) => {
      const cardPx = Number(e.target.value);
      const computedPpm = cardPx / 85.6;
      document.getElementById('val-card-px').innerText = `${cardPx} px`;
      cardGuide.style.width = `${cardPx}px`;
      cardGuide.style.height = `${cardPx * (53.98 / 85.6)}px`;

      settings.set({ pxPerMm: computedPpm });
      this.onReloadNeeded?.();
    };

    document.getElementById('btn-reset-calibration').onclick = () => {
      settings.set({ pxPerMm: DEFAULT_PX_PER_MM });
      const px = Math.round(DEFAULT_PX_PER_MM * 85.6);
      document.getElementById('input-card-width').value = px;
      document.getElementById('val-card-px').innerText = `${px} px`;
      cardGuide.style.width = `${px}px`;
      cardGuide.style.height = `${px * (53.98 / 85.6)}px`;
      this.onReloadNeeded?.();
    };

    // 音量
    document.getElementById('input-vol').oninput = (e) => {
      const val = Number(e.target.value);
      document.getElementById('val-vol').innerText = `${Math.round(val * 100)}%`;
      settings.set({ volume: val });
    };
    document.getElementById('check-mute').onchange = (e) => {
      settings.set({ muted: e.target.checked });
    };

    // 画像アップロード
    const fileInput = document.getElementById('file-strip-upload');
    document.getElementById('btn-trigger-upload').onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const s = settings.get();
        const key = `strip:${s.machineId}:${s.reel}`;
        await saveImage(key, reader.result);
        alert('実機リール画像を取り込みました！');
        this.checkCurrentStrip();
        this.onReloadNeeded?.();
      };
      reader.readAsDataURL(file);
    };

    // 画像削除
    document.getElementById('btn-remove-image').onclick = async () => {
      if (confirm('カスタム画像を削除して標準SVGに戻しますか？')) {
        const s = settings.get();
        const key = `strip:${s.machineId}:${s.reel}`;
        await removeImage(key);
        this.checkCurrentStrip();
        this.onReloadNeeded?.();
      }
    };
  }
}
