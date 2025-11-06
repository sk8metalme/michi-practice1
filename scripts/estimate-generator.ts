/**
 * 見積もり分析スクリプト
 * design.md から工数見積もりを抽出・分析
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface EstimateData {
  feature: string;
  tasks: TaskEstimate[];
  totalDays: number;
  totalPoints: number;
  risks: RiskEstimate[];
  optimistic: number;
  standard: number;
  pessimistic: number;
}

export interface TaskEstimate {
  name: string;
  days: number;
  assignee: string;
  notes?: string;
}

export interface RiskEstimate {
  risk: string;
  impact: number;
  mitigation: string;
}

/**
 * design.mdから見積もりを抽出
 */
export function parseEstimateFromDesign(designPath: string): EstimateData {
  const content = readFileSync(designPath, 'utf-8');
  
  // 簡易パーサー（実際にはもっと洗練されたパーサーが必要）
  const tasks: TaskEstimate[] = [];
  let totalDays = 0;
  
  // 見積もりテーブルを正規表現で抽出（小数点対応）
  const tableRegex = /\|\s*([^|]+)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*([^|]+)\s*\|/g;
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const [, name, daysStr, assignee] = match;
    const days = parseFloat(daysStr);
    
    if (!isNaN(days) && name.trim() !== 'タスク' && name.trim() !== '**合計**') {
      tasks.push({
        name: name.trim(),
        days,
        assignee: assignee.trim()
      });
      totalDays += days;
    }
  }
  
  // リスク抽出（簡易版）
  const risks: RiskEstimate[] = [
    { risk: '技術的課題', impact: 5, mitigation: 'プロトタイプ検証' },
    { risk: '要件変更', impact: 3, mitigation: 'バッファ確保' }
  ];
  
  const riskTotal = risks.reduce((sum, r) => sum + r.impact, 0);
  
  return {
    feature: 'Unknown', // 実際にはファイル名から抽出
    tasks,
    totalDays,
    totalPoints: Math.ceil(totalDays / 0.5), // 1日 = 2SP
    risks,
    optimistic: totalDays,
    standard: totalDays + riskTotal,
    pessimistic: Math.ceil(totalDays * 1.5)
  };
}

/**
 * 見積もりサマリーをMarkdownで出力
 */
export function formatEstimateSummary(estimate: EstimateData): string {
  return `
# 見積もりサマリー: ${estimate.feature}

## タスク一覧

| タスク | 工数（人日） | 担当 |
|--------|-------------|------|
${estimate.tasks.map(t => `| ${t.name} | ${t.days} | ${t.assignee} |`).join('\n')}
| **合計** | **${estimate.totalDays}** | - |

## リスク

| リスク | 影響（人日） | 対策 |
|--------|-------------|------|
${estimate.risks.map(r => `| ${r.risk} | ${r.impact} | ${r.mitigation} |`).join('\n')}

## 最終見積もり

- **楽観的**: ${estimate.optimistic} 人日
- **標準的**: ${estimate.standard} 人日（リスク込み）
- **悲観的**: ${estimate.pessimistic} 人日

**推奨**: ${estimate.standard} 人日でスケジュール
`.trim();
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm run multi-estimate <feature-name>');
    process.exit(1);
  }
  
  const featureName = args[0];
  const designPath = resolve(`.kiro/specs/${featureName}/design.md`);
  
  try {
    const estimate = parseEstimateFromDesign(designPath);
    estimate.feature = featureName;
    console.log(formatEstimateSummary(estimate));
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

