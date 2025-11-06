/**
 * Confluence同期スクリプト
 * GitHub の Markdown ファイルを Confluence に同期
 */

import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import axios from 'axios';
import { config } from 'dotenv';
import { loadProjectMeta, type ProjectMetadata } from './utils/project-meta.js';
import { convertMarkdownToConfluence, createConfluencePage } from './markdown-to-confluence.js';

// 環境変数読み込み
config();

interface ConfluenceConfig {
  url: string;
  email: string;
  apiToken: string;
  space: string;
}

/**
 * Confluence設定を環境変数から取得
 */
function getConfluenceConfig(): ConfluenceConfig {
  const url = process.env.ATLASSIAN_URL;
  const email = process.env.ATLASSIAN_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;
  const space = process.env.CONFLUENCE_PRD_SPACE || 'PRD';
  
  if (!url || !email || !apiToken) {
    throw new Error('Missing Confluence credentials in .env file');
  }
  
  return { url, email, apiToken, space };
}

/**
 * Confluence REST API クライアント
 */
class ConfluenceClient {
  private baseUrl: string;
  private auth: string;
  
  constructor(config: ConfluenceConfig) {
    this.baseUrl = `${config.url}/wiki/rest/api`;
    this.auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  }
  
  /**
   * ページを検索
   */
  async searchPage(spaceKey: string, title: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/content`, {
        params: {
          spaceKey,
          title,
          expand: 'version'
        },
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error searching page:', error);
      return null;
    }
  }
  
  /**
   * ページを作成
   */
  async createPage(spaceKey: string, title: string, content: string, labels: string[] = []): Promise<any> {
    const payload = {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      },
      metadata: {
        labels: labels.map(label => ({ name: label }))
      }
    };
    
    const response = await axios.post(`${this.baseUrl}/content`, payload, {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }
  
  /**
   * ページを更新
   */
  async updatePage(pageId: string, title: string, content: string, version: number): Promise<any> {
    const payload = {
      version: { number: version + 1 },
      title,
      type: 'page',
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };
    
    const response = await axios.put(`${this.baseUrl}/content/${pageId}`, payload, {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }
  
  /**
   * ページのラベルを追加
   */
  async addLabels(pageId: string, labels: string[]): Promise<void> {
    for (const label of labels) {
      await axios.post(
        `${this.baseUrl}/content/${pageId}/label`,
        [{ name: label }],
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
}

/**
 * Markdownファイルを Confluence に同期
 */
async function syncToConfluence(
  featureName: string,
  docType: 'requirements' | 'design' | 'tasks' = 'requirements'
): Promise<void> {
  console.log(`Syncing ${docType} for feature: ${featureName}`);
  
  // プロジェクトメタデータ読み込み
  const projectMeta = loadProjectMeta();
  console.log(`Project: ${projectMeta.projectName} (${projectMeta.projectId})`);
  
  // Markdownファイル読み込み
  const markdownPath = resolve(`.kiro/specs/${featureName}/${docType}.md`);
  const markdown = readFileSync(markdownPath, 'utf-8');
  
  // Confluenceに変換
  const confluenceContent = convertMarkdownToConfluence(markdown);
  
  // GitHub URL生成
  const githubUrl = `${projectMeta.repository}/blob/main/.kiro/specs/${featureName}/${docType}.md`;
  
  // Confluenceページコンテンツ作成
  const pageTitle = `[${projectMeta.projectName}] ${featureName} ${getDocTypeLabel(docType)}`;
  const fullContent = createConfluencePage({
    title: pageTitle,
    githubUrl,
    content: confluenceContent,
    approvers: projectMeta.stakeholders,
    projectName: projectMeta.projectName
  });
  
  // Confluenceクライアント初期化
  const config = getConfluenceConfig();
  const client = new ConfluenceClient(config);
  
  // ページ検索
  const existingPage = await client.searchPage(config.space, pageTitle);
  
  // ラベル準備
  const labels = [
    ...projectMeta.confluenceLabels,
    docType,
    featureName,
    'github-sync'
  ];
  
  if (existingPage) {
    // 既存ページを更新
    console.log(`Updating existing page: ${pageTitle}`);
    const updated = await client.updatePage(
      existingPage.id,
      pageTitle,
      fullContent,
      existingPage.version.number
    );
    console.log(`✅ Page updated: ${config.url}/wiki${updated._links.webui}`);
  } else {
    // 新規ページ作成
    console.log(`Creating new page: ${pageTitle}`);
    const created = await client.createPage(
      config.space,
      pageTitle,
      fullContent,
      labels
    );
    console.log(`✅ Page created: ${config.url}/wiki${created._links.webui}`);
  }
}

/**
 * ドキュメントタイプのラベルを取得
 */
function getDocTypeLabel(docType: string): string {
  const labels: Record<string, string> = {
    requirements: '要件定義',
    design: '設計',
    tasks: 'タスク分割'
  };
  return labels[docType] || docType;
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm run confluence:sync <feature-name> [doc-type]');
    console.error('  doc-type: requirements (default) | design | tasks');
    process.exit(1);
  }
  
  const featureName = args[0];
  const docType = (args[1] as any) || 'requirements';
  
  syncToConfluence(featureName, docType)
    .then(() => {
      console.log('✅ Sync completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sync failed:', error.message);
      process.exit(1);
    });
}

export { syncToConfluence, ConfluenceClient };

