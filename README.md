# michi-practice1

## AI開発ワークフロー

このプロジェクトは Michi AI開発フロー自動化システムを使用しています。

### 開発フロー

```
/kiro:spec-init <機能説明>
→ /kiro:spec-requirements <feature>
→ /kiro:spec-design <feature>
→ /kiro:spec-tasks <feature>
→ /kiro:spec-impl <feature> <tasks>
```

### Confluence/JIRA連携

```bash
npm run confluence:sync <feature>   # Confluence同期
npm run jira:sync <feature>         # JIRA連携
npm run github:create-pr <branch>   # PR作成
```

詳細: [Michi Documentation](https://github.com/sk8metalme/michi)
