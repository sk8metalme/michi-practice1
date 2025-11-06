# Web電卓アプリケーション

## 概要

Webブラウザで動作する電卓アプリケーションを、Java + Spring Boot + Thymeleafで開発します。

## 技術スタック

| 項目 | 技術 |
|------|------|
| 言語 | Java |
| フレームワーク | Spring Boot |
| フロントエンド | Thymeleaf |
| アーキテクチャ | Onion Architecture |
| 開発手法 | TDD (Test-Driven Development) |

## Onion Architecture 構成

```
calculator-app/
├── domain/           # ドメイン層（最内層）
│   ├── model/       # エンティティ、値オブジェクト
│   └── service/     # ドメインサービス
├── application/     # アプリケーション層
│   └── usecase/     # ユースケース
├── infrastructure/  # インフラストラクチャ層
│   ├── persistence/ # データ永続化
│   └── config/      # 設定
└── presentation/    # プレゼンテーション層
    ├── controller/  # コントローラー
    └── view/        # Thymeleafテンプレート
```

## 仕様書フェーズ

### ✅ Phase 0: Init（初期化）
- [x] 仕様書ディレクトリ作成
- [x] メタデータ設定
- [x] 概要作成

### ✅ Phase 1: Requirements（要件定義）
- [x] 機能要件の定義（6項目）
- [x] 非機能要件の定義（7項目）
- [x] アーキテクチャ要件の定義
- [x] TDD開発プロセス要件の定義
- [x] リスク分析

**完了**: 2025-11-06

### ✅ Phase 2: Design（設計）
- [x] Onion Architectureアーキテクチャ設計
- [x] クラス設計（全4層）
- [x] データモデル設計（JPA Entity）
- [x] API設計（Webエンドポイント）
- [x] 画面設計（Thymeleaf）
- [x] 見積もり（12.6人日、約3週間）

**完了**: 2025-11-06

### ✅ Phase 3: Tasks（タスク分割）
- [x] TDD開発タスク分割（13ストーリー）
- [x] 詳細見積もり作成（29 SP、約14.5日）
- [x] 優先順位付け（Phase 1-7）
- [x] 依存関係グラフ作成
- [x] JIRAタスク作成用サマリー

**完了**: 2025-11-06

### ⬜ Phase 4: Implementation（実装）
- [ ] TDDでの開発
- [ ] コードレビュー
- [ ] ドキュメント更新

**Next Step**: `/kiro:spec-impl calculator-app`

## プロジェクト情報

- **プロジェクトID**: michi-practice1
- **JIRA Project**: [MP (michi-practice1)](https://0kuri0n.atlassian.net/jira/software/projects/MP/board)
- **Epic**: [MP-1](https://0kuri0n.atlassian.net/browse/MP-1)（Web電卓アプリケーション開発）
- **ストーリー**: 13個（MP-2 〜 MP-14）すべて作成済み ✅
- **ステータス**: Tasks
- **優先度**: High
- **Confluence**: [要件定義](https://0kuri0n.atlassian.net/wiki/spaces/Michi/pages/41058307) | [設計書](https://0kuri0n.atlassian.net/wiki/spaces/Michi/pages/41124290)

## ドキュメント

- ✅ [要件定義書](./requirements.md) - 完了（2025-11-06）
- ✅ [設計書](./design.md) - 完了（2025-11-06）
- ✅ [タスク一覧](./tasks.md) - 完了（2025-11-06）

## 関連リンク

- [プロジェクト設定](../../project.json)
- [技術スタック](../../steering/tech.md)
- [プロダクトコンテキスト](../../steering/product.md)

