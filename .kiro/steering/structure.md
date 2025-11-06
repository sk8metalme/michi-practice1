# Project Structure - {{PROJECT_NAME}}

## ディレクトリ構造

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

## コード配置ルール

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

