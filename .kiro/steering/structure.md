# Project Structure - {{PROJECT_NAME}}

## プロジェクト: calculator-app（Onion Architecture）

### Javaプロジェクト構造（Spring Boot + Onion Architecture）

```
calculator-app/
├── .cursor/                          # Cursor IDE設定
│   ├── commands/                     # カスタムコマンド
│   └── rules/                        # ワークスペースルール
├── .kiro/                            # AI-DLC設定
│   ├── project.json                  # プロジェクトメタデータ
│   ├── settings/                     # テンプレート・設定
│   ├── specs/                        # 機能仕様書
│   │   └── calculator-app/           # 電卓アプリ仕様
│   └── steering/                     # AIガイダンス
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/calculator/
│   │   │       ├── domain/           # ドメイン層（最内層）
│   │   │       │   ├── model/        # エンティティ、値オブジェクト
│   │   │       │   │   ├── Calculation.java
│   │   │       │   │   └── CalculationResult.java
│   │   │       │   └── service/      # ドメインサービス
│   │   │       │       └── CalculatorDomainService.java
│   │   │       ├── application/      # アプリケーション層
│   │   │       │   ├── usecase/      # ユースケース
│   │   │       │   │   ├── CalculateUseCase.java
│   │   │       │   │   └── GetHistoryUseCase.java
│   │   │       │   └── port/         # ポート（インターフェース）
│   │   │       │       ├── in/       # 入力ポート
│   │   │       │       │   └── CalculatorService.java
│   │   │       │       └── out/      # 出力ポート
│   │   │       │           └── CalculationRepository.java
│   │   │       ├── infrastructure/   # インフラストラクチャ層
│   │   │       │   ├── persistence/  # データ永続化
│   │   │       │   │   ├── entity/
│   │   │       │   │   │   └── CalculationEntity.java
│   │   │       │   │   └── repository/
│   │   │       │   │       └── JpaCalculationRepository.java
│   │   │       │   └── config/       # 設定
│   │   │       │       └── PersistenceConfig.java
│   │   │       └── presentation/     # プレゼンテーション層（最外層）
│   │   │           ├── controller/   # コントローラー
│   │   │           │   └── CalculatorController.java
│   │   │           ├── dto/          # Data Transfer Object
│   │   │           │   ├── CalculationRequest.java
│   │   │           │   └── CalculationResponse.java
│   │   │           └── config/       # Web設定
│   │   │               └── WebConfig.java
│   │   └── resources/
│   │       ├── templates/            # Thymeleafテンプレート
│   │       │   ├── index.html
│   │       │   └── history.html
│   │       ├── static/               # 静的リソース
│   │       │   ├── css/
│   │       │   │   └── calculator.css
│   │       │   └── js/
│   │       │       └── calculator.js
│   │       └── application.yml       # Spring Boot設定
│   └── test/
│       └── java/
│           └── com/example/calculator/
│               ├── domain/            # ドメイン層テスト
│               │   └── service/
│               │       └── CalculatorDomainServiceTest.java
│               ├── application/       # アプリケーション層テスト
│               │   └── usecase/
│               │       └── CalculateUseCaseTest.java
│               ├── infrastructure/    # インフラ層テスト
│               │   └── persistence/
│               │       └── JpaCalculationRepositoryTest.java
│               └── presentation/      # プレゼンテーション層テスト
│                   └── controller/
│                       └── CalculatorControllerTest.java
├── docs/                             # ドキュメント
├── pom.xml / build.gradle            # ビルド設定
└── README.md                         # プロジェクトREADME
```

---

## その他プロジェクト（TypeScript/Node.js）

### ディレクトリ構造

```
project-root/
├── .cursor/              # Cursor IDE設定
│   ├── commands/         # カスタムコマンド
│   └── rules/            # ワークスペースルール
├── .kiro/                # AI-DLC設定
│   ├── project.json      # プロジェクトメタデータ
│   ├── settings/         # テンプレート・設定
│   ├── specs/            # 機能仕様書
│   └── steering/         # AIガイダンス
├── src/                  # ソースコード
│   ├── components/       # UIコンポーネント
│   ├── pages/            # ページコンポーネント
│   ├── services/         # ビジネスロジック
│   ├── repositories/     # データアクセス層
│   ├── models/           # データモデル
│   ├── utils/            # ユーティリティ
│   ├── types/            # TypeScript型定義
│   └── config/           # 設定ファイル
├── tests/                # テストコード
│   ├── unit/             # 単体テスト
│   ├── integration/      # 統合テスト
│   └── e2e/              # E2Eテスト
├── scripts/              # 自動化スクリプト
├── docs/                 # ドキュメント
└── package.json          # 依存関係
```

## コード配置ルール（calculator-app: Java + Onion Architecture）

### Onion Architecture 依存関係ルール

**重要**: 依存関係は常に「外側から内側へ」のみ

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ────┘
```

#### ❌ 禁止事項
- Domain層がInfrastructure層に依存すること
- Domain層がApplication層に依存すること
- Application層がPresentation層に依存すること

#### ✅ 許可事項
- Presentation層がApplication層に依存すること
- Application層がDomain層に依存すること
- Infrastructure層がDomain層に依存すること（実装のため）

### Domain層（最内層）

#### domain/model/
- **役割**: エンティティ、値オブジェクト
- **命名**: PascalCase (例: `Calculation.java`, `CalculationResult.java`)
- **ルール**:
  - フレームワーク非依存（純粋なJava）
  - ビジネスロジックの中核
  - 不変オブジェクト推奨
  - 外部依存一切なし

```java
// ✅ Good: 純粋なドメインモデル
public class Calculation {
    private final BigDecimal operand1;
    private final BigDecimal operand2;
    private final Operation operation;
    
    // コンストラクタ、ビジネスロジック
}

// ❌ Bad: インフラ依存
@Entity // JPA依存 - NG!
public class Calculation {
    // ...
}
```

#### domain/service/
- **役割**: ドメインサービス（複数エンティティにまたがるロジック）
- **命名**: PascalCase + DomainService (例: `CalculatorDomainService.java`)
- **ルール**:
  - ステートレス
  - ドメインモデルのみに依存
  - 外部依存なし

### Application層

#### application/usecase/
- **役割**: ユースケース（アプリケーション固有のビジネスロジック）
- **命名**: PascalCase + UseCase (例: `CalculateUseCase.java`)
- **ルール**:
  - 1ユースケース = 1クラス
  - Domain層のサービス・モデルを使用
  - インターフェース（Port）経由でInfrastructureにアクセス

```java
// ✅ Good: ポート（インターフェース）経由
public class CalculateUseCase {
    private final CalculationRepository repository; // インターフェース
    
    public CalculateUseCase(CalculationRepository repository) {
        this.repository = repository;
    }
}

// ❌ Bad: 具象クラスに依存
public class CalculateUseCase {
    private final JpaCalculationRepository repository; // NG!
}
```

#### application/port/
- **役割**: インターフェース定義（依存性逆転）
- **サブディレクトリ**:
  - `in/`: 入力ポート（Presentationから呼ばれる）
  - `out/`: 出力ポート（Infrastructureが実装）

### Infrastructure層

#### infrastructure/persistence/
- **役割**: データ永続化の実装
- **命名**: 
  - Entity: PascalCase + Entity (例: `CalculationEntity.java`)
  - Repository: Jpa + PascalCase + Repository (例: `JpaCalculationRepository.java`)
- **ルール**:
  - Application層のポート（インターフェース）を実装
  - JPA、Hibernateなどフレームワーク依存OK
  - ドメインモデルとEntityの変換を行う

```java
// ✅ Good: インターフェースを実装
@Repository
public class JpaCalculationRepository implements CalculationRepository {
    // JPA実装
}
```

### Presentation層（最外層）

#### presentation/controller/
- **役割**: HTTPリクエストハンドリング
- **命名**: PascalCase + Controller (例: `CalculatorController.java`)
- **ルール**:
  - Spring MVCアノテーション使用OK
  - Application層のUseCaseを呼び出すのみ
  - ビジネスロジックを含まない
  - DTOとドメインモデルの変換

```java
// ✅ Good: 薄いコントローラー
@Controller
public class CalculatorController {
    private final CalculateUseCase calculateUseCase;
    
    @PostMapping("/calculate")
    public String calculate(@ModelAttribute CalculationRequest request, Model model) {
        CalculationResult result = calculateUseCase.execute(request.toDomain());
        model.addAttribute("result", CalculationResponse.from(result));
        return "result";
    }
}
```

#### presentation/dto/
- **役割**: Data Transfer Object（外部とのデータ受け渡し）
- **命名**: PascalCase + Request/Response (例: `CalculationRequest.java`)
- **ルール**:
  - バリデーションアノテーション使用OK
  - ドメインモデルとの変換メソッド提供

### テスト構造（TDD）

#### 各層のテスト方針

**Domain層テスト:**
- 純粋な単体テスト
- モック不要（依存なしのため）
- すべてのビジネスロジックをカバー

**Application層テスト:**
- UseCaseの単体テスト
- Repositoryはモック化
- ユースケースシナリオをテスト

**Infrastructure層テスト:**
- 統合テスト（実際のDB使用）
- `@DataJpaTest` 使用
- トランザクションロールバック

**Presentation層テスト:**
- `@WebMvcTest` 使用
- MockMvc でHTTPリクエストをテスト
- UseCaseはモック化

---

## コード配置ルール（TypeScript/Node.js）

### フロントエンド (src/)

#### components/
- **役割**: 再利用可能なUIコンポーネント
- **命名**: PascalCase (例: `Button.tsx`, `UserCard.tsx`)
- **ルール**: 
  - 1ファイル1コンポーネント
  - Propsの型定義必須
  - Storybook対応

#### pages/
- **役割**: ページコンポーネント（ルーティング）
- **命名**: PascalCase (例: `HomePage.tsx`, `UserProfilePage.tsx`)
- **ルール**:
  - ページ固有のロジックのみ
  - 共通ロジックはhooks/servicesへ

#### services/
- **役割**: ビジネスロジック、API通信
- **命名**: camelCase + Service (例: `userService.ts`, `authService.ts`)
- **ルール**:
  - 関心の分離
  - 依存性注入

### バックエンド (src/)

#### controllers/
- **役割**: HTTPリクエストハンドリング
- **命名**: camelCase + Controller (例: `userController.ts`)
- **ルール**:
  - 薄いレイヤー（バリデーション、レスポンス形成のみ）
  - ビジネスロジックはservicesへ

#### services/
- **役割**: ビジネスロジック
- **命名**: camelCase + Service (例: `userService.ts`)
- **ルール**:
  - 単一責任原則
  - テスタビリティ重視

#### repositories/
- **役割**: データアクセス層
- **命名**: camelCase + Repository (例: `userRepository.ts`)
- **ルール**:
  - DBアクセスのみ
  - ビジネスロジックを含まない

#### models/
- **役割**: データモデル、エンティティ
- **命名**: PascalCase (例: `User.ts`, `Product.ts`)
- **ルール**:
  - ドメインモデル
  - バリデーションルール

### テスト (tests/)

#### 命名規則
- **単体テスト**: `<filename>.test.ts`
- **統合テスト**: `<filename>.integration.test.ts`
- **E2Eテスト**: `<filename>.e2e.test.ts`

#### ディレクトリ構造
```
tests/
├── unit/
│   └── services/
│       └── userService.test.ts
├── integration/
│   └── api/
│       └── userAPI.integration.test.ts
└── e2e/
    └── user/
        └── userRegistration.e2e.test.ts
```

## ファイル命名規則

### TypeScript/JavaScript
- **コンポーネント**: PascalCase (例: `Button.tsx`)
- **ユーティリティ**: camelCase (例: `formatDate.ts`)
- **定数**: UPPER_SNAKE_CASE (例: `API_ENDPOINTS.ts`)
- **型定義**: PascalCase (例: `User.ts`, `types.ts`)

### CSS/スタイル
- **モジュールCSS**: `<component>.module.css`
- **グローバル**: `global.css`

### ドキュメント
- **Markdown**: kebab-case (例: `user-guide.md`)
- **README**: `README.md` (大文字)

## インポート順序

```typescript
// 1. 外部ライブラリ
import React from 'react';
import { useState } from 'react';

// 2. 内部モジュール（絶対パス）
import { Button } from '@/components/Button';
import { userService } from '@/services/userService';

// 3. 相対パス
import { helper } from './helpers';
import styles from './Component.module.css';

// 4. 型定義
import type { User } from '@/types';
```

## コードスタイル

### 関数
```typescript
// ✅ Good: アロー関数、明示的な型
export const fetchUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// ❌ Bad: function キーワード、型なし
export function fetchUser(id) {
  // ...
}
```

### コンポーネント
```typescript
// ✅ Good: 関数コンポーネント、Props型定義
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = 'primary' }) => {
  return <button className={variant} onClick={onClick}>{label}</button>;
};

// ❌ Bad: クラスコンポーネント、型なし
export class Button extends React.Component {
  render() {
    return <button>{this.props.label}</button>;
  }
}
```

## 状態管理

### ローカル状態
```typescript
// useState for component-local state
const [count, setCount] = useState(0);
```

### グローバル状態
```typescript
// Context API for simple global state
// Redux/Zustand for complex global state
```

### サーバー状態
```typescript
// React Query / SWR for server state
const { data, isLoading, error } = useQuery('users', fetchUsers);
```

## エラーハンドリング

### 階層的エラーハンドリング
```typescript
// 1. API層: HTTPエラーを変換
// 2. Service層: ビジネスロジックエラー
// 3. UI層: エラー表示
```

### カスタムエラークラス
```typescript
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## 環境変数

### 命名規則
- **プレフィックス**: `VITE_` (Vite) / `NEXT_PUBLIC_` (Next.js)
- **形式**: UPPER_SNAKE_CASE
- **例**: `VITE_API_BASE_URL`, `VITE_APP_ENV`

### 使用方法
```typescript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
```

## ドキュメントの配置

### コード内ドキュメント
- **JSDoc**: 関数・クラスに必須
- **コメント**: 複雑なロジックに説明

### 外部ドキュメント
- **README.md**: プロジェクトルート
- **docs/**: 詳細ドキュメント
  - `docs/setup.md`: セットアップ手順
  - `docs/architecture.md`: アーキテクチャ
  - `docs/api.md`: API仕様

### 仕様書
- **.kiro/specs/**: 機能仕様書（GitHub SSoT）
  - `requirements.md`: 要件定義
  - `design.md`: 設計
  - `tasks.md`: タスク分割

