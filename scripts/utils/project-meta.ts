/**
 * プロジェクトメタデータ読み込みユーティリティ
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface ProjectMetadata {
  projectId: string;
  projectName: string;
  customer: string;
  jiraProjectKey: string;
  confluenceLabels: string[];
  status: 'active' | 'inactive' | 'completed';
  team: string[];
  stakeholders: string[];
  repository: string;
  description?: string;
}

/**
 * .kiro/project.json を読み込む
 */
export function loadProjectMeta(projectRoot: string = process.cwd()): ProjectMetadata {
  const projectJsonPath = resolve(projectRoot, '.kiro/project.json');
  
  if (!existsSync(projectJsonPath)) {
    throw new Error(`Project metadata not found: ${projectJsonPath}`);
  }
  
  try {
    const content = readFileSync(projectJsonPath, 'utf-8');
    const meta = JSON.parse(content) as ProjectMetadata;
    
    // 必須フィールドのバリデーション
    const requiredFields: (keyof ProjectMetadata)[] = [
      'projectId',
      'projectName',
      'jiraProjectKey',
      'confluenceLabels'
    ];
    
    for (const field of requiredFields) {
      if (!meta[field]) {
        throw new Error(`Required field missing in project.json: ${field}`);
      }
    }
    
    return meta;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${projectJsonPath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * プロジェクトメタデータを表示用にフォーマット
 */
export function formatProjectInfo(meta: ProjectMetadata): string {
  return `
Project: ${meta.projectName} (${meta.projectId})
JIRA: ${meta.jiraProjectKey}
Labels: ${meta.confluenceLabels.join(', ')}
Status: ${meta.status}
Team: ${meta.team.join(', ')}
`.trim();
}

