/**
 * JIRAストーリー管理スクリプト
 * - 旧ストーリー（MP-2〜MP-14）を削除
 * - 新ストーリー（MP-18〜MP-66）にEpic Linkを設定
 */

import axios from 'axios';
import { config } from 'dotenv';

config();

interface JIRAConfig {
  url: string;
  email: string;
  apiToken: string;
  epicLinkField: string;
}

function getJIRAConfig(): JIRAConfig {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;
  const epicLinkField = process.env.JIRA_EPIC_LINK_FIELD || 'customfield_10014';
  
  if (!url || !email || !apiToken) {
    throw new Error('Missing JIRA credentials in .env');
  }
  
  return { url, email, apiToken, epicLinkField };
}

class JIRAClient {
  private baseUrl: string;
  private auth: string;
  private epicLinkField: string;
  
  constructor(config: JIRAConfig) {
    this.baseUrl = `${config.url}/rest/api/3`;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    this.epicLinkField = config.epicLinkField;
  }
  
  /**
   * ストーリーを削除
   */
  async deleteIssue(issueKey: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/issue/${issueKey}`, {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Epic Linkを設定
   */
  async setEpicLink(issueKey: string, epicKey: string): Promise<void> {
    const payload = {
      fields: {
        [this.epicLinkField]: epicKey
      }
    };
    
    await axios.put(`${this.baseUrl}/issue/${issueKey}`, payload, {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
  }
}

async function cleanupAndLinkStories(): Promise<void> {
  console.log('🧹 JIRA ストーリー管理開始');
  console.log('='.repeat(60));
  
  const config = getJIRAConfig();
  const client = new JIRAClient(config);
  
  // 削除対象の旧ストーリー（すべて削除）
  const oldStories: string[] = [];
  for (let i = 2; i <= 244; i++) {
    oldStories.push(`MP-${i}`);
  }
  
  // Epic Link設定対象の新ストーリー（後で再作成されるもの）
  const newStories: string[] = [];
  // 再作成後に設定
  
  const epicKey = 'MP-1';
  
  // Step 1: 旧ストーリーを削除
  console.log('\n📌 Step 1: 旧ストーリーの削除');
  console.log(`削除対象: ${oldStories.length}個（${oldStories[0]} 〜 ${oldStories[oldStories.length - 1]}）`);
  
  let deletedCount = 0;
  let deleteFailedCount = 0;
  
  for (const issueKey of oldStories) {
    try {
      await client.deleteIssue(issueKey);
      console.log(`  ✅ 削除成功: ${issueKey}`);
      deletedCount++;
    } catch (error: any) {
      console.error(`  ❌ 削除失敗: ${issueKey}`, error.message);
      deleteFailedCount++;
    }
  }
  
  console.log(`\n削除結果: ${deletedCount}個成功、${deleteFailedCount}個失敗`);
  
  // Step 2: 新ストーリーにEpic Linkを設定
  console.log('\n📌 Step 2: Epic Linkの設定');
  console.log(`設定対象: ${newStories.length}個（${newStories[0]} 〜 ${newStories[newStories.length - 1]}）`);
  console.log(`Epic: ${epicKey}`);
  
  let linkedCount = 0;
  let linkFailedCount = 0;
  
  for (const issueKey of newStories) {
    try {
      await client.setEpicLink(issueKey, epicKey);
      console.log(`  ✅ Epic Link設定成功: ${issueKey} → ${epicKey}`);
      linkedCount++;
    } catch (error: any) {
      console.error(`  ❌ Epic Link設定失敗: ${issueKey}`, error.message);
      linkFailedCount++;
    }
  }
  
  console.log(`\nEpic Link設定結果: ${linkedCount}個成功、${linkFailedCount}個失敗`);
  
  // サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 完了サマリー:');
  console.log(`  削除: ${deletedCount}/${oldStories.length}個`);
  console.log(`  Epic Link: ${linkedCount}/${newStories.length}個`);
  console.log('\n✅ ストーリー管理完了');
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupAndLinkStories()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ エラー:', error.message);
      process.exit(1);
    });
}

export { cleanupAndLinkStories };

