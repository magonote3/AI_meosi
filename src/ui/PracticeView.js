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
      <div class="machine-frame real-cabinet">
        <!-- 実機キャビネット上部：LEDディスプレイ & インジケーターパネル -->
        <div class="cabinet-top-panel">
          <div class="indicator-lamps">
            <div class="lamp-unit">
              <span class="lamp-led bet-active" id="lamp-bet"></span>
              <span class="lamp-label">3 BET</span>
            </div>
            <div class="lamp-unit">
              <span class="lamp-led active" id="lamp-insert"></span>
              <span class="lamp-label">INSERT</span>
            </div>
            <div class="lamp-unit">
              <span class="lamp-led" id="lamp-spin"></span>
              <span class="lamp-label">SPIN</span>
            </div>
          </div>
          
          <div class="seven-segment-board">
            <div class="segment-block">
              <div class="segment-title">TARGET</div>
              <div class="target-symbol-pill">
                <div class="target-badge-symbol" id="hud-symbol-icon"></div>
                <div class="target-badge-info">
                  <p id="hud-symbol-name">-</p>
                </div>
              </div>
            </div>
            <div class="segment-block">
              <div class="segment-title">POS</div>
              <div class="seven-segment-display pos-display" id="hud-target-pos">中段</div>
            </div>
          </div>

          <button class="btn btn-secondary btn-icon" id="btn-toggle-assists" title="練習補助設定">
            ⚙️ 補助
          </button>
        </div>

        <!-- 実機リール窓（削り出し金属ベゼル ＆ アクリルガラス ＆ リール横タイミングバー） -->
        <div class="real-reel-bezel" id="reel-box">
          <div class="bezel-bolt top-left"></div>
          <div class="bezel-bolt top-right"></div>
          <div class="bezel-bolt bottom-left"></div>
          <div class="bezel-bolt bottom-right"></div>

          <div class="reel-assembly">
            <div class="reel-window-inner">
              <canvas id="practice-canvas"></canvas>
              <div class="reel-acrylic-glass"></div>
              <div class="reel-line-track">
                <div class="reel-guide-line" id="guide-top"><span class="line-lamp"></span><span class="line-lamp"></span></div>
                <div class="reel-guide-line active" id="guide-mid"><span class="line-lamp"></span><span class="line-lamp"></span></div>
                <div class="reel-guide-line" id="guide-bot"><span class="line-lamp"></span><span class="line-lamp"></span></div>
              </div>
            </div>

            <!-- リール横のタイミングバー -->
            <div class="timing-bar-enclosure" id="timing-bar-box" title="目押しタイミングバー">
              <div class="timing-bar-header">
                <span class="timing-header-dot"></span>
                <span class="timing-header-label">SYNC</span>
              </div>
              <div class="timing-bar-track" id="timing-bar-track">
                <div class="timing-grid-mark top"></div>
                <div class="timing-grid-mark mid"></div>
                <div class="timing-grid-mark bot"></div>
                <!-- JUST 判定ターゲットライン -->
                <div class="timing-hit-target" id="timing-hit-target">
                  <span class="timing-hit-badge">JUST</span>
                </div>
                <!-- リアルタイム降下タイミングマーカー -->
                <div class="timing-marker" id="timing-marker">
                  <span class="marker-glow"></span>
                  <span class="marker-core"></span>
                </div>
              </div>
              <div class="timing-bar-footer">
                <span class="timing-beat-meter" id="timing-beat-meter"></span>
              </div>
            </div>
          </div>
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
              <span style="color:#38bdf8;">◀ 早い [並 5/16]</span>
              <span style="color:#4ade80;">[良 7/16]</span>
              <span style="color:#f87171;">[超 4/16] 遅い ▶</span>
            </div>
          </div>
        </div>

        <!-- 実機操作デッキ（スタートレバー ＆ パチスロ丸型ストップボタン） -->
        <div class="machine-deck">
          <div class="lever-mount">
            <button class="real-lever-btn" id="btn-lever" title="レバーON (Space / ↑)">
              <div class="lever-stem"></div>
              <div class="lever-knob"></div>
            </button>
            <div class="lever-caption">START</div>
          </div>

          <div class="stop-mount">
            <button class="real-stop-btn" id="btn-stop" disabled title="ストップ (Enter / ↓ / Z)">
              <div class="stop-outer-ring">
                <div class="stop-inner-dome">
                  <div class="stop-led-core">
                    <span class="stop-label">STOP</span>
                  </div>
                </div>
              </div>
            </button>
            <div class="stop-caption">STOP 1</div>
          </div>
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
            <label style="margin:0;">リール横のタイミングバー</label>
            <input type="checkbox" id="check-timing-bar" checked />
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
    this.setupTimingBar();
    this.reelController.drawFrame(this.getAssistOptions());
  }

  setupTimingBar() {
    const p = practiceSettings.get();
    const barBox = document.getElementById('timing-bar-box');
    if (barBox) {
      barBox.style.display = p.timingBar !== false ? 'flex' : 'none';
    }

    const hitTarget = document.getElementById('timing-hit-target');
    const target = targetManager.getCurrentTarget();
    if (hitTarget) {
      // 狙う段に応じてJUST判定線の位置を調整（上段: 16.6%, 中段: 50%, 下段: 83.3%）
      const posPct = target.posId === 'top' ? '16.6%' : (target.posId === 'bot' ? '83.3%' : '50%');
      hitTarget.style.top = posPct;
    }

    this.reelController.onFrameCallback = (position, totalKoma, isRunning) => {
      this.updateTimingMarker(position, totalKoma, isRunning);
    };
  }

  updateTimingMarker(position, totalKoma, isRunning) {
    const marker = document.getElementById('timing-marker');
    const hitTarget = document.getElementById('timing-hit-target');
    const beatMeter = document.getElementById('timing-beat-meter');
    if (!marker) return;

    const target = targetManager.getCurrentTarget();
    const targetKoma = target.komaIndex;

    // 現在のリール位置 position とターゲットコマの差分（中心位置からのズレ）
    let diff = position - targetKoma;
    while (diff < -totalKoma / 2) diff += totalKoma;
    while (diff > totalKoma / 2) diff -= totalKoma;

    // リール窓の高さは3コマ分。diff = 0 のとき中段（50%）
    // リール上のターゲット図柄の物理Y座標と100%完全一致で追従
    const markerPct = (0.5 + (diff / 3)) * 100;

    if (markerPct >= -8 && markerPct <= 108) {
      marker.style.top = `${Math.max(0, Math.min(100, markerPct))}%`;
      marker.style.opacity = '1';
    } else {
      // 窓外：次に上から流れてくる準備として上部に待機
      marker.style.top = '0%';
      marker.style.opacity = '0.2';
    }

    // 狙い位置（target.posId）でのビタ通過フラッシュ
    const posOffset = target.posId === 'top' ? -1 : (target.posId === 'bot' ? 1 : 0);
    const hitDiff = Math.abs(diff - posOffset);

    if (hitDiff < 0.22) {
      hitTarget?.classList.add('hit-flash');
      beatMeter?.classList.add('pulse');
    } else {
      hitTarget?.classList.remove('hit-flash');
      beatMeter?.classList.remove('pulse');
    }
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
    const scale = (s.sizePct || 90) / 100;
    const komaH = (s.baseKomaHmm || 30) * ppm * scale;

    const gTop = document.getElementById('guide-top');
    const gMid = document.getElementById('guide-mid');
    const gBot = document.getElementById('guide-bot');

    if (gTop && gMid && gBot) {
      gTop.style.top = `${komaH * 0.5}px`;
      gMid.style.top = `${komaH * 1.5}px`;
      gBot.style.top = `${komaH * 2.5}px`;

      const target = targetManager.getCurrentTarget();
      const p = practiceSettings.get();
      const showGuide = p.guideLine;

      gTop.classList.toggle('active', showGuide && target.posId === 'top');
      gMid.classList.toggle('active', showGuide && target.posId === 'mid');
      gBot.classList.toggle('active', showGuide && target.posId === 'bot');
    }

    const hitTarget = document.getElementById('timing-hit-target');
    const target = targetManager.getCurrentTarget();
    if (hitTarget) {
      const posPct = target.posId === 'top' ? '16.6%' : (target.posId === 'bot' ? '83.3%' : '50%');
      hitTarget.style.top = posPct;
    }
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

      // レバーONアニメーション＆実機ランプ更新
      btnLever.classList.add('pressed');
      setTimeout(() => btnLever.classList.remove('pressed'), 180);

      document.getElementById('lamp-insert')?.classList.remove('active');
      document.getElementById('lamp-spin')?.classList.add('spin-active');

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

      // ストップボタン押し込みアニメーション＆実機ランプ復帰
      btnStop.classList.add('pressed');
      setTimeout(() => btnStop.classList.remove('pressed'), 140);

      document.getElementById('lamp-spin')?.classList.remove('spin-active');
      document.getElementById('lamp-insert')?.classList.add('active');

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
    document.getElementById('check-timing-bar').onchange = (e) => {
      practiceSettings.set({ timingBar: e.target.checked });
      const barBox = document.getElementById('timing-bar-box');
      if (barBox) {
        barBox.style.display = e.target.checked ? 'flex' : 'none';
      }
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
    document.getElementById('check-timing-bar').checked = p.timingBar !== false;
    document.getElementById('check-guide').checked = p.guideLine;
    document.getElementById('check-tick').checked = p.tickSound;
    document.getElementById('select-order').value = p.order;
  }

  destroy() {
    window.removeEventListener('keydown', this.keyHandler);
  }
}
