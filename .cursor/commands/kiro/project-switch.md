---
name: /kiro:project-switch
description: プロジェクトを切り替える
---

# プロジェクト切り替えコマンド

複数プロジェクトを管理している場合、プロジェクトを切り替えるコマンドです。

## 使い方

```
/kiro:project-switch <project_id>
```

**パラメータ**:
- `project_id`: プロジェクトID（例: customer-a-service-1, michi）

**例**:
```
/kiro:project-switch michi
/kiro:project-switch customer-a-service-1
```

## 実行内容

1. プロジェクトIDに対応するGitHubリポジトリを特定
2. ローカルにクローン（未クローンの場合）またはチェックアウト
3. `.kiro/project.json` を読み込んで表示
4. 対応するConfluenceプロジェクトページのURLを表示
5. JIRAプロジェクトダッシュボードのURLを表示

## 出力例

```
✅ プロジェクト切り替え: michi

プロジェクト情報:
  名前: Michi - Managed Intelligent Comprehensive Hub for Integration
  JIRA: MICHI
  Confluence Labels: project:michi, service:hub
  ステータス: active
  チーム: @arigatatsuya

リンク:
  📄 Confluence: https://your-domain.atlassian.net/wiki/spaces/PRD/pages/
  🎯 JIRA Dashboard: https://your-domain.atlassian.net/jira/projects/MICHI
  🐙 GitHub: https://github.com/sk8metalme/michi
```

## ターミナル実行

```bash
# リポジトリをクローン/チェックアウト
cd ~/work/projects
jj git clone https://github.com/org/<project_id>
cd <project_id>

# プロジェクト情報を表示
cat .kiro/project.json
```

## 関連コマンド

- `/kiro:project-list`: すべてのプロジェクトを一覧表示
- `/kiro:spec-status`: 現在のプロジェクトの仕様ステータスを表示

