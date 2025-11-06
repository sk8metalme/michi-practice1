/**
 * フェーズ完了バリデーションスクリプト
 * 各フェーズで必須項目が完了しているかチェック
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { loadProjectMeta } from './utils/project-meta.js';

type Phase = 'requirements' | 'design' | 'tasks';

interface ValidationResult {
  phase: Phase;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * spec.jsonを読み込み
 */
function loadSpecJson(feature: string): any {
  const specPath = join(process.cwd(), '.kiro', 'specs', feature, 'spec.json');
  
  if (!existsSync(specPath)) {
    throw new Error(`spec.json not found: ${specPath}`);
  }
  
  return JSON.parse(readFileSync(specPath, 'utf-8'));
}

/**
 * 要件定義フェーズのバリデーション
 */
function validateRequirements(feature: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. requirements.md存在チェック
  const requirementsPath = join(process.cwd(), '.kiro', 'specs', feature, 'requirements.md');
  if (!existsSync(requirementsPath)) {
    errors.push('❌ requirements.md が作成されていません');
  }
  
  // 2. spec.json読み込み
  let spec: any;
  try {
    spec = loadSpecJson(feature);
  } catch (error: any) {
    errors.push(`❌ spec.json読み込みエラー: ${error.message}`);
    return { phase: 'requirements', valid: false, errors, warnings };
  }
  
  // 3. Confluenceページ作成チェック（必須）
  if (!spec.confluence?.requirementsPageId) {
    errors.push('❌ Confluenceページ（要件定義）が作成されていません');
    errors.push('   → 実行: npm run confluence:sync <feature> requirements');
  }
  
  // 4. spec.jsonのconfluence情報チェック
  if (!spec.confluence?.spaceKey) {
    errors.push('❌ spec.jsonにconfluence.spaceKeyが記録されていません');
  }
  
  // 5. マイルストーン更新チェック
  if (!spec.milestones?.requirements?.completed) {
    warnings.push('⚠️  spec.jsonのmilestones.requirements.completedがfalseです');
  }
  
  return {
    phase: 'requirements',
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 設計フェーズのバリデーション
 */
function validateDesign(feature: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. design.md存在チェック
  const designPath = join(process.cwd(), '.kiro', 'specs', feature, 'design.md');
  if (!existsSync(designPath)) {
    errors.push('❌ design.md が作成されていません');
  }
  
  // 2. spec.json読み込み
  let spec: any;
  try {
    spec = loadSpecJson(feature);
  } catch (error: any) {
    errors.push(`❌ spec.json読み込みエラー: ${error.message}`);
    return { phase: 'design', valid: false, errors, warnings };
  }
  
  // 3. 前提: 要件定義完了チェック
  if (!spec.milestones?.requirements?.completed) {
    errors.push('❌ 要件定義が完了していません（前提条件）');
  }
  
  // 4. Confluenceページ作成チェック（必須）
  if (!spec.confluence?.designPageId) {
    errors.push('❌ Confluenceページ（設計書）が作成されていません');
    errors.push('   → 実行: npm run confluence:sync <feature> design');
  }
  
  // 5. マイルストーン更新チェック
  if (!spec.milestones?.design?.completed) {
    warnings.push('⚠️  spec.jsonのmilestones.design.completedがfalseです');
  }
  
  return {
    phase: 'design',
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * タスク分割フェーズのバリデーション
 */
function validateTasks(feature: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. tasks.md存在チェック
  const tasksPath = join(process.cwd(), '.kiro', 'specs', feature, 'tasks.md');
  if (!existsSync(tasksPath)) {
    errors.push('❌ tasks.md が作成されていません');
  } else {
    // 営業日表記チェック
    const tasksContent = readFileSync(tasksPath, 'utf-8');
    if (!tasksContent.includes('（月）') && !tasksContent.includes('（火）')) {
      warnings.push('⚠️  tasks.mdに曜日表記（月、火、水...）が含まれていません');
    }
    if (!tasksContent.includes('Day 1') && !tasksContent.includes('Day1')) {
      warnings.push('⚠️  tasks.mdに営業日カウント（Day 1, Day 2...）が含まれていません');
    }
    if (!tasksContent.includes('土日')) {
      warnings.push('⚠️  tasks.mdに土日休みの明記がありません');
    }
  }
  
  // 2. spec.json読み込み
  let spec: any;
  try {
    spec = loadSpecJson(feature);
  } catch (error: any) {
    errors.push(`❌ spec.json読み込みエラー: ${error.message}`);
    return { phase: 'tasks', valid: false, errors, warnings };
  }
  
  // 3. 前提: 設計完了チェック
  if (!spec.milestones?.design?.completed) {
    errors.push('❌ 設計が完了していません（前提条件）');
  }
  
  // 4. JIRA Epic作成チェック（必須）
  if (!spec.jira?.epicKey) {
    errors.push('❌ JIRA Epicが作成されていません');
    errors.push('   → 実行: npm run jira:sync <feature>');
  }
  
  // 5. JIRA Story作成チェック（必須）
  if (!spec.jira?.stories || spec.jira.stories.created === 0) {
    errors.push('❌ JIRA Storyが1つも作成されていません');
    errors.push('   → 実行: npm run jira:sync <feature>');
  } else if (spec.jira.stories.created < spec.jira.stories.total) {
    warnings.push(`⚠️  JIRA Storyが一部未作成: ${spec.jira.stories.created}/${spec.jira.stories.total}`);
  }
  
  // 6. マイルストーン更新チェック
  if (!spec.milestones?.tasks?.completed) {
    warnings.push('⚠️  spec.jsonのmilestones.tasks.completedがfalseです');
  }
  
  return {
    phase: 'tasks',
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * フェーズをバリデート
 */
export function validatePhase(feature: string, phase: Phase): ValidationResult {
  console.log(`\n🔍 Validating phase: ${phase} for feature: ${feature}`);
  
  let result: ValidationResult;
  
  switch (phase) {
    case 'requirements':
      result = validateRequirements(feature);
      break;
    case 'design':
      result = validateDesign(feature);
      break;
    case 'tasks':
      result = validateTasks(feature);
      break;
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
  
  // 結果表示
  console.log('\n📊 Validation Result:');
  
  if (result.errors.length > 0) {
    console.log('\n❌ エラー:');
    result.errors.forEach(err => console.log(`  ${err}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  警告:');
    result.warnings.forEach(warn => console.log(`  ${warn}`));
  }
  
  if (result.valid) {
    console.log('\n✅ バリデーション成功: すべての必須項目が完了しています');
  } else {
    console.log('\n❌ バリデーション失敗: 上記のエラーを修正してください');
  }
  
  return result;
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: npm run validate:phase <feature> <phase>');
    console.error('Example: npm run validate:phase calculator-app requirements');
    console.error('Phases: requirements, design, tasks');
    process.exit(1);
  }
  
  const [feature, phase] = args;
  
  if (!['requirements', 'design', 'tasks'].includes(phase)) {
    console.error('Invalid phase. Must be: requirements, design, or tasks');
    process.exit(1);
  }
  
  try {
    const result = validatePhase(feature, phase as Phase);
    process.exit(result.valid ? 0 : 1);
  } catch (error: any) {
    console.error(`\n❌ Validation error: ${error.message}`);
    process.exit(1);
  }
}

