---
name: /kiro:confluence-sync
description: GitHub の Markdown を Confluence に同期
---

# Confluence同期コマンド

このコマンドは、GitHubで管理されている仕様書（requirements, design, tasks）をConfluenceに同期します。

## 使い方

```
/kiro:confluence-sync <feature_name> [doc_type]
```

**パラメータ**:
- `feature_name`: 機能名（例: user-auth）
- `doc_type`: ドキュメントタイプ（requirements / design / tasks）省略時は requirements

**例**:
```
/kiro:confluence-sync user-auth
/kiro:confluence-sync user-auth design
/kiro:confluence-sync user-auth tasks
```

## 実行内容

1. `.kiro/project.json` からプロジェクトメタデータを読み込み
2. `.kiro/specs/<feature>/<doc_type>.md` を読み込み
3. Markdown → Confluence Storage Format に変換
4. GitHub URLを埋め込み
5. Confluenceページを作成または更新
6. ラベル付与（プロジェクトラベル + doc_type）
7. ステークホルダーにメンション通知

## 生成されるConfluenceページ

**タイトル**: `[プロジェクト名] <feature> <doc_type>`  
**スペース**: PRD（要件・設計）/ QA（テスト）  
**ラベル**: project:<project_id>, <doc_type>, <feature_name>, github-sync  

**ページ構成**:
- GitHub連携情報（最新版へのリンク）
- 変換されたMarkdownコンテンツ
- 承認マクロ（企画・部長への承認依頼）

## 実装

スクリプトを直接実行：

```bash
npm run confluence:sync <feature_name> [doc_type]
```

内部的に `scripts/confluence-sync.ts` を実行します。

## 前提条件

- `.env` ファイルに Atlassian 認証情報が設定されている
- `.kiro/project.json` が存在する
- 同期する Markdown ファイルが存在する

## トラブルシューティング

### 認証エラー
`.env` の `ATLASSIAN_API_TOKEN` を確認してください。

### ページが見つからない
Confluence スペースキー（PRD）が正しいか確認してください。

### Markdown変換エラー
Markdown形式が正しいか確認してください。

