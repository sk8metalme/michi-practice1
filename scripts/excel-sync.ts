/**
 * Excel/Google Sheets連携スクリプト
 * 見積もりデータをExcel/Sheetsに出力
 */

import ExcelJS from 'exceljs';
import { resolve } from 'path';
import { parseEstimateFromDesign, type EstimateData } from './estimate-generator.js';

/**
 * 見積もりデータをExcelファイルに出力
 */
export async function exportToExcel(
  estimates: EstimateData[],
  outputPath: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('見積もりサマリー');
  
  // ヘッダー
  worksheet.columns = [
    { header: 'プロジェクト/機能', key: 'feature', width: 30 },
    { header: '楽観的（人日）', key: 'optimistic', width: 15 },
    { header: '標準的（人日）', key: 'standard', width: 15 },
    { header: '悲観的（人日）', key: 'pessimistic', width: 15 },
    { header: 'ストーリーポイント', key: 'points', width: 18 },
    { header: 'タスク数', key: 'taskCount', width: 12 }
  ];
  
  // データ追加
  for (const estimate of estimates) {
    worksheet.addRow({
      feature: estimate.feature,
      optimistic: estimate.optimistic,
      standard: estimate.standard,
      pessimistic: estimate.pessimistic,
      points: estimate.totalPoints,
      taskCount: estimate.tasks.length
    });
  }
  
  // スタイリング
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // 合計行
  const totalRow = worksheet.addRow({
    feature: '合計',
    optimistic: estimates.reduce((sum, e) => sum + e.optimistic, 0),
    standard: estimates.reduce((sum, e) => sum + e.standard, 0),
    pessimistic: estimates.reduce((sum, e) => sum + e.pessimistic, 0),
    points: estimates.reduce((sum, e) => sum + e.totalPoints, 0),
    taskCount: estimates.reduce((sum, e) => sum + e.tasks.length, 0)
  });
  totalRow.font = { bold: true };
  
  // ファイル保存（親ディレクトリを作成）
  const { dirname } = await import('path');
  const { mkdir } = await import('fs/promises');
  await mkdir(dirname(outputPath), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Excel file saved: ${outputPath}`);
}

/**
 * Google Sheetsに出力（TODO: Google Sheets API連携）
 */
export async function exportToGoogleSheets(
  estimates: EstimateData[],
  spreadsheetId: string
): Promise<void> {
  // TODO: Google Sheets API連携を実装
  // 1. googleapis ライブラリを使用
  // 2. サービスアカウントまたはOAuth認証
  // 3. スプレッドシートにデータを書き込み
  
  console.log('Google Sheets連携は未実装です');
  console.log('spreadsheetId:', spreadsheetId);
  console.log('Estimates:', estimates.length);
}

/**
 * マルチプロジェクト見積もり集計
 */
export async function aggregateMultiProjectEstimates(
  projectRoots: string[]
): Promise<EstimateData[]> {
  const allEstimates: EstimateData[] = [];
  
  for (const projectRoot of projectRoots) {
    // TODO: 各プロジェクトの.kiro/specs/を走査して見積もりを収集
    // 現在は簡易版
    console.log(`Scanning project: ${projectRoot}`);
  }
  
  return allEstimates;
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm run excel:sync <feature-name>');
    process.exit(1);
  }
  
  const featureName = args[0];
  const designPath = resolve(`.kiro/specs/${featureName}/design.md`);
  const outputPath = resolve(`./estimates/${featureName}-estimate.xlsx`);
  
  try {
    const estimate = parseEstimateFromDesign(designPath);
    estimate.feature = featureName;
    
    exportToExcel([estimate], outputPath)
      .then(() => {
        console.log('✅ Export completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Export failed:', error.message);
        process.exit(1);
      });
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

