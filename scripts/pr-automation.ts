/**
 * GitHub PR自動化スクリプト
 */

import { Octokit } from '@octokit/rest';
import { config } from 'dotenv';
import { loadProjectMeta } from './utils/project-meta.js';

config();

interface PROptions {
  branch: string;
  title: string;
  body: string;
  base?: string;
}

async function createPR(options: PROptions): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  
  if (!token || !repo) {
    throw new Error('Missing GitHub credentials');
  }
  
  const [owner, repoName] = repo.split('/');
  const octokit = new Octokit({ auth: token });
  
  const { branch, title, body, base = 'main' } = options;
  
  console.log(`Creating PR: ${title}`);
  
  const pr = await octokit.pulls.create({
    owner,
    repo: repoName,
    title,
    body,
    head: branch,
    base
  });
  
  console.log(`✅ PR created: ${pr.data.html_url}`);
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: npm run github:create-pr <branch> [title]');
    process.exit(1);
  }
  
  const branch = args[0];
  const title = args[1] || `feat: ${branch}`;
  const body = 'Auto-generated PR';
  
  createPR({ branch, title, body })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ PR creation failed:', error.message);
      process.exit(1);
    });
}

export { createPR };

