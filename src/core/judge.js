// 1コマ16分割 実機準拠ビタ押し精密判定エンジン（ディスクアップ2/ULTRAREMIX完全準拠）
import { TargetManager } from './target.js';

export const SLICES_PER_KOMA = 16;
export const BRAKE_SLICES = 5; // 実機の制動距離（5分割）

export class JudgeEngine {
  /**
   * 停止位置とターゲットから1コマ16分割判定を実行
   * @param {Object} stopResult { exactPosition, timestamp }
   * @param {Object} target { komaIndex, posId }
   * @param {number} rpm 現在の回転速度
   * @param {number} totalKoma コマ数 (20 or 21)
   */
  static evaluate(stopResult, target, rpm = 80, totalKoma = 20) {
    const { exactPosition } = stopResult;
    const { komaIndex: targetKoma, posId } = target;

    // 狙う段に応じた理想の中央コマ位置
    // mid(中段): ターゲットコマ自身 (targetKoma)
    // top(上段): ターゲットが上段に来るとき、中段には手前のコマ(targetKoma - 1)が位置する
    // bot(下段): ターゲットが下段に来るとき、中段には次のコマ(targetKoma + 1)が位置する
    const posOffset = TargetManager.getOffsetByPosId(posId);
    let idealCenter = (targetKoma + posOffset + totalKoma) % totalKoma;

    // 1コマあたりのミリ秒時間、1スライスあたりのミリ秒
    const msPerKoma = 60000 / (rpm * totalKoma);
    const msPerSlice = msPerKoma / SLICES_PER_KOMA;

    // 理想位置(idealCenter)に対するプレイヤーの押下位置の差分（コマ単位）
    // リールは上から下へ流れるため、
    // diffKoma < 0 : まだターゲットが狙った段に到達する手前（早いタイミング）
    // diffKoma = 0 : ターゲットが狙った段のど真ん中（ジャスト）
    // diffKoma > 0 : ターゲットが狙った段を通過した後（遅いタイミング）
    let diffKoma = exactPosition - idealCenter;
    if (diffKoma > totalKoma / 2) diffKoma -= totalKoma;
    if (diffKoma < -totalKoma / 2) diffKoma += totalKoma;

    // =========================================================================
    // 実機（ディスクアップ2/ULTRAREMIX）の1コマ16分割判定仕様:
    // リール制動距離(5分割)を考慮した押下可能エリア（計16分割 = 1.0コマ分）
    //
    // ・超ビタ (Marvelous! / 赤エリア 4分割):  -0.125コマ 〜 +0.125コマ (中心±2スライス)
    // ・良ビタ (Excellent! / 緑エリア 7分割):  -0.5625コマ 〜 -0.125コマ (早い側 7スライス)
    // ・並ビタ (Cool! / 青エリア 5分割):       -0.875コマ 〜 -0.5625コマ (さらに早い側 5スライス)
    //
    // 合計: 1.0コマ（-0.875コマ 〜 +0.125コマ）
    // =========================================================================

    // 成功エリア（-0.875 〜 +0.125コマ）を スライスメーター（0〜15）に線形マッピング
    const minSuccessOffset = -0.875;
    const maxSuccessOffset = 0.125;
    const successWidth = maxSuccessOffset - minSuccessOffset; // 1.0 コマ

    const normalizedSlice = ((diffKoma - minSuccessOffset) / successWidth) * SLICES_PER_KOMA;
    const sliceIndex = Math.floor(normalizedSlice);

    let isSuccess = false;
    let grade = 'miss_fast'; // 'marvelous' | 'excellent' | 'cool' | 'miss_fast' | 'miss_slow'
    let label = '';
    let subLabel = '';
    let type = 'fast';
    let stoppedKoma = idealCenter; // 停止先コマ

    if (diffKoma >= minSuccessOffset && diffKoma <= maxSuccessOffset) {
      isSuccess = true;
      stoppedKoma = idealCenter; // 成功時はターゲット位置にビタ止まり

      if (sliceIndex >= 12) {
        grade = 'marvelous';
        label = '超ビタ';
        subLabel = 'Marvelous! [赤エリア 4/16]';
        type = 'marvelous';
      } else if (sliceIndex >= 5) {
        grade = 'excellent';
        label = '良ビタ';
        subLabel = 'Excellent! [緑エリア 7/16]';
        type = 'excellent';
      } else {
        grade = 'cool';
        label = '並ビタ';
        subLabel = 'Cool! [青エリア 5/16]';
        type = 'cool';
      }
    } else if (diffKoma < minSuccessOffset) {
      grade = 'miss_fast';
      const komaShift = Math.max(1, Math.round(Math.abs(diffKoma - minSuccessOffset)));
      label = `早い (-${komaShift}コマ)`;
      subLabel = posId === 'mid' ? '上段に停止 (早すぎ)' : '早いタイミングで停止';
      type = 'fast';
      stoppedKoma = (idealCenter - komaShift + totalKoma) % totalKoma;
    } else {
      grade = 'miss_slow';
      const komaShift = Math.max(1, Math.round(diffKoma - maxSuccessOffset));
      label = `遅い (+${komaShift}コマ)`;
      subLabel = posId === 'mid' ? '下段に停止 (遅れ)' : '遅いタイミングで停止';
      type = 'slow';
      stoppedKoma = (idealCenter + komaShift) % totalKoma;
    }

    // ミリ秒誤差（ジャスト中心 diffKoma=0 からのズレ）
    const diffMs = Math.round(diffKoma * msPerKoma);

    return {
      isSuccess,
      grade,        // 'marvelous' | 'excellent' | 'cool' | 'miss_fast' | 'miss_slow'
      label,        // '超ビタ' | '良ビタ' | '並ビタ' など
      subLabel,     // 'Marvelous! [赤エリア 4/16]' など
      type,         // CSS class用
      sliceIndex: Math.min(15, Math.max(0, sliceIndex)), // メーターピン表示用（0〜15にクランプ）
      rawSlice: sliceIndex, // 生のスライス番号（枠外判定用）
      diffMs,       // ミリ秒誤差 (+/-)
      stoppedKoma,  // 最終停止コマ
      rpm
    };
  }
}
