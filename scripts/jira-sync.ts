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

class JIRAClient {
  private baseUrl: string;
  private auth: string;
  
  constructor(config: JIRAConfig) {
    this.baseUrl = `${config.url}/rest/api/3`;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
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
  
  // Epic作成
  console.log('Creating Epic...');
  const epicPayload = {
    fields: {
      project: { key: projectMeta.jiraProjectKey },
      summary: `[${projectMeta.projectName}] ${featureName}`,
      description: `機能: ${featureName}\nGitHub: ${projectMeta.repository}/tree/main/.kiro/specs/${featureName}`,
      issuetype: { name: 'Epic' },
      labels: projectMeta.confluenceLabels
    }
  };
  
  const epic = await client.createIssue(epicPayload);
  console.log(`✅ Epic created: ${epic.key}`);
  
  // Story作成（簡易パーサー）
  const storyMatches = tasksContent.matchAll(/### Story \d+: (.+)/g);
  for (const match of storyMatches) {
    const storyTitle = match[1];
    console.log(`Creating Story: ${storyTitle}`);
    
    try {
      const storyPayload = {
        fields: {
          project: { key: projectMeta.jiraProjectKey },
          summary: `[${projectMeta.projectName}] ${storyTitle}`,
          description: `ストーリー: ${storyTitle}\nGitHub: ${projectMeta.repository}`,
          issuetype: { name: 'Story' },
          // Note: Epic LinkはJIRA Cloudではカスタムフィールド（例: customfield_10014）
          // 環境に応じて調整が必要。parentはSubtask用
          labels: projectMeta.confluenceLabels
        }
      };
      
      const story = await client.createIssue(storyPayload);
      console.log(`  ✅ Story created: ${story.key}`);
      console.log(`  ⚠️  Note: Epic Linkは手動で設定してください（Epic: ${epic.key}）`);
    } catch (error) {
      console.error(`  ❌ Failed to create Story "${storyTitle}":`, error instanceof Error ? error.message : error);
      // エラーがあっても他のStoryの作成は継続
    }
  }
  
  console.log('✅ JIRA sync completed');
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

