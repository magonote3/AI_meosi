// 本番モード ビュー
import { ReelController } from '../core/reel.js';
import { settings, pxPerMm } from '../core/settings.js';
import { targetManager, POSITIONS } from '../core/target.js';
import { JudgeEngine } from '../core/judge.js';
import { sound } from '../audio/sound.js';
import { statsTracker } from '../stats/tracker.js';
import { getSymbolSVG } from '../core/symbols.js';

export class RealView {
  constructor(container, machineData) {
    this.container = container;
    this.machineData = machineData;
    this.reelController = null;

    // ゲーム進行状態
    this.totalGames = 30;
    this.currentGame = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.successCount = 0;
    this.orderType = 'fixed'; // fixed | random
    this.resultsHistory = [];
    this.isSessionActive = false;

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
        <!-- Real Mode Header / Stats HUD (実機LEDディスプレイ) -->
        <div class="cabinet-top-panel">
          <div class="indicator-lamps">
            <div class="lamp-unit">
              <span class="lamp-led bet-active" id="real-lamp-bet"></span>
              <span class="lamp-label">3 BET</span>
            </div>
            <div class="lamp-unit">
              <span class="lamp-led active" id="real-lamp-insert"></span>
              <span class="lamp-label">INSERT</span>
            </div>
            <div class="lamp-unit">
              <span class="lamp-led" id="real-lamp-spin"></span>
              <span class="lamp-label">SPIN</span>
            </div>
          </div>

          <div class="seven-segment-board">
            <div class="segment-block">
              <div class="segment-title">GAME</div>
              <div class="seven-segment-display" id="hud-game-counter" style="color:var(--accent-pink); text-shadow:0 0 10px rgba(236,72,153,0.8);">0/30</div>
            </div>
            <div class="segment-block">
              <div class="segment-title">SCORE</div>
              <div class="seven-segment-display" id="hud-score" style="color:var(--accent-gold); text-shadow:0 0 10px rgba(234,179,8,0.8);">0</div>
            </div>
          </div>

          <div class="target-symbol-pill">
            <div class="target-badge-symbol" id="real-symbol-icon" style="width:34px; height:34px;"></div>
            <div class="target-badge-info">
              <p id="real-symbol-name" style="font-size:0.85rem;">-</p>
            </div>
          </div>
        </div>

        <!-- Reel Enclosure (本番仕様：削り出し金属ベゼル ＆ タイミングバー) -->
        <div class="real-reel-bezel" id="real-reel-box">
          <div class="bezel-bolt top-left"></div>
          <div class="bezel-bolt top-right"></div>
          <div class="bezel-bolt bottom-left"></div>
          <div class="bezel-bolt bottom-right"></div>

          <div class="reel-assembly">
            <div class="reel-window-inner">
              <canvas id="real-canvas"></canvas>
              <div class="reel-acrylic-glass"></div>
            </div>

            <!-- リール横のタイミングバー -->
            <div class="timing-bar-enclosure" id="real-timing-bar-box" title="目押しタイミングバー">
              <div class="timing-bar-header">
                <span class="timing-header-dot"></span>
                <span class="timing-header-label">SYNC</span>
              </div>
              <div class="timing-bar-track" id="real-timing-bar-track">
                <div class="timing-grid-mark top"></div>
                <div class="timing-grid-mark mid"></div>
                <div class="timing-grid-mark bot"></div>
                <div class="timing-hit-target" id="real-timing-hit-target">
                  <span class="timing-hit-badge">JUST</span>
                </div>
                <div class="timing-marker" id="real-timing-marker">
                  <span class="marker-glow"></span>
                  <span class="marker-core"></span>
                </div>
              </div>
              <div class="timing-bar-footer">
                <span class="timing-beat-meter" id="real-timing-beat-meter"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Judgment Banner & 16-Slice Visualizer -->
        <div id="judge-container" style="width:100%; max-width:480px;">
          <div class="judge-banner" id="real-judge-text">READY</div>
          <div class="judge-diff-detail" id="real-judge-detail"></div>

          <!-- 16分割 精密スライスメーター -->
          <div class="slice-gauge-container" id="real-slice-gauge-box">
            <div class="slice-gauge-track">
              <div class="slice-segment-cool" title="並ビタ (5/16)"></div>
              <div class="slice-segment-excellent" title="良ビタ (7/16)"></div>
              <div class="slice-segment-marvelous" title="超ビタ (4/16)"></div>
              <div class="slice-gauge-pin" id="real-slice-pin" style="left: 85%;"></div>
            </div>
            <div class="slice-gauge-labels">
              <span style="color:#38bdf8;">◀ [並 5/16]</span>
              <span style="color:#4ade80;">[良 7/16]</span>
              <span style="color:#f87171;">[超 4/16] ▶</span>
            </div>
          </div>
        </div>

        <!-- Controls (実機操作デッキ) -->
        <div class="machine-deck">
          <div class="lever-mount">
            <button class="real-lever-btn" id="real-btn-lever" title="レバーON (Space / ↑)">
              <div class="lever-stem"></div>
              <div class="lever-knob"></div>
            </button>
            <div class="lever-caption">START</div>
          </div>

          <div class="stop-mount">
            <button class="real-stop-btn" id="real-btn-stop" disabled title="ストップ (Enter / ↓ / Z)">
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

        <!-- Setup Bar (セッション開始前のみ表示) -->
        <div id="real-setup-bar" class="glass-card" style="display:flex; gap:16px; padding:12px 20px; align-items:center;">
          <label style="font-size:0.9rem; color:var(--text-muted);">規定G数:
            <select id="select-game-count" style="margin-left:6px; padding:6px; border-radius:6px; background:#000; color:#fff; border:1px solid var(--border-subtle);">
              <option value="10">10 G</option>
              <option value="30" selected>30 G</option>
              <option value="50">50 G</option>
              <option value="100">100 G</option>
            </select>
          </label>
          <label style="font-size:0.9rem; color:var(--text-muted);">出題:
            <select id="select-real-order" style="margin-left:6px; padding:6px; border-radius:6px; background:#000; color:#fff; border:1px solid var(--border-subtle);">
              <option value="fixed" selected>固定</option>
              <option value="random">ランダム</option>
            </select>
          </label>
        </div>
      </div>

      <!-- Result Modal -->
      <div class="modal-overlay" id="result-modal" style="display: none;">
        <div class="modal-content glass-panel" style="text-align:center;">
          <h2 style="font-family:var(--font-display); color:var(--accent-gold); font-size:1.8rem;">SESSION COMPLETE</h2>
          <div style="font-family:var(--font-display); font-size:2.4rem; font-weight:900; color:#fff;" id="res-score">SCORE: 0</div>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:16px 0;">
            <div class="glass-card" style="padding:12px;">
              <div style="color:var(--text-muted); font-size:0.85rem;">ビタ成功率</div>
              <div style="font-size:1.4rem; font-weight:800; color:var(--accent-green);" id="res-rate">0%</div>
            </div>
            <div class="glass-card" style="padding:12px;">
              <div style="color:var(--text-muted); font-size:0.85rem;">最大連続ビタ</div>
              <div style="font-size:1.4rem; font-weight:800; color:var(--accent-cyan);" id="res-combo">0 連</div>
            </div>
          </div>

          <!-- 精度内訳 (超ビタ・良ビタ・並ビタ) -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px;">
            <div class="glass-card" style="padding:8px; border-color:rgba(239,68,68,0.4);">
              <div style="color:#ff7b72; font-size:0.75rem; font-weight:700;">超ビタ (4/16)</div>
              <div style="font-size:1.2rem; font-weight:900; color:#ff3344;" id="res-cnt-marvelous">0</div>
            </div>
            <div class="glass-card" style="padding:8px; border-color:rgba(34,197,94,0.4);">
              <div style="color:#86efac; font-size:0.75rem; font-weight:700;">良ビタ (7/16)</div>
              <div style="font-size:1.2rem; font-weight:900; color:#22c55e;" id="res-cnt-excellent">0</div>
            </div>
            <div class="glass-card" style="padding:8px; border-color:rgba(6,182,212,0.4);">
              <div style="color:#7dd3fc; font-size:0.75rem; font-weight:700;">並ビタ (5/16)</div>
              <div style="font-size:1.2rem; font-weight:900; color:#06b6d4;" id="res-cnt-cool">0</div>
            </div>
          </div>

          <div class="form-group" style="text-align:left;">
            <label>ランキング登録用プレイヤー名</label>
            <input type="text" id="input-player-name" placeholder="名無しスロッター" maxlength="12" 
                   style="padding:10px; border-radius:8px; background:rgba(0,0,0,0.5); color:#fff; border:1px solid var(--border-accent);" />
          </div>

          <div style="display:flex; gap:12px; justify-content:center; margin-top:8px;">
            <button class="btn btn-primary" id="btn-save-ranking">ランキング保存</button>
            <button class="btn btn-secondary" id="btn-close-result">もう一度挑戦</button>
          </div>
        </div>
      </div>
    `;
  }

  setupReel() {
    const canvas = document.getElementById('real-canvas');
    this.reelController = new ReelController(canvas, this.machineData);
    const target = targetManager.getCurrentTarget();
    this.reelController.position = target.komaIndex;
    this.reelController.updateDimensions();
    this.setupTimingBar();
    // 本番モードは補助なし(null)で描画
    this.reelController.drawFrame(null);
  }

  setupTimingBar() {
    const hitTarget = document.getElementById('real-timing-hit-target');
    const target = targetManager.getCurrentTarget();
    if (hitTarget) {
      const posPct = target.posId === 'top' ? '16.6%' : (target.posId === 'bot' ? '83.3%' : '50%');
      hitTarget.style.top = posPct;
    }

    this.reelController.onFrameCallback = (position, totalKoma, isRunning) => {
      this.updateTimingMarker(position, totalKoma, isRunning);
    };
  }

  updateTimingMarker(position, totalKoma, isRunning) {
    const marker = document.getElementById('real-timing-marker');
    const hitTarget = document.getElementById('real-timing-hit-target');
    const beatMeter = document.getElementById('real-timing-beat-meter');
    if (!marker) return;

    const target = targetManager.getCurrentTarget();
    const targetKoma = target.komaIndex;

    let diff = position - targetKoma;
    while (diff < -totalKoma / 2) diff += totalKoma;
    while (diff > totalKoma / 2) diff -= totalKoma;

    const markerPct = (0.5 + (diff / 3)) * 100;

    if (markerPct >= -8 && markerPct <= 108) {
      marker.style.top = `${Math.max(0, Math.min(100, markerPct))}%`;
      marker.style.opacity = '1';
    } else {
      marker.style.top = '0%';
      marker.style.opacity = '0.2';
    }

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

  updateTargetDisplay() {
    const target = targetManager.getCurrentTarget();
    const seq = this.reelController.getCurrentReelSequence();
    const symbolName = seq[target.komaIndex] || 'r7';
    const symbolMeta = this.machineData.symbols?.[symbolName] || { name: symbolName };
    const posMeta = POSITIONS.find(p => p.id === target.posId);

    document.getElementById('real-symbol-icon').innerHTML = getSymbolSVG(symbolName, this.machineData?.id);
    document.getElementById('real-symbol-name').innerText = `${target.komaIndex + 1}番: ${symbolMeta.name} (${posMeta?.name || '中段'})`;

    const hitTarget = document.getElementById('real-timing-hit-target');
    if (hitTarget) {
      const posPct = target.posId === 'top' ? '16.6%' : (target.posId === 'bot' ? '83.3%' : '50%');
      hitTarget.style.top = posPct;
    }
  }

  setupEvents() {
    const btnLever = document.getElementById('real-btn-lever');
    const btnStop = document.getElementById('real-btn-stop');
    const selectGames = document.getElementById('select-game-count');
    const selectOrder = document.getElementById('select-real-order');

    selectGames.onchange = (e) => {
      this.totalGames = Number(e.target.value);
      document.getElementById('hud-game-counter').innerText = `0 / ${this.totalGames} G`;
    };
    selectOrder.onchange = (e) => {
      this.orderType = e.target.value;
    };

    const onLever = () => {
      if (this.reelController.isRunning) return;
      sound.playLever();

      // レバーONアニメーション＆実機ランプ更新
      btnLever.classList.add('pressed');
      setTimeout(() => btnLever.classList.remove('pressed'), 180);

      document.getElementById('real-lamp-insert')?.classList.remove('active');
      document.getElementById('real-lamp-spin')?.classList.add('spin-active');

      if (!this.isSessionActive) {
        this.isSessionActive = true;
        this.currentGame = 0;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.successCount = 0;
        this.resultsHistory = [];
        document.getElementById('real-setup-bar').style.display = 'none';
      }

      if (this.orderType === 'random') {
        const rand = targetManager.pickRandomTarget(this.reelController.getTotalKoma());
        targetManager.setCurrentTarget(rand.komaIndex, rand.posId);
        this.updateTargetDisplay();
      }

      // 実機速度 80RPM 固定
      this.reelController.start(80);
      btnLever.disabled = true;
      btnStop.disabled = false;

      document.getElementById('real-judge-text').innerText = 'SPINNING...';
      document.getElementById('real-judge-text').className = 'judge-banner';
      document.getElementById('real-judge-detail').innerText = '';
    };

    const onStop = (e) => {
      if (!this.reelController.isRunning) return;
      const timeStamp = e?.timeStamp || performance.now();
      const stopResult = this.reelController.stop(timeStamp);

      sound.playStop();

      // ストップボタン押し込みアニメーション＆実機ランプ復帰
      btnStop.classList.add('pressed');
      setTimeout(() => btnStop.classList.remove('pressed'), 140);

      document.getElementById('real-lamp-spin')?.classList.remove('spin-active');
      document.getElementById('real-lamp-insert')?.classList.add('active');

      btnStop.disabled = true;

      if (!stopResult) return;

      this.currentGame++;
      const target = targetManager.getCurrentTarget();
      const totalKoma = this.reelController.getTotalKoma();
      const judge = JudgeEngine.evaluate(stopResult, target, 80, totalKoma);
      this.resultsHistory.push(judge);

      // リール停止位置を判定結果のコマに確定して再描画
      this.reelController.applyStopKoma(judge.stoppedKoma);
      this.reelController.drawFrame(null);

      if (judge.isSuccess) {
        sound.playSuccess();
        this.successCount++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        // スコア加算（超ビタ・良ビタ・並ビタに応じたポイント変化）
        let basePts = 100;
        if (judge.grade === 'marvelous') basePts += 100; // 超ビタ: +100pt
        else if (judge.grade === 'excellent') basePts += 50; // 良ビタ: +50pt
        
        const comboPts = this.combo * 10;
        this.score += (basePts + comboPts);
      } else {
        sound.playFail();
        this.combo = 0;
      }

      // HUD更新
      document.getElementById('hud-game-counter').innerText = `${this.currentGame} / ${this.totalGames} G`;
      document.getElementById('hud-score').innerText = `SCORE: ${this.score}`;

      const jText = document.getElementById('real-judge-text');
      jText.innerText = judge.label;
      jText.className = `judge-banner ${judge.type}`;

      const jDetail = document.getElementById('real-judge-detail');
      const sign = judge.diffMs > 0 ? '+' : '';
      jDetail.innerText = `${judge.subLabel} (誤差: ${sign}${judge.diffMs}ms)`;

      // 16分割ピン
      const slicePin = document.getElementById('real-slice-pin');
      if (slicePin) {
        let pct = (judge.rawSlice / 15) * 100;
        pct = Math.max(-5, Math.min(105, pct));
        slicePin.style.left = `${pct}%`;
        slicePin.style.backgroundColor = judge.isSuccess ? '#fff' : (judge.rawSlice < 0 ? '#38bdf8' : '#f87171');
      }

      // 本番モード用データ記録
      const seq = this.reelController.getCurrentReelSequence();
      statsTracker.record('real', judge, target, {
        symbolName: seq[target.komaIndex],
        machineId: settings.get().machineId,
        reel: settings.get().reel
      });

      // セッション終了判定
      if (this.currentGame >= this.totalGames) {
        setTimeout(() => this.finishSession(), 600);
      } else {
        btnLever.disabled = false;
      }
    };

    btnLever.addEventListener('click', onLever);
    btnStop.addEventListener('pointerdown', onStop);

    // キーボード
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

    // リザルトモーダル
    document.getElementById('btn-save-ranking').onclick = () => {
      const name = document.getElementById('input-player-name').value.trim() || '名無し';
      const s = settings.get();
      const rankKey = `${s.machineId}:${s.reel}:${this.orderType}:${this.totalGames}G`;

      const rate = Math.round((this.successCount / this.totalGames) * 100);
      const avgMs = Math.round(this.resultsHistory.reduce((a, b) => a + Math.abs(b.diffMs), 0) / this.totalGames);

      statsTracker.addRanking(rankKey, {
        name,
        score: this.score,
        rate,
        maxCombo: this.maxCombo,
        avgMs,
        games: this.totalGames
      });

      document.getElementById('result-modal').style.display = 'none';
      this.resetSession();
    };

    document.getElementById('btn-close-result').onclick = () => {
      document.getElementById('result-modal').style.display = 'none';
      this.resetSession();
    };
  }

  finishSession() {
    this.isSessionActive = false;
    const rate = Math.round((this.successCount / this.totalGames) * 100);

    const cntMarvelous = this.resultsHistory.filter(r => r.grade === 'marvelous').length;
    const cntExcellent = this.resultsHistory.filter(r => r.grade === 'excellent').length;
    const cntCool = this.resultsHistory.filter(r => r.grade === 'cool').length;

    document.getElementById('res-score').innerText = `SCORE: ${this.score}`;
    document.getElementById('res-rate').innerText = `${rate}% (${this.successCount}/${this.totalGames})`;
    document.getElementById('res-combo').innerText = `${this.maxCombo} 連`;

    document.getElementById('res-cnt-marvelous').innerText = `${cntMarvelous}回`;
    document.getElementById('res-cnt-excellent').innerText = `${cntExcellent}回`;
    document.getElementById('res-cnt-cool').innerText = `${cntCool}回`;

    document.getElementById('result-modal').style.display = 'flex';
  }

  resetSession() {
    this.currentGame = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.successCount = 0;
    document.getElementById('hud-game-counter').innerText = `0 / ${this.totalGames} G`;
    document.getElementById('hud-score').innerText = 'SCORE: 0';
    document.getElementById('real-setup-bar').style.display = 'flex';
    document.getElementById('real-btn-lever').disabled = false;
    document.getElementById('real-btn-stop').disabled = true;
    document.getElementById('real-judge-text').innerText = 'READY';
    document.getElementById('real-judge-text').className = 'judge-banner';
  }

  destroy() {
    window.removeEventListener('keydown', this.keyHandler);
  }
}
