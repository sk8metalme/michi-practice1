# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`
- Commands: `.cursor/commands/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- **calculator-app**: Web電卓アプリケーション（Java + Spring Boot + Thymeleaf、Onion Architecture、TDD）
- Check `.kiro/specs/` for active specifications
- Use `/kiro/spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, but generate responses in Japanese (思考は英語、回答の生成は日本語で行うように)

## Workflow

### Phase 0: Steering (Optional)
`/kiro/steering` - Create/update steering documents
`/kiro/steering-custom` - Create custom steering for specialized contexts

**Note**: Optional for new features or small additions. Can proceed directly to spec-init.

### Phase 1: Specification Creation
1. `/kiro/spec-init [detailed description]` - Initialize spec with detailed project description
2. `/kiro/spec-requirements [feature]` - Generate requirements document
   - **自動実行**: Confluenceページ作成（要件定義）
   - **自動実行**: spec.json更新
3. `/kiro/spec-design [feature]` - Interactive: "Have you reviewed requirements.md? [y/N]"
   - **自動実行**: Confluenceページ作成（設計書）
   - **自動実行**: spec.json更新
4. `/kiro/spec-tasks [feature]` - Interactive: Confirms both requirements and design review
   - **自動実行**: JIRA Epic作成
   - **自動実行**: JIRA Story作成（全ストーリー）
   - **自動実行**: spec.json更新

### Phase 2: Progress Tracking
`/kiro/spec-status [feature]` - Check current progress and phases

### 各フェーズの完了チェックリスト

#### `/kiro:spec-requirements` 完了時
- [ ] requirements.md作成済み
- [ ] **Confluenceページ作成済み（要件定義）**
- [ ] spec.jsonにconfluence.requirementsPageId記録
- [ ] PMや部長にレビュー依頼通知

#### `/kiro:spec-design` 完了時
- [ ] design.md作成済み
- [ ] **Confluenceページ作成済み（設計書）**
- [ ] spec.jsonにconfluence.designPageId記録
- [ ] PMや部長にレビュー依頼通知

#### `/kiro:spec-tasks` 完了時
- [ ] tasks.md作成済み（営業日ベース）
- [ ] **JIRA Epic作成済み**
- [ ] **JIRA Story全作成済み**
- [ ] spec.jsonにjira.epicKey, jira.stories記録
- [ ] 開発チームに実装開始通知

**重要**: これらのチェックリストが完了していない場合、次のフェーズに進まないこと

### スクリプトによる自動化（推奨）

**抜け漏れ防止**: 各フェーズ完了時にスクリプトを実行することで、Confluence/JIRA作成を確実に実行できます。

#### 要件定義フェーズ

```bash
# AIで requirements.md を作成後
npm run phase:run calculator-app requirements

# 実行内容:
#  1. requirements.md 存在確認
#  2. Confluenceページ自動作成
#  3. spec.json自動更新
#  4. バリデーション実行
```

#### 設計フェーズ

```bash
# AIで design.md を作成後
npm run phase:run calculator-app design

# 実行内容:
#  1. design.md 存在確認
#  2. Confluenceページ自動作成
#  3. spec.json自動更新
#  4. バリデーション実行
```

#### タスク分割フェーズ

```bash
# AIで tasks.md を作成後（営業日ベース）
npm run phase:run calculator-app tasks

# 実行内容:
#  1. tasks.md 存在確認
#  2. JIRA Epic自動作成
#  3. JIRA Story自動作成（全ストーリー）
#  4. spec.json自動更新
#  5. バリデーション実行
```

#### バリデーションのみ実行

```bash
# フェーズが完了しているか確認
npm run validate:phase calculator-app requirements
npm run validate:phase calculator-app design
npm run validate:phase calculator-app tasks

# Exit code 0: 成功（すべて完了）
# Exit code 1: 失敗（未完了項目あり）
```

## tasks.mdの構造（6フェーズ）

tasks.mdは**全開発フェーズ**を含む必要があります：

1. **Phase 0: 要件定義（Requirements）** - 要件定義書作成、PM承認
2. **Phase 1: 設計（Design）** - 基本設計、詳細設計、技術レビュー
3. **Phase 2: 実装（Implementation）** - プロジェクトセットアップ、コア機能実装
4. **Phase 3: 試験（Testing）** - 結合テスト、E2E、性能テスト
5. **Phase 4: リリース準備（Release Preparation）** - 本番環境構築、リリースドキュメント作成
6. **Phase 5: リリース（Release）** - ステージングデプロイ、本番リリース、承認

### フェーズヘッダーの形式（必須）

```markdown
## Phase X: フェーズ名（ラベル）
```

**重要**: `（ラベル）`部分は必須です。JIRAストーリーのラベル検出に使用されます。

**例**:
```markdown
## Phase 0: 要件定義（Requirements）
### Story 0.1: 要件定義書作成

## Phase 1: 設計（Design）
### Story 1.1: 基本設計

## Phase 3: 試験（Testing）
### Story 3.1: 結合テスト
```

## Development Rules
1. **Consider steering**: Run `/kiro/steering` before major development (optional for new features)
2. **Follow 6-phase workflow**: Requirements → Design → Implementation → Testing → Release-Prep → Release
3. **Approval required**: Each phase requires human review (interactive prompt or manual)
4. **No skipping phases**: Design requires approved requirements; Tasks require approved design
5. **Update task status**: Mark tasks as completed when working on them
6. **Keep steering current**: Run `/kiro/steering` after significant changes
7. **Check spec compliance**: Use `/kiro/spec-status` to verify alignment
8. **Tasks with business days**: タスク分割（tasks.md）作成時は、必ず土日・祝日を除いた営業日ベースでスケジュールを計算すること
   - 土曜日・日曜日を除外
   - 祝日を除外（該当する場合）
   - 曜日表記を追加（月、火、水、木、金）
   - 営業日カウント（Day 1, Day 2...）を明記
9. **Confluence/JIRA自動作成（必須）**: 各フェーズ完了後、必ずConfluence/JIRAを自動作成すること
   - `/kiro:spec-requirements` 完了後 → Confluenceページ作成（要件定義）
   - `/kiro:spec-design` 完了後 → Confluenceページ作成（設計書）
   - `/kiro:spec-tasks` 完了後 → **全6フェーズのJIRA Epic/Story作成**（ラベル自動付与）
   - **理由**: PMや部長のレビューのため、実装前に必須
   - **抜け漏れ防止**: フローチェックリストで確認

## Steering Configuration

### Current Steering Files
Managed by `/kiro/steering` command. Updates here reflect command changes.

### Active Steering Files
- `product.md`: Always included - Product context and business objectives
- `tech.md`: Always included - Technology stack and architectural decisions
- `structure.md`: Always included - File organization and code patterns

### Custom Steering Files
<!-- Added by /kiro/steering-custom command -->
<!-- Format:
- `filename.md`: Mode - Pattern(s) - Description
  Mode: Always|Conditional|Manual
  Pattern: File patterns for Conditional mode
-->

### Inclusion Modes
- **Always**: Loaded in every interaction (default)
- **Conditional**: Loaded for specific file patterns (e.g., `"*.test.js"`)
- **Manual**: Reference with `@filename.md` syntax

