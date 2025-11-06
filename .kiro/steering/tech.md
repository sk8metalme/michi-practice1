# Technical Context - {{PROJECT_NAME}}

## 技術スタック

### フロントエンド
- **フレームワーク**: React 18.x
- **状態管理**: Redux / Zustand
- **スタイリング**: Tailwind CSS / styled-components
- **ビルドツール**: Vite / Next.js

### バックエンド
- **言語**: TypeScript / Node.js 20.x
- **フレームワーク**: Express / Fastify
- **ORM**: Prisma / TypeORM
- **API**: REST / GraphQL

### データベース
- **RDBMS**: PostgreSQL 15.x / MySQL 8.x
- **NoSQL**: MongoDB / Redis
- **キャッシュ**: Redis
- **検索**: Elasticsearch (オプション)

### インフラ
- **クラウド**: AWS / GCP / Azure
- **コンテナ**: Docker / Kubernetes
- **CI/CD**: GitHub Actions / GitLab CI
- **モニタリング**: Datadog / Prometheus + Grafana

## アーキテクチャ原則

### 設計原則
1. **SOLID原則**: 単一責任、開放閉鎖、リスコフ置換、インターフェース分離、依存性逆転
2. **DRY (Don't Repeat Yourself)**: コードの重複を避ける
3. **KISS (Keep It Simple, Stupid)**: シンプルに保つ
4. **YAGNI (You Aren't Gonna Need It)**: 必要になるまで実装しない

### コーディング規約
- **スタイルガイド**: Airbnb JavaScript Style Guide
- **Linter**: ESLint + Prettier
- **型安全**: TypeScript strict mode
- **テストカバレッジ**: 95%以上

## セキュリティ

### 認証・認可
- **認証方式**: JWT / OAuth 2.0
- **セッション管理**: Redis
- **パスワード**: bcrypt (10 rounds)

### データ保護
- **通信**: HTTPS必須
- **データベース**: 暗号化（at rest）
- **個人情報**: GDPR / 個人情報保護法準拠

### 脆弱性対策
- **OWASP Top 10**: 対策必須
- **依存関係**: 定期的な脆弱性スキャン
- **ペネトレーションテスト**: リリース前実施

## パフォーマンス

### 目標値
- **ページロード**: < 2秒
- **APIレスポンス**: < 200ms (95パーセンタイル)
- **同時接続**: 10,000+

### 最適化戦略
- **フロントエンド**: Code splitting, Lazy loading, CDN
- **バックエンド**: Connection pooling, Query optimization, Caching
- **データベース**: Index optimization, Partitioning

## 開発プラクティス

### バージョン管理
- **VCS**: Jujutsu (jj) + Git
- **ブランチ戦略**: Feature branches
- **コミットメッセージ**: Conventional Commits

### テスト戦略
- **単体テスト**: Jest / Vitest
- **統合テスト**: Supertest / Playwright
- **E2Eテスト**: Playwright / Cypress
- **TDD**: テスト駆動開発を推奨

### CI/CD
- **ビルド**: 自動ビルド＆テスト
- **デプロイ**: 自動デプロイ（ステージング → 本番）
- **ロールバック**: ワンクリックロールバック

## 運用・保守

### モニタリング
- **ログ**: 構造化ログ (JSON)
- **メトリクス**: CPU, Memory, Disk, Network
- **トレーシング**: Distributed tracing (Jaeger/Zipkin)
- **アラート**: Slack / PagerDuty

### バックアップ
- **頻度**: 日次
- **保持期間**: 30日
- **復旧テスト**: 月次

## 技術的負債管理

### 負債の記録
- **Issue**: GitHub Issues で管理
- **ラベル**: `tech-debt`
- **定期レビュー**: 四半期ごと

### リファクタリング
- **方針**: 機能追加時に周辺をリファクタリング
- **大規模**: 専用のスプリントを確保

## 依存関係管理

### パッケージ管理
- **フロントエンド**: npm / yarn
- **バックエンド**: npm / pnpm
- **セキュリティ**: Dependabot / Snyk

### バージョンアップ
- **メジャー**: 慎重に評価
- **マイナー**: 四半期ごと
- **パッチ**: 随時

## ドキュメント

### 必須ドキュメント
- **README**: プロジェクト概要、セットアップ手順
- **API仕様**: OpenAPI / Swagger
- **アーキテクチャ**: C4モデル
- **デプロイ**: デプロイ手順、ロールバック手順

### コードコメント
- **日本語**: コメントは日本語で記述
- **JSDoc**: 関数・クラスにJSDocコメント
- **Why over What**: 「なぜ」を説明、「何を」は自明に

## AI開発支援

### AI活用
- **コード生成**: GitHub Copilot / Cursor
- **レビュー**: AI Code Review
- **テスト生成**: AI Test Generation

### 品質保証
- **人間レビュー**: AIコードも人間がレビュー
- **テスト**: 必ずテストを書く
- **セキュリティ**: セキュリティチェック必須

