// 練習モード ビュー
import { ReelController } from '../core/reel.js';
import { settings, practiceSettings, pxPerMm } from '../core/settings.js';
import { targetManager, POSITIONS } from '../core/target.js';
import { JudgeEngine } from '../core/judge.js';
import { sound } from '../audio/sound.js';
import { statsTracker } from '../stats/tracker.js';
import { getSymbolSVG } from '../core/symbols.js';

export class PracticeView {
  constructor(container, machineData) {
    this.container = container;
    this.machineData = machineData;
    this.reelController = null;
    this.recentJudges = []; // 自動ステップアップ判定用

    this.init();
  }

  init() {
    this.renderDOM();
    this.setupReel();
    this.setupEvents();
    this.updateTargetDisplay();
  }

  renderDOM() {
    this.container.innerHTML = `
      <div class="machine-frame">
        <!-- Target HUD -->
        <div class="target-hud glass-panel">
          <div class="target-badge">
            <div class="target-badge-symbol" id="hud-symbol-icon"></div>
            <div class="target-badge-info">
              <h4>TARGET</h4>
              <p id="hud-symbol-name">-</p>
            </div>
          </div>
          <div class="target-badge-pos" id="hud-target-pos">中段</div>
          <button class="btn btn-secondary btn-icon" id="btn-toggle-assists" title="練習補助設定">
            ⚙️ 補助設定
          </button>
        </div>

        <!-- Reel Enclosure -->
        <div class="reel-enclosure" id="reel-box">
          <canvas id="practice-canvas"></canvas>
          <div class="reel-glass-reflection"></div>
          <div class="reel-guide-line" id="guide-top"></div>
          <div class="reel-guide-line active" id="guide-mid"></div>
          <div class="reel-guide-line" id="guide-bot"></div>
        </div>

        <!-- Judgment Banner & 16-Slice Visualizer -->
        <div id="judge-container" style="width:100%; max-width:480px;">
          <div class="judge-banner" id="judge-text">READY</div>
          <div class="judge-diff-detail" id="judge-detail"></div>

          <!-- 16分割 精密スライスメーター -->
          <div class="slice-gauge-container" id="slice-gauge-box">
            <div class="slice-gauge-track">
              <div class="slice-segment-cool" title="並ビタ (5/16)"></div>
              <div class="slice-segment-excellent" title="良ビタ (7/16)"></div>
              <div class="slice-segment-marvelous" title="超ビタ (4/16)"></div>
              <div class="slice-gauge-pin" id="slice-pin" style="left: 85%;"></div>
            </div>
            <div class="slice-gauge-labels">
              <span style="color:#38bdf8;">◀ 早い [並ビタ 5/16]</span>
              <span style="color:#4ade80;">[良ビタ 7/16]</span>
              <span style="color:#f87171;">[超ビタ 4/16] 遅い ▶</span>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls-panel">
          <button class="lever-btn" id="btn-lever">LEVER ON</button>
          <button class="stop-btn" id="btn-stop" disabled>STOP</button>
        </div>
      </div>

      <!-- Practice Assists Drawer / Modal -->
      <div class="modal-overlay" id="assists-modal" style="display: none;">
        <div class="modal-content glass-panel">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>練習補助設定</h3>
            <button class="btn btn-secondary btn-icon" id="btn-close-assists">✕</button>
          </div>

          <div class="form-group">
            <label>
              <span>回転速度 (RPM)</span>
              <strong id="val-rpm">40 RPM</strong>
            </label>
            <input type="range" id="input-rpm" min="10" max="80" step="5" value="40" />
          </div>

          <div class="form-group" style="flex-direction:row; justify-content:space-between; align-items:center;">
            <label style="margin:0;">自動ステップアップ (80%超で+10RPM)</label>
            <input type="checkbox" id="check-auto-step" />
          </div>

          <hr style="border:0; border-top:1px solid var(--border-subtle);" />

          <div class="form-group" style="flex-direction:row; justify-content:space-between; align-items:center;">
            <label style="margin:0;">ターゲット以外を半透明化</label>
            <input type="checkbox" id="check-dim-enabled" checked />
          </div>

          <div class="form-group" id="group-dim-slider">
            <label>
              <span>他の図柄の不透明度</span>
              <strong id="val-dim">35%</strong>
            </label>
            <input type="range" id="input-dim" min="0" max="100" step="5" value="35" />
          </div>

          <div class="form-group" style="flex-direction:row; justify-content:space-between; align-items:center;">
            <label style="margin:0;">ターゲットを発光強調</label>
            <input type="checkbox" id="check-glow" checked />
          </div>

          <div class="form-group" style="flex-direction:row; justify-content:space-between; align-items:center;">
            <label style="margin:0;">狙う段のガイドライン</label>
            <input type="checkbox" id="check-guide" checked />
          </div>

          <div class="form-group" style="flex-direction:row; justify-content:space-between; align-items:center;">
            <label style="margin:0;">タイミング音 (止めどきクリック音)</label>
            <input type="checkbox" id="check-tick" />
          </div>

          <div class="form-group">
            <label>出題パターン</label>
            <select id="select-order" style="padding:8px; border-radius:8px; background:rgba(0,0,0,0.5); color:#fff; border:1px solid var(--border-subtle);">
              <option value="fixed">指定ターゲット固定</option>
              <option value="random">登録プリセットからランダム</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  setupReel() {
    const canvas = document.getElementById('practice-canvas');
    this.reelController = new ReelController(canvas, this.machineData);
    const target = targetManager.getCurrentTarget();
    this.reelController.position = target.komaIndex;
    this.reelController.updateDimensions();
    this.updateGuidePositions();
    this.reelController.drawFrame(this.getAssistOptions());
  }

  getAssistOptions() {
    const t = targetManager.getCurrentTarget();
    const p = practiceSettings.get();
    return {
      targetKoma: t.komaIndex,
      markerKoma: (t.komaIndex - (p.markerOffset || 2) + 21) % 21,
      isPractice: true
    };
  }

  updateGuidePositions() {
    const s = settings.get();
    const ppm = pxPerMm();
    const scale = (s.sizePct || 80) / 100;
    const komaH = (s.baseKomaHmm || 30) * ppm * scale;

    const gTop = document.getElementById('guide-top');
    const gMid = document.getElementById('guide-mid');
    const gBot = document.getElementById('guide-bot');

    gTop.style.top = `${komaH * 0.5 + 10}px`;
    gMid.style.top = `${komaH * 1.5 + 10}px`;
    gBot.style.top = `${komaH * 2.5 + 10}px`;

    const target = targetManager.getCurrentTarget();
    const p = practiceSettings.get();
    const showGuide = p.guideLine;

    gTop.classList.toggle('active', showGuide && target.posId === 'top');
    gMid.classList.toggle('active', showGuide && target.posId === 'mid');
    gBot.classList.toggle('active', showGuide && target.posId === 'bot');
  }

  updateTargetDisplay() {
    const target = targetManager.getCurrentTarget();
    const seq = this.reelController.getCurrentReelSequence();
    const symbolName = seq[target.komaIndex] || 'r7';
    const symbolMeta = this.machineData.symbols?.[symbolName] || { name: symbolName };
    const posMeta = POSITIONS.find(p => p.id === target.posId);

    document.getElementById('hud-symbol-icon').innerHTML = getSymbolSVG(symbolName, this.machineData?.id);
    document.getElementById('hud-symbol-name').innerText = `${target.komaIndex + 1}番: ${symbolMeta.name}`;
    document.getElementById('hud-target-pos').innerText = posMeta ? posMeta.name : '中段';

    this.updateGuidePositions();
    if (!this.reelController.isRunning) {
      this.reelController.drawFrame(this.getAssistOptions());
    }
  }

  setupEvents() {
    const btnLever = document.getElementById('btn-lever');
    const btnStop = document.getElementById('btn-stop');

    const onLever = () => {
      if (this.reelController.isRunning) return;
      sound.playLever();

      const p = practiceSettings.get();
      if (p.order === 'random') {
        const rand = targetManager.pickRandomTarget(21);
        targetManager.setCurrentTarget(rand.komaIndex, rand.posId);
        this.updateTargetDisplay();
      }

      this.reelController.start(p.rpm);
      btnLever.disabled = true;
      btnStop.disabled = false;

      document.getElementById('judge-text').innerText = 'SPINNING...';
      document.getElementById('judge-text').className = 'judge-banner';
      document.getElementById('judge-detail').innerText = '';
    };

    const onStop = (e) => {
      if (!this.reelController.isRunning) return;
      const timeStamp = e?.timeStamp || performance.now();
      const stopResult = this.reelController.stop(timeStamp);

      sound.playStop();
      btnLever.disabled = false;
      btnStop.disabled = true;

      if (!stopResult) return;

      const target = targetManager.getCurrentTarget();
      const p = practiceSettings.get();
      const totalKoma = this.reelController.getTotalKoma();
      const judge = JudgeEngine.evaluate(stopResult, target, p.rpm, totalKoma);

      // リール停止位置を判定結果のコマに確定して再描画
      this.reelController.applyStopKoma(judge.stoppedKoma);
      this.reelController.drawFrame(this.getAssistOptions());

      // 演出 & 音声
      if (judge.isSuccess) {
        sound.playSuccess();
      } else {
        sound.playFail();
      }

      // 判定テキスト更新 (超ビタ / 良ビタ / 並ビタ)
      const jText = document.getElementById('judge-text');
      jText.innerText = judge.label;
      jText.className = `judge-banner ${judge.type}`;

      const jDetail = document.getElementById('judge-detail');
      const sign = judge.diffMs > 0 ? '+' : '';
      jDetail.innerText = `${judge.subLabel} (誤差: ${sign}${judge.diffMs}ms)`;

      // 16分割スライスメーターのピン位置を更新
      const slicePin = document.getElementById('slice-pin');
      if (slicePin) {
        // 0〜15 を 0%〜100% にマッピング（枠外は-5%または105%で表示）
        let pct = (judge.rawSlice / 15) * 100;
        pct = Math.max(-5, Math.min(105, pct));
        slicePin.style.left = `${pct}%`;
        slicePin.style.backgroundColor = judge.isSuccess ? '#fff' : (judge.rawSlice < 0 ? '#38bdf8' : '#f87171');
      }

      // 記録
      const seq = this.reelController.getCurrentReelSequence();
      statsTracker.record('practice', judge, target, {
        symbolName: seq[target.komaIndex],
        machineId: settings.get().machineId,
        reel: settings.get().reel
      });

      // 自動ステップアップ処理
      if (p.autoStep) {
        this.recentJudges.push(judge.isSuccess);
        if (this.recentJudges.length > p.autoStepGames) {
          this.recentJudges.shift();
        }
        if (this.recentJudges.length === p.autoStepGames) {
          const successCount = this.recentJudges.filter(Boolean).length;
          const rate = (successCount / p.autoStepGames) * 100;
          if (rate >= p.autoStepRate && p.rpm < 80) {
            const nextRpm = Math.min(80, p.rpm + 10);
            practiceSettings.set({ rpm: nextRpm });
            document.getElementById('input-rpm').value = nextRpm;
            document.getElementById('val-rpm').innerText = `${nextRpm} RPM`;
            this.recentJudges = [];
            jDetail.innerText += ` ➔ 速度UP! (${nextRpm}RPM)`;
          }
        }
      }

      // 静止フレーム再描画（補助線やハイライト維持）
      this.reelController.drawFrame(this.getAssistOptions());
    };

    btnLever.addEventListener('click', onLever);
    btnStop.addEventListener('pointerdown', onStop);

    // キーボード操作
    this.keyHandler = (e) => {
      const s = settings.get();
      if (s.keys.lever.includes(e.code)) {
        e.preventDefault();
        onLever();
      } else if (s.keys.stop.includes(e.code)) {
        e.preventDefault();
        onStop(e);
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    // 補助設定モーダル制御
    const modal = document.getElementById('assists-modal');
    document.getElementById('btn-toggle-assists').onclick = () => {
      this.syncAssistsModal();
      modal.style.display = 'flex';
    };
    document.getElementById('btn-close-assists').onclick = () => modal.style.display = 'none';

    // 補助設定変更リスナー
    document.getElementById('input-rpm').oninput = (e) => {
      const val = Number(e.target.value);
      document.getElementById('val-rpm').innerText = `${val} RPM`;
      practiceSettings.set({ rpm: val });
    };
    document.getElementById('check-auto-step').onchange = (e) => {
      practiceSettings.set({ autoStep: e.target.checked });
      this.recentJudges = [];
    };
    document.getElementById('check-dim-enabled').onchange = (e) => {
      practiceSettings.set({ dimEnabled: e.target.checked });
      this.reelController.drawFrame(this.getAssistOptions());
    };
    document.getElementById('input-dim').oninput = (e) => {
      const val = Number(e.target.value);
      document.getElementById('val-dim').innerText = `${val}%`;
      practiceSettings.set({ dimOthers: val });
      this.reelController.drawFrame(this.getAssistOptions());
    };
    document.getElementById('check-glow').onchange = (e) => {
      practiceSettings.set({ glowTarget: e.target.checked });
      this.reelController.drawFrame(this.getAssistOptions());
    };
    document.getElementById('check-guide').onchange = (e) => {
      practiceSettings.set({ guideLine: e.target.checked });
      this.updateGuidePositions();
    };
    document.getElementById('check-tick').onchange = (e) => {
      practiceSettings.set({ tickSound: e.target.checked });
    };
    document.getElementById('select-order').onchange = (e) => {
      practiceSettings.set({ order: e.target.value });
    };
  }

  syncAssistsModal() {
    const p = practiceSettings.get();
    document.getElementById('input-rpm').value = p.rpm;
    document.getElementById('val-rpm').innerText = `${p.rpm} RPM`;
    document.getElementById('check-auto-step').checked = p.autoStep;
    document.getElementById('check-dim-enabled').checked = p.dimEnabled;
    document.getElementById('input-dim').value = p.dimOthers;
    document.getElementById('val-dim').innerText = `${p.dimOthers}%`;
    document.getElementById('check-glow').checked = p.glowTarget;
    document.getElementById('check-guide').checked = p.guideLine;
    document.getElementById('check-tick').checked = p.tickSound;
    document.getElementById('select-order').value = p.order;
  }

  destroy() {
    window.removeEventListener('keydown', this.keyHandler);
  }
}
