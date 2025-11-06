/**
 * フェーズランナー
 * 各フェーズを実行し、Confluence/JIRA作成を確実に実行
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { syncToConfluence } from './confluence-sync.js';
import { syncTasksToJIRA } from './jira-sync.js';
import { validatePhase } from './validate-phase.js';
import { runPreFlightCheck } from './pre-flight-check.js';

type Phase = 'requirements' | 'design' | 'tasks';

interface PhaseRunResult {
  phase: Phase;
  success: boolean;
  confluenceCreated: boolean;
  jiraCreated: boolean;
  validationPassed: boolean;
  errors: string[];
}

/**
 * 要件定義フェーズを実行
 */
async function runRequirementsPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n📋 Phase: Requirements（要件定義）');
  console.log('='.repeat(60));
  
  const errors: string[] = [];
  let confluenceCreated = false;
  let confluenceUrl: string | null = null;
  
  // Step 1: requirements.md存在確認
  const requirementsPath = join(process.cwd(), '.kiro', 'specs', feature, 'requirements.md');
  if (!existsSync(requirementsPath)) {
    errors.push('requirements.mdが存在しません。先に/kiro:spec-requirements を実行してください');
    return {
      phase: 'requirements',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors
    };
  }
  
  console.log('✅ requirements.md 存在確認');
  
  // Step 2: Confluenceページ作成
  console.log('\n📤 Confluenceページ作成中...');
  try {
    confluenceUrl = await syncToConfluence(feature, 'requirements');
    confluenceCreated = true;
    console.log('✅ Confluenceページ作成成功');
  } catch (error: any) {
    errors.push(`Confluenceページ作成失敗: ${error.message}`);
    console.error('❌ Confluenceページ作成失敗:', error.message);
  }
  
  // Step 3: バリデーション
  console.log('\n🔍 バリデーション実行中...');
  const validation = validatePhase(feature, 'requirements');
  errors.push(...validation.errors);
  
  // Step 4: 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 要件定義フェーズ完了チェック:');
  console.log('  ✅ requirements.md: 作成済み');
  console.log(`  ${confluenceCreated ? '✅' : '❌'} Confluenceページ: ${confluenceCreated ? '作成済み' : '未作成'}`);
  console.log(`  ${validation.valid ? '✅' : '❌'} バリデーション: ${validation.valid ? '成功' : '失敗'}`);
  
  if (validation.valid && confluenceCreated) {
    console.log('\n🎉 要件定義フェーズが完了しました！');
    console.log('📢 PMや部長にConfluenceでレビューを依頼してください');
    if (confluenceUrl) {
      console.log(`📄 Confluence: ${confluenceUrl}`);
    } else {
      const baseUrl = process.env.ATLASSIAN_URL || 'https://your-site.atlassian.net';
      console.log(`📄 Confluence: ${baseUrl}/wiki/spaces/（URLは上記のログを参照）`);
    }
  }
  
  return {
    phase: 'requirements',
    success: validation.valid && confluenceCreated,
    confluenceCreated,
    jiraCreated: false,
    validationPassed: validation.valid,
    errors
  };
}

/**
 * 設計フェーズを実行
 */
async function runDesignPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n🏗️  Phase: Design（設計）');
  console.log('='.repeat(60));
  
  const errors: string[] = [];
  let confluenceCreated = false;
  let confluenceUrl: string | null = null;
  
  // Step 1: design.md存在確認
  const designPath = join(process.cwd(), '.kiro', 'specs', feature, 'design.md');
  if (!existsSync(designPath)) {
    errors.push('design.mdが存在しません。先に/kiro:spec-design を実行してください');
    return {
      phase: 'design',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors
    };
  }
  
  console.log('✅ design.md 存在確認');
  
  // Step 2: Confluenceページ作成
  console.log('\n📤 Confluenceページ作成中...');
  try {
    confluenceUrl = await syncToConfluence(feature, 'design');
    confluenceCreated = true;
    console.log('✅ Confluenceページ作成成功');
  } catch (error: any) {
    errors.push(`Confluenceページ作成失敗: ${error.message}`);
    console.error('❌ Confluenceページ作成失敗:', error.message);
  }
  
  // Step 3: バリデーション
  console.log('\n🔍 バリデーション実行中...');
  const validation = validatePhase(feature, 'design');
  errors.push(...validation.errors);
  
  // Step 4: 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 設計フェーズ完了チェック:');
  console.log('  ✅ design.md: 作成済み');
  console.log(`  ${confluenceCreated ? '✅' : '❌'} Confluenceページ: ${confluenceCreated ? '作成済み' : '未作成'}`);
  console.log(`  ${validation.valid ? '✅' : '❌'} バリデーション: ${validation.valid ? '成功' : '失敗'}`);
  
  if (validation.valid && confluenceCreated) {
    console.log('\n🎉 設計フェーズが完了しました！');
    console.log('📢 PMや部長にConfluenceでレビューを依頼してください');
    if (confluenceUrl) {
      console.log(`📄 Confluence: ${confluenceUrl}`);
    } else {
      const baseUrl = process.env.ATLASSIAN_URL || 'https://your-site.atlassian.net';
      console.log(`📄 Confluence: ${baseUrl}/wiki/spaces/（URLは上記のログを参照）`);
    }
  }
  
  return {
    phase: 'design',
    success: validation.valid && confluenceCreated,
    confluenceCreated,
    jiraCreated: false,
    validationPassed: validation.valid,
    errors
  };
}

/**
 * タスク分割フェーズを実行
 */
async function runTasksPhase(feature: string): Promise<PhaseRunResult> {
  console.log('\n📝 Phase: Tasks（タスク分割）');
  console.log('='.repeat(60));
  
  const errors: string[] = [];
  let jiraCreated = false;
  
  // Step 0: プリフライトチェック
  console.log('\n🔍 プリフライトチェック...');
  const preFlightResult = await runPreFlightCheck('jira');
  
  if (!preFlightResult.valid) {
    console.log('\n❌ プリフライトチェック失敗:');
    preFlightResult.errors.forEach(e => console.log(`  ${e}`));
    return {
      phase: 'tasks',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors: preFlightResult.errors
    };
  }
  
  console.log('✅ プリフライトチェック成功');
  
  // Step 1: tasks.md存在確認
  const tasksPath = join(process.cwd(), '.kiro', 'specs', feature, 'tasks.md');
  if (!existsSync(tasksPath)) {
    errors.push('tasks.mdが存在しません。先に/kiro:spec-tasks を実行してください');
    return {
      phase: 'tasks',
      success: false,
      confluenceCreated: false,
      jiraCreated: false,
      validationPassed: false,
      errors
    };
  }
  
  console.log('✅ tasks.md 存在確認');
  
  // Step 2: JIRA Epic/Story作成
  console.log('\n📤 JIRA Epic/Story作成中...');
  try {
    await syncTasksToJIRA(feature);
    jiraCreated = true;
    console.log('✅ JIRA Epic/Story作成成功');
  } catch (error: any) {
    errors.push(`JIRA作成失敗: ${error.message}`);
    console.error('❌ JIRA作成失敗:', error.message);
  }
  
  // Step 3: バリデーション
  console.log('\n🔍 バリデーション実行中...');
  const validation = validatePhase(feature, 'tasks');
  errors.push(...validation.errors);
  
  // Step 4: 結果サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 タスク分割フェーズ完了チェック:');
  console.log('  ✅ tasks.md: 作成済み');
  console.log(`  ${jiraCreated ? '✅' : '❌'} JIRA Epic/Story: ${jiraCreated ? '作成済み' : '未作成'}`);
  console.log(`  ${validation.valid ? '✅' : '❌'} バリデーション: ${validation.valid ? '成功' : '失敗'}`);
  
  if (validation.valid && jiraCreated) {
    console.log('\n🎉 タスク分割フェーズが完了しました！');
    console.log('📢 開発チームに実装開始を通知してください');
    console.log('🚀 次のステップ: /kiro:spec-impl <feature>');
  }
  
  return {
    phase: 'tasks',
    success: validation.valid && jiraCreated,
    confluenceCreated: false,
    jiraCreated,
    validationPassed: validation.valid,
    errors
  };
}

/**
 * フェーズを実行
 */
export async function runPhase(feature: string, phase: Phase): Promise<PhaseRunResult> {
  switch (phase) {
    case 'requirements':
      return await runRequirementsPhase(feature);
    case 'design':
      return await runDesignPhase(feature);
    case 'tasks':
      return await runTasksPhase(feature);
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: npm run phase:run <feature> <phase>');
    console.error('Example: npm run phase:run calculator-app requirements');
    console.error('Phases: requirements, design, tasks');
    process.exit(1);
  }
  
  const [feature, phase] = args;
  
  if (!['requirements', 'design', 'tasks'].includes(phase)) {
    console.error('Invalid phase. Must be: requirements, design, or tasks');
    process.exit(1);
  }
  
  runPhase(feature, phase as Phase)
    .then((result) => {
      if (result.success) {
        console.log('\n✅ フェーズ完了');
        process.exit(0);
      } else {
        console.log('\n❌ フェーズ未完了（エラーを確認してください）');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(`\n❌ フェーズ実行エラー: ${error.message}`);
      process.exit(1);
    });
}

