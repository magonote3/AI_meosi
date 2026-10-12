// リール運動モデル & Canvas 2D 描画エンジン
import { getSymbolImage } from './symbols.js';
import { settings, practiceSettings, pxPerMm } from './settings.js';
import { getImage } from '../storage/imageStore.js';

export const TOTAL_KOMA = 21;

export class ReelController {
  constructor(canvas, machineData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.machineData = machineData;

    // 状態
    this.isRunning = false;
    this.position = 0; // コマ位置（連続値）
    this.stoppedKomaIndex = 0;
    this.lastTime = 0;
    this.rpm = 80;

    // 実機画像ストリップ (Image or null)
    this.customStripImg = null;

    // コールバック
    this.onStopCallback = null;

    // 描画ループID
    this.rafId = null;

    this.render = this.render.bind(this);
    this.loadCustomStrip();
  }

  getTotalKoma() {
    return this.machineData?.totalKoma || this.getCurrentReelSequence().length || 20;
  }

  setMachineData(data) {
    this.machineData = data;
    this.loadCustomStrip();
  }

  async loadCustomStrip() {
    const s = settings.get();
    const key = `strip:${s.machineId}:${s.reel}`;
    
    // ユーザー自身がアップロードしたIndexedDBのカスタム画像がある場合のみ使用
    const dataUrl = await getImage(key);
    if (dataUrl) {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => { 
        this.customStripImg = img;
        if (!this.isRunning) this.drawFrame();
      };
      return;
    }

    // デフォルトは高精細ベクター図柄（描画グラフィック）を使用
    this.customStripImg = null;
    if (!this.isRunning) this.drawFrame();
  }

  getCurrentReelSequence() {
    const s = settings.get();
    const reelKey = s.reel || 'left';
    return this.machineData?.reels?.[reelKey] || [];
  }

  /**
   * 回転開始
   * @param {number} customRpm 任意指定のRPM（練習モード用）
   */
  start(customRpm = 80) {
    this.rpm = customRpm;
    this.isRunning = true;
    this.lastTime = performance.now();
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.render);
    }
  }

  /**
   * 停止（滑りなし0コマ）
   * @param {number} eventTimeStamp 入力イベントの発生タイムスタンプ
   * @returns {Object} 停止結果 { komaIndex, exactPos, deviationMs, deviationKoma }
   */
  stop(eventTimeStamp = performance.now()) {
    if (!this.isRunning) return null;

    const s = settings.get();
    const offsetMs = s.inputOffsetMs || 0;
    const now = performance.now();
    const totalKoma = this.getTotalKoma();
    
    // イベント発生時刻と現在描画時刻の差分から逆算（遅延補正込み）
    const effectiveEventTime = eventTimeStamp + offsetMs;
    const dt = (now - effectiveEventTime) / 1000; // 秒差

    // 1秒あたりのコマ進行数
    const komaPerSec = (this.rpm / 60) * totalKoma;
    const rollbackKoma = dt * komaPerSec;

    // 正確な押下時位置
    let exactPosition = this.position - rollbackKoma;
    while (exactPosition < 0) exactPosition += totalKoma;
    exactPosition = exactPosition % totalKoma;

    // ビタ停止：最も近いコマに即時スナップ
    const snappedKoma = Math.round(exactPosition) % totalKoma;

    this.isRunning = false;
    this.position = snappedKoma;
    this.stoppedKomaIndex = snappedKoma;

    return {
      exactPosition,
      snappedKoma,
      timestamp: effectiveEventTime
    };
  }

  /**
   * 判定結果に基づきリールの最終停止位置を正確に確定
   * @param {number} finalKoma 確定コマインデックス
   */
  applyStopKoma(finalKoma) {
    const totalKoma = this.getTotalKoma();
    const normalizedKoma = (finalKoma + totalKoma * 10) % totalKoma;
    this.isRunning = false;
    this.position = normalizedKoma;
    this.stoppedKomaIndex = normalizedKoma;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 物理寸法に基づくキャンバスサイズ更新
   */
  updateDimensions() {
    const s = settings.get();
    const ppm = pxPerMm();
    const scale = (s.sizePct || 80) / 100;

    const komaHeightPx = (s.baseKomaHmm || 30) * ppm * scale;
    const reelWidthPx = (s.baseReelWmm || 55) * ppm * scale;

    // 窓の高さは3コマ分
    const windowHeightPx = komaHeightPx * 3;

    // Retina / 高DPI対応
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = reelWidthPx * dpr;
    this.canvas.height = windowHeightPx * dpr;
    this.canvas.style.width = `${reelWidthPx}px`;
    this.canvas.style.height = `${windowHeightPx}px`;

    this.ctx.scale(dpr, dpr);

    return { reelWidthPx, komaHeightPx, windowHeightPx };
  }

  /**
   * メイン描画ループ
   */
  render(currentTime) {
    if (this.isRunning) {
      const dt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      const totalKoma = this.getTotalKoma();

      const komaPerSec = (this.rpm / 60) * totalKoma;
      this.position = (this.position + dt * komaPerSec) % totalKoma;
    }

    this.drawFrame();

    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this.render);
    } else {
      this.rafId = null;
    }
  }

  /**
   * 1フレームの描画（円筒パース・補助対応）
   */
  drawFrame(targetOptions = null) {
    const s = settings.get();
    const p = practiceSettings.get();
    const ppm = pxPerMm();
    const scale = (s.sizePct || 80) / 100;
    const totalKoma = this.getTotalKoma();

    const komaH = (s.baseKomaHmm || 30) * ppm * scale;
    const reelW = (s.baseReelWmm || 55) * ppm * scale;
    const windowH = komaH * 3;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, reelW, windowH);

    // リール背景（スロットドラムの質感・アルミ/白バック）
    const drumBg = ctx.createLinearGradient(0, 0, reelW, 0);
    drumBg.addColorStop(0, '#1a1824');
    drumBg.addColorStop(0.1, '#f3f4f6');
    drumBg.addColorStop(0.5, '#ffffff');
    drumBg.addColorStop(0.9, '#f3f4f6');
    drumBg.addColorStop(1, '#1a1824');
    ctx.fillStyle = drumBg;
    ctx.fillRect(0, 0, reelW, windowH);

    const seq = this.getCurrentReelSequence();
    if (!seq.length) return;

    // 描画するコマ範囲: 窓中央は 中段(段1)
    // 上下は円筒の丸み表現で少し歪み・陰影をつける
    const centerPos = this.position;
    
    // 描画ループ: 窓の上下前後に余裕を持たせて前後4コマ描画
    // スロット実機準拠: 図柄は上から下に向かって流れる（中心位置が進むと下方向に落ちる）
    const visibleRange = 3;
    const baseKoma = Math.round(centerPos);
    const subOffset = centerPos - baseKoma; // -0.5 〜 +0.5

    for (let offset = -visibleRange; offset <= visibleRange; offset++) {
      const currentKoma = (baseKoma + offset + totalKoma * 10) % totalKoma;
      const symbolName = seq[currentKoma];

      // 中心からのズレ（時間が進む＝subOffsetが増えると、Yは下に落ちる）
      const diffFromCenter = subOffset - offset;
      const centerY = (windowH / 2) + diffFromCenter * komaH;

      if (centerY < -komaH || centerY > windowH + komaH) continue;

      // 円筒カーブ計算 (ドラムの湾曲表現)
      const normY = (centerY - windowH / 2) / (windowH / 2); // -1.0 〜 +1.0
      const curveScale = Math.cos(normY * 0.7); // 上下ほど少し縮小
      const actualY = (windowH / 2) + normY * (windowH / 2) * 0.95;

      ctx.save();
      ctx.translate(0, actualY);
      ctx.scale(1, curveScale);

      // --- 補助効果（半透明・発光など） ---
      let alpha = 1.0;
      let isTarget = false;
      let isMarker = false;

      if (targetOptions) {
        const { targetKoma, markerKoma, isPractice } = targetOptions;
        if (targetKoma === currentKoma) isTarget = true;
        if (markerKoma === currentKoma) isMarker = true;

        if (isPractice && p.dimEnabled && !isTarget) {
          alpha = (p.dimOthers ?? 35) / 100;
        }
      }

      ctx.globalAlpha = alpha;

      // コマ枠区切り線
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -komaH / 2);
      ctx.lineTo(reelW, -komaH / 2);
      ctx.stroke();

      // ターゲット発光エフェクト
      if (isTarget && targetOptions?.isPractice && p.glowTarget) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.fillRect(4, -komaH / 2 + 2, reelW - 8, komaH - 4);
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(4, -komaH / 2 + 2, reelW - 8, komaH - 4);
      }

      // 目印強調エフェクト
      if (isMarker && targetOptions?.isPractice && p.markerEnabled) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.fillRect(4, -komaH / 2 + 2, reelW - 8, komaH - 4);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, -komaH / 2 + 2, reelW - 8, komaH - 4);
      }

      // 図柄レンダリング（高精細ベクター図柄、またはユーザー登録の実機画像）
      if (this.customStripImg) {
        const komaSrcH = this.customStripImg.naturalHeight / totalKoma;
        const komaSrcW = this.customStripImg.naturalWidth;
        const sy = currentKoma * komaSrcH;
        ctx.drawImage(
          this.customStripImg,
          0, sy, komaSrcW, komaSrcH,
          reelW * 0.04, -komaH / 2 + komaH * 0.04, reelW * 0.92, komaH * 0.92
        );
      } else {
        const machineId = this.machineData?.id || 'discup_ultraremix';
        const img = getSymbolImage(symbolName, machineId);
        if (img) {
          if (img.complete && img.naturalWidth > 0) {
            const symW = reelW * 0.92;
            const symH = komaH * 0.86;
            const sx = (reelW - symW) / 2;
            const sy = -symH / 2;
            ctx.drawImage(img, sx, sy, symW, symH);
          } else if (!img.hasRenderListener) {
            img.hasRenderListener = true;
            img.onload = () => {
              if (!this.isRunning) this.drawFrame(targetOptions);
            };
          }
        }
      }

      ctx.restore();
    }

    // ドラムの上下の立体陰影グラデーション（円筒ドラムの影）
    const shadowTop = ctx.createLinearGradient(0, 0, 0, komaH * 0.8);
    shadowTop.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    shadowTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowTop;
    ctx.fillRect(0, 0, reelW, komaH * 0.8);

    const shadowBottom = ctx.createLinearGradient(0, windowH - komaH * 0.8, 0, windowH);
    shadowBottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowBottom.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = shadowBottom;
    ctx.fillRect(0, windowH - komaH * 0.8, reelW, komaH * 0.8);

    // リール枠の左右シャドウ
    const shadowLeft = ctx.createLinearGradient(0, 0, reelW * 0.1, 0);
    shadowLeft.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    shadowLeft.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowLeft;
    ctx.fillRect(0, 0, reelW * 0.1, windowH);

    const shadowRight = ctx.createLinearGradient(reelW * 0.9, 0, reelW, 0);
    shadowRight.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowRight.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = shadowRight;
    ctx.fillRect(reelW * 0.9, 0, reelW * 0.1, windowH);
  }
}
