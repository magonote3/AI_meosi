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
    this.onFrameCallback = null;

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
    const machineId = s.machineId || 'discup_ultraremix';
    const reel = s.reel || 'center';
    const key = `strip:${machineId}:${reel}`;
    
    // 1. ユーザー自身がアップロードしたIndexedDBのカスタム画像がある場合
    try {
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
    } catch {
      // ignore
    }

    // 2. 実機プリセットのPNG画像 (/machines/${machineId}/${reel}.png) を試みる
    const pngPath = `/machines/${machineId}/${reel}.png`;
    const pngImg = new Image();
    pngImg.onload = () => {
      this.customStripImg = pngImg;
      if (!this.isRunning) this.drawFrame();
    };
    pngImg.onerror = () => {
      // 3. なければSVGストリップ (/machines/${machineId}/${reel}.svg) を試みる
      const svgPath = `/machines/${machineId}/${reel}.svg`;
      const svgImg = new Image();
      svgImg.onload = () => {
        this.customStripImg = svgImg;
        if (!this.isRunning) this.drawFrame();
      };
      svgImg.onerror = () => {
        // 4. ベクター図柄レンダリングにフォールバック
        this.customStripImg = null;
        if (!this.isRunning) this.drawFrame();
      };
      svgImg.src = svgPath;
    };
    pngImg.src = pngPath;
  }

  getCurrentReelSequence() {
    const s = settings.get();
    const reelKey = s.reel || 'center';
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
    this.stopBounceStartTime = 0;
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
    this.stopBounceStartTime = performance.now(); // ステッピングモーターの微細反動

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
    this.stopBounceStartTime = performance.now();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.drawFrame();
  }

  /**
   * 物理寸法に基づくキャンバスサイズ更新
   */
  updateDimensions() {
    const s = settings.get();
    const ppm = pxPerMm();
    const scale = (s.sizePct || 90) / 100;

    const komaHeightPx = (s.baseKomaHmm || 30) * ppm * scale;
    const reelWidthPx = (s.baseReelWmm || 55) * ppm * scale;

    // 窓の高さは3コマ分
    const windowHeightPx = komaHeightPx * 3;

    // Retina / 高DPI対応
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(reelWidthPx * dpr);
    this.canvas.height = Math.round(windowHeightPx * dpr);
    this.canvas.style.width = `${reelWidthPx}px`;
    this.canvas.style.height = `${windowHeightPx}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
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
   * 1フレームの描画（実機物理円筒ドラム・バックライト・光沢・陰影）
   */
  drawFrame(targetOptions = null) {
    const s = settings.get();
    const p = practiceSettings.get();
    const ppm = pxPerMm();
    const scale = (s.sizePct || 90) / 100;
    const totalKoma = this.getTotalKoma();

    const komaH = (s.baseKomaHmm || 30) * ppm * scale;
    const reelW = (s.baseReelWmm || 55) * ppm * scale;
    const windowH = komaH * 3;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, reelW, windowH);

    // 1. 実機リールドラム基盤（アルミシリンダー＋バックライト拡散板）
    const drumBg = ctx.createLinearGradient(0, 0, reelW, 0);
    drumBg.addColorStop(0, '#111318');
    drumBg.addColorStop(0.06, '#282b35');
    drumBg.addColorStop(0.15, '#e2e8f0');
    drumBg.addColorStop(0.5, '#ffffff');
    drumBg.addColorStop(0.85, '#e2e8f0');
    drumBg.addColorStop(0.94, '#282b35');
    drumBg.addColorStop(1, '#111318');
    ctx.fillStyle = drumBg;
    ctx.fillRect(0, 0, reelW, windowH);

    const seq = this.getCurrentReelSequence();
    if (!seq.length) return;

    // ステッピングモーター停止時の超リアル微小バウンド（実機のダンピング反動）
    let bounceOffsetKoma = 0;
    if (!this.isRunning && this.stopBounceStartTime) {
      const elapsed = performance.now() - this.stopBounceStartTime;
      if (elapsed < 120) {
        // 減衰正弦波
        const t = elapsed / 120;
        bounceOffsetKoma = Math.sin(t * Math.PI * 3) * (1 - t) * 0.04;
      }
    }

    const centerPos = (this.position + bounceOffsetKoma + totalKoma * 10) % totalKoma;
    
    // 実機円筒ドラムの物理パラメータ
    // 直径約190mm、3コマ（90mm）の視野角
    const visibleRange = 3;
    const baseKoma = Math.round(centerPos);
    const subOffset = centerPos - baseKoma; // -0.5 〜 +0.5

    for (let offset = -visibleRange; offset <= visibleRange; offset++) {
      const currentKoma = (baseKoma + offset + totalKoma * 10) % totalKoma;
      const symbolName = seq[currentKoma];

      // 中心からの距離（コマ単位）
      const diffFromCenter = subOffset - offset;
      // 仮想シリンダー表面での角度 θ（ラジアン）
      // 3コマで約 54度（±27度）
      const angle = (diffFromCenter / 1.5) * (Math.PI / 6.2);

      // 円筒投影：y = R * sin(θ)
      const cylinderRadius = windowH * 0.98;
      const actualY = (windowH / 2) + Math.sin(angle) * cylinderRadius;
      
      // 法線による短縮率（見かけの高さ）
      const cosAngle = Math.cos(angle);
      const curveScale = Math.max(0.2, cosAngle);

      if (actualY < -komaH * 1.2 || actualY > windowH + komaH * 1.2) continue;

      ctx.save();
      ctx.translate(0, actualY);
      ctx.scale(1, curveScale);

      // --- 補助効果（実機バックライトギミック風） ---
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

      // 2. コマ背後の実機LEDバックライト（中央が明るく抜けるスポット）
      const backlightGrad = ctx.createRadialGradient(
        reelW * 0.5, 0, reelW * 0.05,
        reelW * 0.5, 0, reelW * 0.6
      );
      if (isTarget && targetOptions?.isPractice && p.glowTarget) {
        // ターゲットコマの超強力バックライト演出
        backlightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        backlightGrad.addColorStop(0.6, 'rgba(234, 179, 8, 0.2)');
        backlightGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      } else {
        // 通常の実機白色LEDバックライト
        backlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        backlightGrad.addColorStop(0.7, 'rgba(241, 245, 249, 0.1)');
        backlightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = backlightGrad;
      ctx.fillRect(0, -komaH / 2, reelW, komaH);

      // 3. 図柄レンダリング（実機高精細リールストリップ、またはベクター図柄）
      if (this.customStripImg) {
        const komaSrcH = this.customStripImg.naturalHeight / totalKoma;
        const komaSrcW = this.customStripImg.naturalWidth;
        const sy = currentKoma * komaSrcH;
        
        ctx.drawImage(
          this.customStripImg,
          0, sy, komaSrcW, komaSrcH,
          reelW * 0.03, -komaH / 2, reelW * 0.94, komaH
        );
      } else {
        const machineId = this.machineData?.id || 'discup_ultraremix';
        const img = getSymbolImage(symbolName, machineId);
        if (img) {
          if (img.complete && img.naturalWidth > 0) {
            const symW = reelW * 0.92;
            const symH = komaH * 0.88;
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

      // 4. 実機リールテープのコマ境界目地（パーティングライン）
      // 白いエッジハイライト＋シャドウによる本物のテープスリット
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(reelW * 0.03, -komaH / 2);
      ctx.lineTo(reelW * 0.97, -komaH / 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(reelW * 0.03, -komaH / 2 + 1);
      ctx.lineTo(reelW * 0.97, -komaH / 2 + 1);
      ctx.stroke();

      // 練習モードのターゲット枠 / 目印枠
      if (isTarget && targetOptions?.isPractice && p.glowTarget) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(reelW * 0.04, -komaH / 2 + 2, reelW * 0.92, komaH - 4);
      }

      if (isMarker && targetOptions?.isPractice && p.markerEnabled) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(reelW * 0.04, -komaH / 2 + 2, reelW * 0.92, komaH - 4);
      }

      ctx.restore();
    }

    // 5. 高速回転時のリアル・モーションブラー（残像感・スジ感）
    if (this.isRunning && this.rpm > 30) {
      const blurIntensity = Math.min(0.22, (this.rpm / 80) * 0.22);
      const blurGrad = ctx.createLinearGradient(0, 0, 0, windowH);
      for (let i = 0; i <= 10; i++) {
        const pos = i / 10;
        const alpha = Math.sin(pos * Math.PI * 6) * blurIntensity * 0.5 + blurIntensity * 0.5;
        blurGrad.addColorStop(pos, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
      }
      ctx.fillStyle = blurGrad;
      ctx.globalAlpha = blurIntensity;
      ctx.fillRect(0, 0, reelW, windowH);
      ctx.globalAlpha = 1.0;
    }

    // 6. 円筒シリンダーのリアル物理シャドウ（上端・下端の急激な落ち込み）
    // 上部の奥暗がり
    const shadowTop = ctx.createLinearGradient(0, 0, 0, komaH * 0.9);
    shadowTop.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
    shadowTop.addColorStop(0.3, 'rgba(0, 0, 0, 0.65)');
    shadowTop.addColorStop(0.7, 'rgba(0, 0, 0, 0.25)');
    shadowTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowTop;
    ctx.fillRect(0, 0, reelW, komaH * 0.9);

    // 下部の奥暗がり
    const shadowBottom = ctx.createLinearGradient(0, windowH - komaH * 0.9, 0, windowH);
    shadowBottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowBottom.addColorStop(0.3, 'rgba(0, 0, 0, 0.25)');
    shadowBottom.addColorStop(0.7, 'rgba(0, 0, 0, 0.65)');
    shadowBottom.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = shadowBottom;
    ctx.fillRect(0, windowH - komaH * 0.9, reelW, komaH * 0.9);

    // 7. リールドラム両端（シリンダー左右の湾曲シェード＆エッジハイライト）
    // 左端
    const shadowLeft = ctx.createLinearGradient(0, 0, reelW * 0.15, 0);
    shadowLeft.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    shadowLeft.addColorStop(0.3, 'rgba(0, 0, 0, 0.45)');
    shadowLeft.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
    shadowLeft.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowLeft;
    ctx.fillRect(0, 0, reelW * 0.15, windowH);

    // 右端
    const shadowRight = ctx.createLinearGradient(reelW * 0.85, 0, reelW, 0);
    shadowRight.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowRight.addColorStop(0.2, 'rgba(0, 0, 0, 0.1)');
    shadowRight.addColorStop(0.7, 'rgba(0, 0, 0, 0.45)');
    shadowRight.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = shadowRight;
    ctx.fillRect(reelW * 0.85, 0, reelW * 0.15, windowH);

    // 左右の細いドラムフランジ（シルバー金属エッジライン）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(reelW * 0.03, 0);
    ctx.lineTo(reelW * 0.03, windowH);
    ctx.moveTo(reelW * 0.97, 0);
    ctx.lineTo(reelW * 0.97, windowH);
    ctx.stroke();

    // フレーム毎の外部同期（タイミングバー等）コールバック
    if (this.onFrameCallback) {
      this.onFrameCallback(this.position, totalKoma, this.isRunning);
    }
  }
}
