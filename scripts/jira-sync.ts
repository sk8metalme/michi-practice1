/**
 * JIRA連携スクリプト
 * tasks.md から JIRA Epic/Story/Subtask を自動作成
 * 
 * 【重要】Epic Link について:
 * JIRA Cloud では Story を Epic に紐付けるには、Epic Link カスタムフィールド
 * （通常 customfield_10014）を使用する必要があります。
 * 
 * 現在の実装では parent フィールドを使用していますが、これは Subtask 専用です。
 * Story 作成時に 400 エラーが発生する可能性があります。
 * 
 * 対処方法:
 * 1. JIRA 管理画面で Epic Link のカスタムフィールドIDを確認
 * 2. 環境変数 JIRA_EPIC_LINK_FIELD に設定（例: customfield_10014）
 * 3. または、Story 作成後に手動で Epic Link を設定
 * 
 * 参考: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import axios from 'axios';
import { config } from 'dotenv';
import { loadProjectMeta } from './utils/project-meta.js';

config();

interface JIRAConfig {
  url: string;
  email: string;
  apiToken: string;
}

function getJIRAConfig(): JIRAConfig {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;
  
  if (!url || !email || !apiToken) {
    throw new Error('Missing JIRA credentials in .env');
  }
  
  return { url, email, apiToken };
}

/**
 * プレーンテキストをAtlassian Document Format（ADF）に変換
 */
function textToADF(text: string): any {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text
          }
        ]
      }
    ]
  };
}

/**
 * Storyの詳細情報を抽出
 */
interface StoryDetails {
  title: string;
  description?: string;
  acceptanceCriteria?: string[];
  subtasks?: string[];
  dependencies?: string;
  priority?: string;
  estimate?: string;
  assignee?: string;
  dueDate?: string;
}

function extractStoryDetails(tasksContent: string, storyTitle: string): StoryDetails {
  const details: StoryDetails = { title: storyTitle };
  
  // Story セクションを抽出
  const storyPattern = new RegExp(`### Story [\\d.]+: ${storyTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)(?=### Story|## Phase|$)`, 'i');
  const storyMatch = tasksContent.match(storyPattern);
  
  if (!storyMatch) return details;
  
  const storySection = storyMatch[1];
  
  // 優先度抽出
  const priorityMatch = storySection.match(/\*\*優先度\*\*:\s*(.+)/);
  if (priorityMatch) details.priority = priorityMatch[1].trim();
  
  // 見積もり抽出
  const estimateMatch = storySection.match(/\*\*見積もり\*\*:\s*(.+)/);
  if (estimateMatch) details.estimate = estimateMatch[1].trim();
  
  // 担当抽出
  const assigneeMatch = storySection.match(/\*\*担当\*\*:\s*(.+)/);
  if (assigneeMatch) details.assignee = assigneeMatch[1].trim();
  
  // 期限抽出
  const dueDateMatch = storySection.match(/\*\*期限\*\*:\s*(\d{4}-\d{2}-\d{2})/);
  if (dueDateMatch) details.dueDate = dueDateMatch[1];
  
  // 説明抽出
  const descriptionMatch = storySection.match(/\*\*説明\*\*:\s*\n(.+?)(?=\n\*\*|$)/s);
  if (descriptionMatch) details.description = descriptionMatch[1].trim();
  
  // 完了条件抽出
  const criteriaMatch = storySection.match(/\*\*完了条件\*\*:\s*\n((?:- \[.\].*\n?)+)/);
  if (criteriaMatch) {
    details.acceptanceCriteria = criteriaMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('- ['))
      .map(line => line.replace(/^- \[.\]\s*/, '').trim())
      .filter(line => line.length > 0);
  }
  
  // サブタスク抽出
  const subtasksMatch = storySection.match(/\*\*サブタスク\*\*:\s*\n((?:- \[.\].*\n?)+)/);
  if (subtasksMatch) {
    details.subtasks = subtasksMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('- ['))
      .map(line => line.replace(/^- \[.\]\s*/, '').trim())
      .filter(line => line.length > 0);
  }
  
  // 依存関係抽出
  const dependenciesMatch = storySection.match(/\*\*依存関係\*\*:\s*(.+)/);
  if (dependenciesMatch) details.dependencies = dependenciesMatch[1].trim();
  
  return details;
}

/**
 * リッチなADF形式を生成
 */
function createRichADF(details: StoryDetails, phaseLabel: string, githubUrl: string): any {
  const content: any[] = [];
  
  // 説明セクション
  if (details.description) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '説明' }]
    });
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: details.description }]
    });
  }
  
  // メタデータセクション
  const metadata: string[] = [];
  if (details.priority) metadata.push(`優先度: ${details.priority}`);
  if (details.estimate) metadata.push(`見積もり: ${details.estimate}`);
  if (details.assignee) metadata.push(`担当: ${details.assignee}`);
  if (details.dependencies) metadata.push(`依存関係: ${details.dependencies}`);
  
  if (metadata.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'メタデータ' }]
    });
    metadata.forEach(item => {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: item }]
      });
    });
  }
  
  // 完了条件セクション
  if (details.acceptanceCriteria && details.acceptanceCriteria.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '完了条件' }]
    });
    
    const listItems = details.acceptanceCriteria.map(criterion => ({
      type: 'listItem',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: criterion }]
      }]
    }));
    
    content.push({
      type: 'bulletList',
      content: listItems
    });
  }
  
  // サブタスクセクション
  if (details.subtasks && details.subtasks.length > 0) {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'サブタスク' }]
    });
    
    const listItems = details.subtasks.map(subtask => ({
      type: 'listItem',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: subtask }]
      }]
    }));
    
    content.push({
      type: 'bulletList',
      content: listItems
    });
  }
  
  // フッター（Phase、GitHubリンク）
  content.push({
    type: 'rule'
  });
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Phase: ', marks: [{ type: 'strong' }] },
      { type: 'text', text: phaseLabel }
    ]
  });
  content.push({
    type: 'paragraph',
    content: [
      { type: 'text', text: 'GitHub: ', marks: [{ type: 'strong' }] },
      {
        type: 'text',
        text: githubUrl,
        marks: [{
          type: 'link',
          attrs: { href: githubUrl }
        }]
      }
    ]
  });
  
  return {
    type: 'doc',
    version: 1,
    content: content
  };
}

class JIRAClient {
  private baseUrl: string;
  private auth: string;
  
  constructor(config: JIRAConfig) {
    this.baseUrl = `${config.url}/rest/api/3`;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  }
  
  /**
   * JQL検索でIssueを検索
   * @throws 検索エラー時は例外を再スロー（呼び出し元で処理）
   */
  async searchIssues(jql: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: { jql, maxResults: 100 },
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.issues || [];
    } catch (error) {
      console.error('Error searching issues:', error instanceof Error ? error.message : error);
      throw error; // エラーを再スローして呼び出し元で処理
    }
  }
  
  async createIssue(payload: any): Promise<any> {
    const response = await axios.post(`${this.baseUrl}/issue`, payload, {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
  
  async updateIssue(issueKey: string, payload: any): Promise<void> {
    await axios.put(`${this.baseUrl}/issue/${issueKey}`, payload, {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
  }
}

async function syncTasksToJIRA(featureName: string): Promise<void> {
  console.log(`Syncing tasks for feature: ${featureName}`);
  
  const projectMeta = loadProjectMeta();
  const tasksPath = resolve(`.kiro/specs/${featureName}/tasks.md`);
  const tasksContent = readFileSync(tasksPath, 'utf-8');
  
  const config = getJIRAConfig();
  const client = new JIRAClient(config);
  
  // spec.jsonを読み込んで既存のEpicキーを確認
  const specPath = resolve(`.kiro/specs/${featureName}/spec.json`);
  let spec: any = {};
  try {
    spec = JSON.parse(readFileSync(specPath, 'utf-8'));
  } catch (error) {
    console.error('spec.json not found or invalid');
  }
  
  let epic: any;
  
  // 既存のEpicをチェック
  if (spec.jira?.epicKey) {
    console.log(`Existing Epic found: ${spec.jira.epicKey}`);
    console.log('Skipping Epic creation (already exists)');
    epic = { key: spec.jira.epicKey };
  } else {
    // Epic作成
    console.log('Creating Epic...');
    const epicSummary = `[${featureName}] ${projectMeta.projectName}`;
    
    // 同じタイトルのEpicがすでに存在するかJQLで検索
    const jql = `project = ${projectMeta.jiraProjectKey} AND issuetype = Epic AND summary ~ "${featureName}"`;
    let existingEpics: any[] = [];
    try {
      existingEpics = await client.searchIssues(jql);
    } catch (error) {
      console.error('❌ Failed to search existing Epics:', error instanceof Error ? error.message : error);
      console.error('⚠️  Cannot verify idempotency - Epic creation may result in duplicates');
      throw new Error(`JIRA Epic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    if (existingEpics.length > 0) {
      console.log(`Found existing Epic with similar title: ${existingEpics[0].key}`);
      console.log('Using existing Epic instead of creating new one');
      epic = existingEpics[0];
    } else {
      const epicDescription = `機能: ${featureName}\nGitHub: ${projectMeta.repository}/tree/main/.kiro/specs/${featureName}`;
      
      const epicPayload = {
        fields: {
          project: { key: projectMeta.jiraProjectKey },
          summary: epicSummary,
          description: textToADF(epicDescription),  // ADF形式に変換
          issuetype: { name: 'Epic' },
          labels: projectMeta.confluenceLabels
        }
      };
      
      epic = await client.createIssue(epicPayload);
      console.log(`✅ Epic created: ${epic.key}`);
    }
  }
  
  // 既存のStoryを検索（重複防止）
  // ラベルで検索（summary検索では "Story: タイトル" 形式に一致しないため）
  const jql = `project = ${projectMeta.jiraProjectKey} AND issuetype = Story AND labels = "${featureName}"`;
  let existingStories: any[] = [];
  try {
    existingStories = await client.searchIssues(jql);
  } catch (error) {
    console.error('❌ Failed to search existing Stories:', error instanceof Error ? error.message : error);
    console.error('⚠️  Cannot verify idempotency - Story creation may result in duplicates');
    console.error('⚠️  Continuing with story creation (duplicates may be created)...');
    // 検索失敗時も処理を継続（既存ストーリーなしとして扱う）
    existingStories = [];
  }
  
  const existingStorySummaries = new Set(existingStories.map((s: any) => s.fields.summary));
  const existingStoryKeys = new Set(existingStories.map((s: any) => s.key));
  
  console.log(`Found ${existingStories.length} existing stories for this feature`);
  
  // フェーズラベル検出用の正規表現
  // Phase X: フェーズ名（ラベル）の形式を検出
  const phasePattern = /## Phase [\d.]+:\s*(.+?)（(.+?)）/;
  
  // Story作成（フェーズ検出付きパーサー）
  const lines = tasksContent.split('\n');
  let currentPhaseLabel = 'implementation'; // デフォルトは実装フェーズ
  const createdStories: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // フェーズ検出
    const phaseMatch = line.match(phasePattern);
    if (phaseMatch) {
      const phaseName = phaseMatch[2]; // 括弧内のラベル（例: Requirements）
      
      // フェーズ名からラベルを決定
      if (phaseName.includes('要件定義') || phaseName.toLowerCase().includes('requirements')) {
        currentPhaseLabel = 'requirements';
      } else if (phaseName.includes('設計') || phaseName.toLowerCase().includes('design')) {
        currentPhaseLabel = 'design';
      } else if (phaseName.includes('実装') || phaseName.toLowerCase().includes('implementation')) {
        currentPhaseLabel = 'implementation';
      } else if (phaseName.includes('試験') || phaseName.toLowerCase().includes('testing')) {
        currentPhaseLabel = 'testing';
      } else if (phaseName.includes('リリース準備') || phaseName.toLowerCase().includes('release-prep') || phaseName.toLowerCase().includes('release preparation')) {
        currentPhaseLabel = 'release-prep';
      } else if (phaseName.includes('リリース') || phaseName.toLowerCase().includes('release')) {
        currentPhaseLabel = 'release';
      }
      
      console.log(`📌 Phase detected: ${phaseName} (label: ${currentPhaseLabel})`);
      continue;
    }
    
    // Story検出
    const storyMatch = line.match(/### Story [\d.]+: (.+)/);
    if (!storyMatch) continue;
    
    const storyTitle = storyMatch[1];
    const storySummary = `Story: ${storyTitle}`;
    
    // 既に同じタイトルのStoryが存在するかチェック
    if (existingStorySummaries.has(storySummary)) {
      console.log(`Skipping Story (already exists): ${storyTitle}`);
      const existing = existingStories.find((s: any) => s.fields.summary === storySummary);
      if (existing) {
        createdStories.push(existing.key);
      }
      continue;
    }
    
    console.log(`Creating Story: ${storyTitle} [${currentPhaseLabel}]`);
    
    try {
      // Storyの詳細情報を抽出
      const storyDetails = extractStoryDetails(tasksContent, storyTitle);
      
      // GitHubリンク
      const githubUrl = `${projectMeta.repository}/tree/main/.kiro/specs/${featureName}/tasks.md`;
      
      // リッチなADF形式で説明文を生成
      const richDescription = createRichADF(storyDetails, currentPhaseLabel, githubUrl);
      
      // 優先度のマッピング（デフォルト: Medium）
      const priorityMap: { [key: string]: string } = {
        'High': 'High',
        'Medium': 'Medium',
        'Low': 'Low'
      };
      const priority = storyDetails.priority && priorityMap[storyDetails.priority] 
        ? priorityMap[storyDetails.priority] 
        : 'Medium';
      
      const storyPayload: any = {
        fields: {
          project: { key: projectMeta.jiraProjectKey },
          summary: storySummary,
          description: richDescription,  // リッチなADF形式
          issuetype: { id: '10036' },  // ストーリー（IDを使用して言語に依存しない）
          labels: [...projectMeta.confluenceLabels, featureName, currentPhaseLabel],
          priority: { name: priority }
        }
      };
      
      // 期限（Due Date）を設定
      if (storyDetails.dueDate) {
        storyPayload.fields.duedate = storyDetails.dueDate;  // YYYY-MM-DD形式
      }
      
      const story = await client.createIssue(storyPayload);
      console.log(`  ✅ Story created: ${story.key} [${currentPhaseLabel}]`);
      if (storyDetails.dueDate) {
        console.log(`     期限: ${storyDetails.dueDate}`);
      }
      if (storyDetails.estimate) {
        console.log(`     見積もり: ${storyDetails.estimate}`);
      }
      createdStories.push(story.key);
      
      // Epic Linkは手動設定が必要（JIRA Cloudの制約）
      console.log(`  ℹ️  Epic: ${epic.key} に手動でリンクしてください`);
    } catch (error: any) {
      console.error(`  ❌ Failed to create Story "${storyTitle}":`, error.message);
      if (error.response?.data) {
        console.error(`  📋 JIRA API Response:`, JSON.stringify(error.response.data, null, 2));
      }
      // エラーがあっても他のStoryの作成は継続
    }
  }
  
  // 新規作成数と再利用数を正確に計算
  const newStoryCount = createdStories.filter(key => !existingStoryKeys.has(key)).length;
  const reusedStoryCount = createdStories.filter(key => existingStoryKeys.has(key)).length;
  
  console.log(`\n✅ JIRA sync completed`);
  console.log(`   Epic: ${epic.key}`);
  console.log(`   Stories: ${createdStories.length} processed (${newStoryCount} new, ${reusedStoryCount} reused)`);
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm run jira:sync <feature-name>');
    process.exit(1);
  }
  
  syncTasksToJIRA(args[0])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ JIRA sync failed:', error.message);
      process.exit(1);
    });
}

export { syncTasksToJIRA, JIRAClient };

