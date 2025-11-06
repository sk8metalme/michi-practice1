# 要件定義: Web電卓アプリケーション

> **プロジェクト**: michi-practice1  
> **作成日**: 2025-11-06  
> **作成者**: 開発チーム  
> **ステータス**: レビュー待ち

## 概要

Webブラウザで動作する電卓アプリケーションを開発します。Java + Spring Boot + Thymeleafを使用し、Onion Architectureで設計、TDD（テスト駆動開発）で実装します。ユーザーは四則演算を実行し、計算履歴を確認できます。

## ビジネス要件

### 背景・目的

**背景**:
- 教育・学習目的で、モダンなWebアプリケーション開発のベストプラクティスを実践
- Onion Architectureの理解と適用
- TDDによる高品質なコード開発の実証

**目的**:
1. クリーンアーキテクチャ（Onion Architecture）の実装例を作成
2. TDDの実践的なワークフローを確立
3. Spring Boot + Thymeleafによるフルスタック開発の学習

### 対象ユーザー

**主要ユーザー**:
- 一般的な計算を必要とするWebユーザー
- 学習・教育目的で電卓機能を利用する学生

**開発者ユーザー**:
- Onion Architectureを学習したい開発者
- TDDの実践例を参照したい開発者
- Spring Bootのモダンな開発手法を学びたい開発者

### 期待される成果

1. **技術的成果**:
   - Onion Architectureの依存関係ルールに準拠したコードベース
   - 95%以上のテストカバレッジ（TDDによる実装）
   - 保守性・拡張性の高いアーキテクチャ

2. **ビジネス的成果**:
   - 直感的に使える電卓UI
   - 計算履歴による利便性向上
   - レスポンシブ対応（PC・スマホ両対応）

## 機能要件

### FR-001: 四則演算の実行

**優先度**: High  
**説明**: 
ユーザーは2つの数値を入力し、四則演算（加算、減算、乗算、除算）を実行できます。計算結果は即座に画面に表示されます。

**受け入れ条件**:
- [x] 加算（A + B）が正しく計算できる
- [x] 減算（A - B）が正しく計算できる
- [x] 乗算（A × B）が正しく計算できる
- [x] 除算（A ÷ B）が正しく計算できる
- [x] 計算結果が小数点以下10桁まで表示される
- [x] 結果はBigDecimalを使用して精度を保証

### FR-002: ゼロ除算エラーハンドリング

**優先度**: High  
**説明**: 
除数がゼロの場合、計算を実行せず、エラーメッセージを表示します。

**受け入れ条件**:
- [x] 除数が0の場合、「ゼロで割ることはできません」とエラー表示
- [x] エラー時は計算結果を更新しない
- [x] エラーメッセージは赤色で強調表示
- [x] エラー後も入力フィールドは保持される

### FR-003: 入力検証

**優先度**: High  
**説明**: 
数値以外の入力を受け付けず、適切なバリデーションメッセージを表示します。

**受け入れ条件**:
- [x] 数値フィールドには数値のみ入力可能
- [x] 空の入力は受け付けない
- [x] 不正な入力時は「有効な数値を入力してください」と表示
- [x] 負の数も入力可能
- [x] 小数点も入力可能

### FR-004: 計算履歴の保存と表示

**優先度**: Medium  
**説明**: 
実行された計算の履歴を保存し、一覧表示します。ユーザーは過去の計算結果を参照できます。

**受け入れ条件**:
- [x] 計算実行時に履歴が自動保存される
- [x] 履歴には以下の情報が含まれる：
  - 演算子1、演算子2、演算子、結果
  - 計算日時（YYYY-MM-DD HH:mm:ss形式）
- [x] 履歴は最新の計算が上に表示される（降順）
- [x] 履歴ページへのリンクがトップページにある
- [x] 履歴は最大100件まで保存（古いものは自動削除）

### FR-005: 履歴のクリア機能

**優先度**: Low  
**説明**: 
ユーザーは保存された計算履歴をすべて削除できます。

**受け入れ条件**:
- [x] 「履歴をクリア」ボタンをクリックで全履歴削除
- [x] 削除前に確認ダイアログを表示
- [x] 削除後は「履歴がクリアされました」とメッセージ表示

### FR-006: レスポンシブデザイン

**優先度**: Medium  
**説明**: 
PC、タブレット、スマートフォンなど、様々なデバイスで快適に使用できるUIを提供します。

**受け入れ条件**:
- [x] PC（横幅 ≥ 1024px）で最適化されたレイアウト
- [x] タブレット（768px ≤ 横幅 < 1024px）で最適化されたレイアウト
- [x] スマートフォン（横幅 < 768px）で最適化されたレイアウト
- [x] タッチ操作に適したボタンサイズ（最小44x44px）
- [x] すべてのデバイスで読みやすいフォントサイズ

## 非機能要件

### NFR-001: パフォーマンス

**要件**:
- **レスポンスタイム**: 計算実行は200ms以内に完了
- **画面読み込み**: 初回ページロードは1秒以内
- **スループット**: 同時10ユーザーまで対応（教育用のため）

**測定方法**:
- JMeterによる負荷テスト
- Spring Boot Actuatorでメトリクス監視

### NFR-002: セキュリティ

**要件**:
- **入力検証**: すべてのユーザー入力をサーバー側でバリデーション
- **XSS対策**: Thymeleafのエスケープ機能を使用
- **CSRF対策**: Spring SecurityのCSRF保護を有効化
- **SQL Injection対策**: JPAのパラメータバインディングを使用

**実装方針**:
- Bean Validationによる入力検証
- Thymeleafの `th:text` によるエスケープ
- Spring Securityの標準設定

### NFR-003: 可用性

**要件**:
- **稼働率**: 開発環境では特に要求なし（学習用）
- **障害復旧時間**: アプリケーション再起動で復旧（< 1分）

**実装方針**:
- Spring Boot Actuatorによるヘルスチェック
- エラーログの適切な記録

### NFR-004: ユーザビリティ

**要件**:
- **直感的なUI**: ボタン配置は一般的な電卓に準拠
- **レスポンスフィードバック**: 計算実行時にボタンの視覚的フィードバック
- **エラーメッセージ**: ユーザーが理解しやすい日本語メッセージ
- **アクセシビリティ**: キーボード操作に対応

**実装方針**:
- Bootstrap 5によるモダンなUI
- フォームのlabelとinputの適切な関連付け
- ARIA属性の適切な使用

### NFR-005: テスタビリティ（TDD）

**要件**:
- **テストカバレッジ**: 95%以上
- **テスト層別構成**:
  - Domain層: 100%（純粋なビジネスロジック）
  - Application層: 95%以上（ユースケース）
  - Infrastructure層: 90%以上（統合テスト）
  - Presentation層: 90%以上（コントローラー）

**実装方針**:
- JUnit 5による単体テスト
- AssertJによる流暢なアサーション
- Mockitoによるモック化
- @WebMvcTestによるコントローラーテスト
- @DataJpaTestによるリポジトリテスト

### NFR-006: 保守性（Onion Architecture）

**要件**:
- **依存関係**: 外側から内側への一方向依存を厳守
- **層の独立性**: 各層は独立してテスト可能
- **フレームワーク非依存**: Domain層はフレームワーク依存なし

**実装方針**:
- Application層はポート（インターフェース）経由でInfrastructureにアクセス
- Domain層は純粋なJavaコード（Spring非依存）
- 依存性注入はコンストラクタインジェクション

### NFR-007: 拡張性

**要件**:
- **新規演算の追加**: 新しい演算（累乗、平方根など）を容易に追加可能
- **計算方式の変更**: 計算アルゴリズムの変更が他の層に影響しない

**実装方針**:
- Strategy パターンによる演算の抽象化
- Open/Closed Principleの適用

## 制約条件

### 技術的制約

**必須技術スタック**:
- **言語**: Java 21以上
- **フレームワーク**: Spring Boot 3.5
- **テンプレートエンジン**: Thymeleaf 3.x
- **ビルドツール**: Maven または Gradle
- **テストフレームワーク**: JUnit 5, AssertJ, Mockito
- **データベース**: H2 Database（開発・テスト用）、PostgreSQL（本番想定）

**アーキテクチャ制約**:
- Onion Architecture の依存関係ルールを厳守
- TDD（テスト駆動開発）で実装

**互換性**:
- Java 21以上で動作
- モダンブラウザ（Chrome、Firefox、Safari、Edge）最新版に対応

### ビジネス的制約

**予算**: 学習・教育目的のため予算制約なし  
**スケジュール**: 
- 要件定義: 1日
- 設計: 1日
- 実装: 3-5日（TDDによる実装）
- テスト・レビュー: 1日

**リソース**:
- 開発者: 1名（学習目的）
- レビュワー: AI + 人間レビュー

## 想定される影響範囲

### 既存機能への影響

**新規開発のため既存機能への影響なし**

### 他システムとの連携

**外部システム連携なし**（スタンドアロンアプリケーション）

将来的な拡張案:
- REST APIの提供（他システムから計算機能を利用）
- 計算履歴のCSVエクスポート

## アーキテクチャ要件

### Onion Architecture 層定義

**Domain層（最内層）**:
- `Calculation` エンティティ（計算情報）
- `CalculationResult` 値オブジェクト（計算結果）
- `Operation` 列挙型（演算種別）
- `CalculatorDomainService` ドメインサービス（計算ロジック）

**Application層**:
- `CalculateUseCase` ユースケース（計算実行）
- `GetHistoryUseCase` ユースケース（履歴取得）
- `ClearHistoryUseCase` ユースケース（履歴削除）
- ポート（インターフェース）:
  - `CalculatorService`（入力ポート）
  - `CalculationRepository`（出力ポート）

**Infrastructure層**:
- `CalculationEntity` JPA エンティティ
- `JpaCalculationRepository` リポジトリ実装
- `PersistenceConfig` 永続化設定

**Presentation層**:
- `CalculatorController` コントローラー
- `CalculationRequest` / `CalculationResponse` DTO
- Thymeleafテンプレート（`index.html`, `history.html`）

### 依存関係ルール

```
✅ 許可される依存:
Presentation → Application → Domain
Infrastructure → Domain

❌ 禁止される依存:
Domain → Application
Domain → Infrastructure
Application → Presentation
Infrastructure → Presentation
```

## TDD開発プロセス要件

### Red-Green-Refactor サイクル

**必須プロセス**:
1. **Red**: テストを先に書く（失敗することを確認）
2. **Green**: 最小限のコードで テストをパスさせる
3. **Refactor**: コードをリファクタリング（テストは維持）

### テスト作成順序

**推奨順序**:
1. Domain層のテスト（純粋なビジネスロジック）
2. Application層のテスト（ユースケース）
3. Infrastructure層のテスト（リポジトリ）
4. Presentation層のテスト（コントローラー）

### コミット規約（TDD）

**コミットメッセージパターン**:
- `test: [Domain] 加算のテストを追加`
- `feat: [Domain] 加算ロジックを実装`
- `refactor: [Domain] 計算ロジックをリファクタリング`

## リスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| TDD未経験によるスケジュール遅延 | Medium | Medium | ペアプログラミング、AI支援活用 |
| Onion Architecture の理解不足 | High | Medium | ドキュメント整備、参考実装の調査 |
| テストカバレッジ95%未達 | Medium | Low | CI/CDでカバレッジチェック自動化 |
| ゼロ除算など特殊ケースの見落とし | Low | Medium | エッジケーステスト網羅 |
| ブラウザ間の動作差異 | Low | Low | Bootstrap 5使用で互換性確保 |

## レビュー・承認

### レビュワー
- [x] 技術リード: AI + 人間レビュー
- [x] 企画: 学習目的のため不要
- [ ] 部長: 承認待ち

### 承認ステータス
- [ ] 技術レビュー完了
- [ ] ビジネスレビュー完了（学習目的のため簡略化）
- [ ] 最終承認

### レビューポイント
1. **Onion Architecture**: 依存関係ルールが適切か
2. **TDD**: テストファーストアプローチが守られているか
3. **要件の明確性**: 実装可能なレベルで要件が定義されているか
4. **セキュリティ**: 入力検証などセキュリティ要件が十分か

## 付録

### 参考資料

**Onion Architecture**:
- [The Onion Architecture - Jeffrey Palermo](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

**TDD**:
- [Test Driven Development: By Example - Kent Beck](https://www.amazon.com/dp/0321146530)
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)

**Spring Boot + Thymeleaf**:
- [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Thymeleaf Documentation](https://www.thymeleaf.org/documentation.html)

### 用語集

| 用語 | 定義 |
|------|------|
| Onion Architecture | 依存関係を内側に向けることで、ビジネスロジックをフレームワークから独立させるアーキテクチャ |
| TDD | Test-Driven Development。テストを先に書き、そのテストをパスするコードを実装する開発手法 |
| Domain層 | ビジネスロジックの中核。外部依存なしの純粋なJavaコード |
| Port | Application層が定義するインターフェース。Infrastructure層が実装する |
| UseCase | アプリケーション固有のビジネスロジック。ユーザーのアクションに対応 |
| DTO | Data Transfer Object。層間でデータを受け渡すためのオブジェクト |
| BigDecimal | Javaの高精度小数演算クラス。金額計算や精密な計算に使用 |

### ユースケース図

```
[ユーザー]
  |
  |-- (計算を実行)
  |     |
  |     |-- (加算)
  |     |-- (減算)
  |     |-- (乗算)
  |     |-- (除算)
  |
  |-- (履歴を表示)
  |
  |-- (履歴をクリア)
```

### 画面遷移図

```
[トップページ]
  ├── 計算実行 → [トップページ]（結果表示）
  └── 履歴表示 → [履歴ページ]
        ├── 戻る → [トップページ]
        └── クリア → [履歴ページ]（空）
```

---

**GitHub**: [要件定義（最新版）](https://github.com/sk8metalme/michi-practice1/tree/main/.kiro/specs/calculator-app/requirements.md)  
**JIRA**: PRAC1-XX（Epic作成後に更新）

---

**次のステップ**: 
要件定義のレビューを受けた後、`/kiro:spec-design calculator-app` コマンドで設計フェーズに進んでください。

