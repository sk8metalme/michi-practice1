# 設計書: Web電卓アプリケーション

> **プロジェクト**: michi-practice1  
> **作成日**: 2025-11-06  
> **作成者**: 開発チーム  
> **ステータス**: レビュー待ち  
> **要件定義**: [requirements.md](./requirements.md)

## 概要

Java 21 + Spring Boot 3.5 + ThymeleafでWebブラウザ動作する電卓アプリケーションを開発します。Onion Architectureを採用し、ビジネスロジックをフレームワークから独立させることで、高い保守性と拡張性を実現します。TDD（テスト駆動開発）により、テストカバレッジ95%以上を目指します。

## アーキテクチャ設計

### Onion Architecture 全体像

```
┌─────────────────────────────────────────────────────────┐
│ Presentation Layer (最外層)                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Controller, DTO, Thymeleaf Templates               │ │
│ │ - CalculatorController                              │ │
│ │ - HistoryController                                 │ │
│ │ - CalculationRequest/Response                       │ │
│ └─────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ 依存（Controller → UseCase）
┌───────────────────────▼─────────────────────────────────┐
│ Application Layer                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Use Cases & Ports (Interfaces)                     │ │
│ │ - CalculateUseCase                                  │ │
│ │ - GetHistoryUseCase                                 │ │
│ │ - ClearHistoryUseCase                               │ │
│ │ - CalculatorService (入力ポート)                    │ │
│ │ - CalculationRepository (出力ポート)                │ │
│ └─────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ 依存（UseCase → Domain）
┌───────────────────────▼─────────────────────────────────┐
│ Domain Layer (最内層・ビジネスロジックの核)              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Pure Business Logic (フレームワーク非依存)         │ │
│ │ - Calculation (エンティティ)                        │ │
│ │ - CalculationResult (値オブジェクト)                │ │
│ │ - Operation (列挙型)                                │ │
│ │ - CalculatorDomainService                           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ▲
                        │ 依存（Infrastructure → Domain）
┌───────────────────────┴─────────────────────────────────┐
│ Infrastructure Layer                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ External Dependencies (JPA, H2, Config)            │ │
│ │ - CalculationEntity (JPA Entity)                    │ │
│ │ - JpaCalculationRepository (Repository実装)         │ │
│ │ - PersistenceConfig                                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 依存関係ルール（厳格に適用）

**✅ 許可される依存**:
- Presentation → Application → Domain
- Infrastructure → Domain

**❌ 禁止される依存**:
- Domain → Application（Domainは何にも依存しない）
- Domain → Infrastructure
- Application → Presentation
- Infrastructure → Presentation

**依存性逆転の原則（DIP）適用**:
- Application層がインターフェース（Port）を定義
- Infrastructure層がそのインターフェースを実装
- Application層は具象クラスではなくインターフェースに依存

## クラス設計

### Domain層（com.example.calculator.domain）

#### model/Calculation.java

```java
package com.example.calculator.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 計算エンティティ（ドメインモデル）
 * フレームワーク非依存の純粋なJavaクラス
 */
public class Calculation {
    private final Long id;
    private final BigDecimal operand1;
    private final BigDecimal operand2;
    private final Operation operation;
    private final BigDecimal result;
    private final LocalDateTime calculatedAt;

    // コンストラクタ（ビルダーパターン推奨）
    private Calculation(Builder builder) {
        this.id = builder.id;
        this.operand1 = Objects.requireNonNull(builder.operand1, "operand1 must not be null");
        this.operand2 = Objects.requireNonNull(builder.operand2, "operand2 must not be null");
        this.operation = Objects.requireNonNull(builder.operation, "operation must not be null");
        this.result = Objects.requireNonNull(builder.result, "result must not be null");
        this.calculatedAt = builder.calculatedAt != null ? builder.calculatedAt : LocalDateTime.now();
    }

    // Getters (不変オブジェクトのためSetterなし)
    public Long getId() { return id; }
    public BigDecimal getOperand1() { return operand1; }
    public BigDecimal getOperand2() { return operand2; }
    public Operation getOperation() { return operation; }
    public BigDecimal getResult() { return result; }
    public LocalDateTime getCalculatedAt() { return calculatedAt; }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private BigDecimal operand1;
        private BigDecimal operand2;
        private Operation operation;
        private BigDecimal result;
        private LocalDateTime calculatedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder operand1(BigDecimal operand1) { this.operand1 = operand1; return this; }
        public Builder operand2(BigDecimal operand2) { this.operand2 = operand2; return this; }
        public Builder operation(Operation operation) { this.operation = operation; return this; }
        public Builder result(BigDecimal result) { this.result = result; return this; }
        public Builder calculatedAt(LocalDateTime calculatedAt) { this.calculatedAt = calculatedAt; return this; }
        public Calculation build() { return new Calculation(this); }
    }

    // equals, hashCode, toString
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Calculation that = (Calculation) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Calculation{" +
                "operand1=" + operand1 +
                " " + operation +
                " operand2=" + operand2 +
                " = result=" + result +
                '}';
    }
}
```

#### model/CalculationResult.java

```java
package com.example.calculator.domain.model;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * 計算結果の値オブジェクト
 * 計算処理の結果を表す不変オブジェクト
 */
public class CalculationResult {
    private final BigDecimal value;
    private final boolean success;
    private final String errorMessage;

    // 成功時のコンストラクタ
    private CalculationResult(BigDecimal value) {
        this.value = Objects.requireNonNull(value, "value must not be null");
        this.success = true;
        this.errorMessage = null;
    }

    // エラー時のコンストラクタ
    private CalculationResult(String errorMessage) {
        this.value = null;
        this.success = false;
        this.errorMessage = Objects.requireNonNull(errorMessage, "errorMessage must not be null");
    }

    // ファクトリメソッド
    public static CalculationResult success(BigDecimal value) {
        return new CalculationResult(value);
    }

    public static CalculationResult error(String errorMessage) {
        return new CalculationResult(errorMessage);
    }

    // Getters
    public BigDecimal getValue() {
        if (!success) {
            throw new IllegalStateException("Cannot get value from error result");
        }
        return value;
    }

    public boolean isSuccess() { return success; }
    public String getErrorMessage() { return errorMessage; }

    @Override
    public String toString() {
        return success ? "CalculationResult{value=" + value + "}" 
                       : "CalculationResult{error='" + errorMessage + "'}";
    }
}
```

#### model/Operation.java

```java
package com.example.calculator.domain.model;

/**
 * 演算種別の列挙型
 */
public enum Operation {
    ADD("+", "加算"),
    SUBTRACT("-", "減算"),
    MULTIPLY("×", "乗算"),
    DIVIDE("÷", "除算");

    private final String symbol;
    private final String description;

    Operation(String symbol, String description) {
        this.symbol = symbol;
        this.description = description;
    }

    public String getSymbol() { return symbol; }
    public String getDescription() { return description; }

    @Override
    public String toString() { return symbol; }
}
```

#### service/CalculatorDomainService.java

```java
package com.example.calculator.domain.service;

import com.example.calculator.domain.model.CalculationResult;
import com.example.calculator.domain.model.Operation;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 計算ドメインサービス
 * 四則演算のビジネスロジックを実装
 */
public class CalculatorDomainService {
    private static final int SCALE = 10; // 小数点以下10桁
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    /**
     * 計算を実行
     */
    public CalculationResult calculate(BigDecimal operand1, BigDecimal operand2, Operation operation) {
        try {
            BigDecimal result = switch (operation) {
                case ADD -> operand1.add(operand2);
                case SUBTRACT -> operand1.subtract(operand2);
                case MULTIPLY -> operand1.multiply(operand2);
                case DIVIDE -> {
                    if (operand2.compareTo(BigDecimal.ZERO) == 0) {
                        yield null; // ゼロ除算エラー
                    }
                    yield operand1.divide(operand2, SCALE, ROUNDING_MODE);
                }
            };

            if (result == null) {
                return CalculationResult.error("ゼロで割ることはできません");
            }

            return CalculationResult.success(result);
        } catch (ArithmeticException e) {
            return CalculationResult.error("計算エラー: " + e.getMessage());
        }
    }
}
```

### Application層（com.example.calculator.application）

#### port/in/CalculatorService.java（入力ポート）

```java
package com.example.calculator.application.port.in;

import com.example.calculator.domain.model.Calculation;
import com.example.calculator.domain.model.CalculationResult;
import com.example.calculator.domain.model.Operation;

import java.math.BigDecimal;
import java.util.List;

/**
 * 電卓サービスの入力ポート（インターフェース）
 * Presentation層がこのインターフェース経由でアプリケーション層を呼び出す
 */
public interface CalculatorService {
    /**
     * 計算を実行し、履歴に保存
     */
    CalculationResult calculate(BigDecimal operand1, BigDecimal operand2, Operation operation);

    /**
     * 計算履歴を取得（最新順）
     */
    List<Calculation> getHistory(int limit);

    /**
     * 計算履歴をすべてクリア
     */
    void clearHistory();
}
```

#### port/out/CalculationRepository.java（出力ポート）

```java
package com.example.calculator.application.port.out;

import com.example.calculator.domain.model.Calculation;

import java.util.List;
import java.util.Optional;

/**
 * 計算リポジトリの出力ポート（インターフェース）
 * Infrastructure層がこのインターフェースを実装
 */
public interface CalculationRepository {
    /**
     * 計算を保存
     */
    Calculation save(Calculation calculation);

    /**
     * IDで計算を検索
     */
    Optional<Calculation> findById(Long id);

    /**
     * 計算履歴を取得（最新順、件数制限）
     */
    List<Calculation> findAllOrderByCalculatedAtDesc(int limit);

    /**
     * すべての計算履歴を削除
     */
    void deleteAll();

    /**
     * 保存件数を取得
     */
    long count();
}
```

#### usecase/CalculateUseCase.java

```java
package com.example.calculator.application.usecase;

import com.example.calculator.application.port.in.CalculatorService;
import com.example.calculator.application.port.out.CalculationRepository;
import com.example.calculator.domain.model.Calculation;
import com.example.calculator.domain.model.CalculationResult;
import com.example.calculator.domain.model.Operation;
import com.example.calculator.domain.service.CalculatorDomainService;

import java.math.BigDecimal;
import java.util.List;

/**
 * 計算ユースケース
 * CalculatorServiceインターフェースを実装
 */
public class CalculateUseCase implements CalculatorService {
    private static final int MAX_HISTORY = 100;

    private final CalculatorDomainService calculatorDomainService;
    private final CalculationRepository calculationRepository;

    // コンストラクタインジェクション
    public CalculateUseCase(
            CalculatorDomainService calculatorDomainService,
            CalculationRepository calculationRepository) {
        this.calculatorDomainService = calculatorDomainService;
        this.calculationRepository = calculationRepository;
    }

    @Override
    public CalculationResult calculate(BigDecimal operand1, BigDecimal operand2, Operation operation) {
        // ドメインサービスで計算実行
        CalculationResult result = calculatorDomainService.calculate(operand1, operand2, operation);

        // 成功時のみ履歴に保存
        if (result.isSuccess()) {
            Calculation calculation = Calculation.builder()
                    .operand1(operand1)
                    .operand2(operand2)
                    .operation(operation)
                    .result(result.getValue())
                    .build();

            calculationRepository.save(calculation);

            // 履歴が100件を超えたら古いものを削除（簡易実装）
            maintainHistoryLimit();
        }

        return result;
    }

    @Override
    public List<Calculation> getHistory(int limit) {
        return calculationRepository.findAllOrderByCalculatedAtDesc(limit);
    }

    @Override
    public void clearHistory() {
        calculationRepository.deleteAll();
    }

    private void maintainHistoryLimit() {
        long count = calculationRepository.count();
        if (count > MAX_HISTORY) {
            // 実装簡略化のため、ここでは全削除後に最新100件のみ残す処理は省略
            // 本番実装では古い件のみ削除するロジックを実装
        }
    }
}
```

### Infrastructure層（com.example.calculator.infrastructure）

#### persistence/entity/CalculationEntity.java

```java
package com.example.calculator.infrastructure.persistence.entity;

import com.example.calculator.domain.model.Calculation;
import com.example.calculator.domain.model.Operation;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * JPA エンティティ（Infrastructure層のみで使用）
 * Domain層のCalculationとは別のクラス
 */
@Entity
@Table(name = "calculations")
public class CalculationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 20, scale = 10)
    private BigDecimal operand1;

    @Column(nullable = false, precision = 20, scale = 10)
    private BigDecimal operand2;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Operation operation;

    @Column(nullable = false, precision = 20, scale = 10)
    private BigDecimal result;

    @Column(nullable = false)
    private LocalDateTime calculatedAt;

    // JPA用のデフォルトコンストラクタ
    protected CalculationEntity() {}

    // ドメインモデルからEntityへの変換（ファクトリメソッド）
    public static CalculationEntity fromDomain(Calculation calculation) {
        CalculationEntity entity = new CalculationEntity();
        entity.id = calculation.getId();
        entity.operand1 = calculation.getOperand1();
        entity.operand2 = calculation.getOperand2();
        entity.operation = calculation.getOperation();
        entity.result = calculation.getResult();
        entity.calculatedAt = calculation.getCalculatedAt();
        return entity;
    }

    // Entityからドメインモデルへの変換
    public Calculation toDomain() {
        return Calculation.builder()
                .id(this.id)
                .operand1(this.operand1)
                .operand2(this.operand2)
                .operation(this.operation)
                .result(this.result)
                .calculatedAt(this.calculatedAt)
                .build();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getOperand1() { return operand1; }
    public void setOperand1(BigDecimal operand1) { this.operand1 = operand1; }
    public BigDecimal getOperand2() { return operand2; }
    public void setOperand2(BigDecimal operand2) { this.operand2 = operand2; }
    public Operation getOperation() { return operation; }
    public void setOperation(Operation operation) { this.operation = operation; }
    public BigDecimal getResult() { return result; }
    public void setResult(BigDecimal result) { this.result = result; }
    public LocalDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(LocalDateTime calculatedAt) { this.calculatedAt = calculatedAt; }
}
```

#### persistence/repository/JpaCalculationRepository.java

```java
package com.example.calculator.infrastructure.persistence.repository;

import com.example.calculator.application.port.out.CalculationRepository;
import com.example.calculator.domain.model.Calculation;
import com.example.calculator.infrastructure.persistence.entity.CalculationEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Spring Data JPA リポジトリ
 * Application層のCalculationRepositoryインターフェースを実装
 */
@Repository
public interface SpringDataJpaCalculationRepository extends JpaRepository<CalculationEntity, Long> {
    // Spring Data JPAが自動実装
}

/**
 * CalculationRepositoryの実装クラス
 */
@Repository
public class JpaCalculationRepositoryAdapter implements CalculationRepository {
    private final SpringDataJpaCalculationRepository jpaRepository;

    public JpaCalculationRepositoryAdapter(SpringDataJpaCalculationRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Calculation save(Calculation calculation) {
        CalculationEntity entity = CalculationEntity.fromDomain(calculation);
        CalculationEntity saved = jpaRepository.save(entity);
        return saved.toDomain();
    }

    @Override
    public Optional<Calculation> findById(Long id) {
        return jpaRepository.findById(id)
                .map(CalculationEntity::toDomain);
    }

    @Override
    public List<Calculation> findAllOrderByCalculatedAtDesc(int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit, Sort.by("calculatedAt").descending());
        return jpaRepository.findAll(pageRequest)
                .stream()
                .map(CalculationEntity::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteAll() {
        jpaRepository.deleteAll();
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }
}
```

### Presentation層（com.example.calculator.presentation）

#### controller/CalculatorController.java

```java
package com.example.calculator.presentation.controller;

import com.example.calculator.application.port.in.CalculatorService;
import com.example.calculator.domain.model.CalculationResult;
import com.example.calculator.presentation.dto.CalculationRequest;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

/**
 * 電卓コントローラー
 */
@Controller
@RequestMapping("/")
public class CalculatorController {
    private final CalculatorService calculatorService;

    public CalculatorController(CalculatorService calculatorService) {
        this.calculatorService = calculatorService;
    }

    @GetMapping
    public String index(Model model) {
        model.addAttribute("request", new CalculationRequest());
        return "index";
    }

    @PostMapping("/calculate")
    public String calculate(
            @Valid @ModelAttribute("request") CalculationRequest request,
            BindingResult bindingResult,
            Model model) {

        if (bindingResult.hasErrors()) {
            return "index";
        }

        CalculationResult result = calculatorService.calculate(
                request.getOperand1(),
                request.getOperand2(),
                request.getOperation()
        );

        if (result.isSuccess()) {
            model.addAttribute("result", result.getValue());
        } else {
            model.addAttribute("error", result.getErrorMessage());
        }

        model.addAttribute("request", request);
        return "index";
    }

    @GetMapping("/history")
    public String history(Model model) {
        model.addAttribute("history", calculatorService.getHistory(100));
        return "history";
    }

    @PostMapping("/history/clear")
    public String clearHistory() {
        calculatorService.clearHistory();
        return "redirect:/history";
    }
}
```

#### dto/CalculationRequest.java

```java
package com.example.calculator.presentation.dto;

import com.example.calculator.domain.model.Operation;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * 計算リクエストDTO
 */
public class CalculationRequest {
    @NotNull(message = "数値1を入力してください")
    private BigDecimal operand1;

    @NotNull(message = "数値2を入力してください")
    private BigDecimal operand2;

    @NotNull(message = "演算を選択してください")
    private Operation operation;

    // Getters and Setters
    public BigDecimal getOperand1() { return operand1; }
    public void setOperand1(BigDecimal operand1) { this.operand1 = operand1; }
    public BigDecimal getOperand2() { return operand2; }
    public void setOperand2(BigDecimal operand2) { this.operand2 = operand2; }
    public Operation getOperation() { return operation; }
    public void setOperation(Operation operation) { this.operation = operation; }
}
```

## データベース設計

### ER図

```
┌─────────────────────────┐
│ calculations            │
├─────────────────────────┤
│ PK  id (BIGINT)         │
│     operand1 (DECIMAL)  │
│     operand2 (DECIMAL)  │
│     operation (VARCHAR) │
│     result (DECIMAL)    │
│     calculated_at       │
│     (TIMESTAMP)         │
└─────────────────────────┘
```

### テーブル定義

#### calculations

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|---|------|-----------|------|
| id | BIGINT | NO | AUTO_INCREMENT | 主キー |
| operand1 | DECIMAL(20,10) | NO | - | 演算対象1 |
| operand2 | DECIMAL(20,10) | NO | - | 演算対象2 |
| operation | VARCHAR(10) | NO | - | 演算種別（ADD/SUBTRACT/MULTIPLY/DIVIDE） |
| result | DECIMAL(20,10) | NO | - | 計算結果 |
| calculated_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 計算日時 |

**インデックス**:
- PRIMARY KEY (id)
- INDEX idx_calculated_at (calculated_at DESC) - 履歴表示の高速化

**制約**:
- operation は ENUM('ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE')

**DDL（H2 Database）**:
```sql
CREATE TABLE calculations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operand1 DECIMAL(20, 10) NOT NULL,
    operand2 DECIMAL(20, 10) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE')),
    result DECIMAL(20, 10) NOT NULL,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calculated_at ON calculations(calculated_at DESC);
```

## API設計（Web UI）

### エンドポイント一覧

#### GET /

**説明**: 電卓のトップページを表示

**レスポンス**: HTML（Thymeleaf）

**画面要素**:
- 数値入力フィールド（operand1, operand2）
- 演算選択（+, -, ×, ÷）
- 計算ボタン
- 結果表示エリア
- 履歴ページへのリンク

#### POST /calculate

**説明**: 計算を実行し、結果を表示

**リクエスト**:
| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|------|
| operand1 | BigDecimal | Yes | 演算対象1 |
| operand2 | BigDecimal | Yes | 演算対象2 |
| operation | Operation | Yes | 演算種別（ADD/SUBTRACT/MULTIPLY/DIVIDE） |

**レスポンス**: HTML（Thymeleaf）

**成功時**:
- 計算結果を画面に表示
- 入力値を保持（再入力の手間を削減）

**エラー時**:
- バリデーションエラー: 「有効な数値を入力してください」
- ゼロ除算: 「ゼロで割ることはできません」

#### GET /history

**説明**: 計算履歴を表示

**レスポンス**: HTML（Thymeleaf）

**画面要素**:
- 履歴一覧テーブル（最新100件）
  - 列: 計算式、結果、計算日時
- 履歴クリアボタン
- トップページへのリンク

#### POST /history/clear

**説明**: 計算履歴をすべて削除

**レスポンス**: リダイレクト（/history）

**動作**:
1. すべての履歴を削除
2. 履歴ページにリダイレクト
3. 「履歴がクリアされました」メッセージ表示（Flash Attribute）

## 画面設計（Thymeleaf）

### index.html（トップページ）

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web電卓</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link th:href="@{/css/calculator.css}" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1 class="text-center mb-4">Web電卓</h1>
        
        <!-- エラーメッセージ -->
        <div th:if="${error}" class="alert alert-danger" role="alert">
            <span th:text="${error}"></span>
        </div>
        
        <!-- 計算結果 -->
        <div th:if="${result}" class="alert alert-success" role="alert">
            <strong>結果:</strong> <span th:text="${result}"></span>
        </div>
        
        <!-- 計算フォーム -->
        <form th:action="@{/calculate}" th:object="${request}" method="post">
            <div class="row mb-3">
                <div class="col-md-4">
                    <label for="operand1" class="form-label">数値1</label>
                    <input type="number" step="any" class="form-control" 
                           th:field="*{operand1}" id="operand1" required>
                    <div class="text-danger" th:errors="*{operand1}"></div>
                </div>
                
                <div class="col-md-4">
                    <label for="operation" class="form-label">演算</label>
                    <select class="form-select" th:field="*{operation}" id="operation" required>
                        <option value="">選択してください</option>
                        <option value="ADD">+ (加算)</option>
                        <option value="SUBTRACT">- (減算)</option>
                        <option value="MULTIPLY">× (乗算)</option>
                        <option value="DIVIDE">÷ (除算)</option>
                    </select>
                    <div class="text-danger" th:errors="*{operation}"></div>
                </div>
                
                <div class="col-md-4">
                    <label for="operand2" class="form-label">数値2</label>
                    <input type="number" step="any" class="form-control" 
                           th:field="*{operand2}" id="operand2" required>
                    <div class="text-danger" th:errors="*{operand2}"></div>
                </div>
            </div>
            
            <div class="text-center">
                <button type="submit" class="btn btn-primary btn-lg">計算</button>
                <a th:href="@{/history}" class="btn btn-secondary btn-lg">履歴を見る</a>
            </div>
        </form>
    </div>
</body>
</html>
```

### history.html（履歴ページ）

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>計算履歴 - Web電卓</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1 class="text-center mb-4">計算履歴</h1>
        
        <div class="mb-3">
            <a th:href="@{/}" class="btn btn-secondary">← 戻る</a>
            <form th:action="@{/history/clear}" method="post" style="display:inline;" 
                  onsubmit="return confirm('本当に履歴をすべて削除しますか？');">
                <button type="submit" class="btn btn-danger">履歴をクリア</button>
            </form>
        </div>
        
        <div th:if="${#lists.isEmpty(history)}" class="alert alert-info">
            計算履歴がありません
        </div>
        
        <table th:if="${!#lists.isEmpty(history)}" class="table table-striped table-hover">
            <thead>
                <tr>
                    <th>計算式</th>
                    <th>結果</th>
                    <th>計算日時</th>
                </tr>
            </thead>
            <tbody>
                <tr th:each="calc : ${history}">
                    <td>
                        <span th:text="${calc.operand1}"></span>
                        <span th:text="${calc.operation.symbol}"></span>
                        <span th:text="${calc.operand2}"></span>
                    </td>
                    <td><strong th:text="${calc.result}"></strong></td>
                    <td th:text="${#temporals.format(calc.calculatedAt, 'yyyy-MM-dd HH:mm:ss')}"></td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
```

## セキュリティ設計

### 入力検証

**Bean Validation（サーバー側）**:
- `@NotNull`: 必須フィールド
- `@DecimalMin/@DecimalMax`: 数値範囲チェック（必要に応じて）
- カスタムバリデータ: ゼロ除算チェック

**Thymeleafエスケープ**:
- `th:text`: 自動HTMLエスケープ
- XSS攻撃を防止

### CSRF対策

**Spring Security CSRF保護**:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
```

### SQLインジェクション対策

**JPA パラメータバインディング**:
- Spring Data JPAの自動実装を使用
- プリペアドステートメントによる安全な実装

## 非機能要件の実現方法

### パフォーマンス

**目標**: レスポンスタイム < 200ms

**実現方法**:
- インメモリDB（H2）使用で高速化
- インデックス: `calculated_at`（履歴表示の高速化）
- BigDecimalの効率的な使用

### テスタビリティ（TDD）

**テストカバレッジ目標**: 95%以上

**各層のテスト戦略**:

**Domain層**:
- CalculatorDomainServiceTest: 四則演算のすべてのパターン
- Calculationモデルのビルダーテスト
- ゼロ除算エラーテスト

**Application層**:
- CalculateUseCaseTest: ユースケースシナリオ
- Repositoryはモック化（Mockito）

**Infrastructure層**:
- JpaCalculationRepositoryTest: `@DataJpaTest`
- H2インメモリDB使用

**Presentation層**:
- CalculatorControllerTest: `@WebMvcTest`
- MockMvc使用

## 技術スタック詳細

| 層 | 技術 | バージョン | 理由 |
|----|------|----------|------|
| 言語 | Java | 21 | Records、Pattern Matching、最新機能活用 |
| フレームワーク | Spring Boot | 3.5 | 最新の安定版、Jakarta EE対応 |
| テンプレート | Thymeleaf | 3.1.x | Spring Boot標準、サーバーサイドレンダリング |
| ORM | Spring Data JPA | 3.x | Hibernate経由のJPA実装 |
| DB（開発） | H2 Database | 2.x | インメモリDB、テスト高速化 |
| DB（本番想定） | PostgreSQL | 15.x | 本番環境での利用を想定 |
| ビルドツール | Gradle | 8.x | Kotlin DSL、モダンなビルド構成 |
| テスト | JUnit 5 | 5.10.x | 最新のJavaテストフレームワーク |
| アサーション | AssertJ | 3.24.x | 流暢なアサーション |
| モック | Mockito | 5.x | モックフレームワーク |
| CSS | Bootstrap | 5.3.x | レスポンシブデザイン |

### 主要な依存関係（build.gradle）

```gradle
dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    
    // Database
    runtimeOnly 'com.h2database:h2'
    runtimeOnly 'org.postgresql:postgresql'
    
    // Test
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.assertj:assertj-core:3.24.2'
    testImplementation 'org.mockito:mockito-core:5.7.0'
}
```

## 見積もり

### 工数見積もり（TDD前提）

| タスク | 工数（人日） | 担当 | 備考 |
|--------|-------------|------|------|
| **Domain層（TDD）** | | | |
| - Calculation, CalculationResult, Operation | 0.5 | 開発者 | テスト → 実装 |
| - CalculatorDomainService + テスト | 1.0 | 開発者 | 四則演算、エッジケース |
| **Application層（TDD）** | | | |
| - ポート（インターフェース）定義 | 0.5 | 開発者 | |
| - CalculateUseCase + テスト | 1.0 | 開発者 | モック使用 |
| **Infrastructure層** | | | |
| - CalculationEntity | 0.5 | 開発者 | JPA設定 |
| - JpaCalculationRepository + テスト | 1.0 | 開発者 | @DataJpaTest |
| **Presentation層** | | | |
| - CalculatorController + テスト | 1.0 | 開発者 | @WebMvcTest |
| - CalculationRequest/Response DTO | 0.5 | 開発者 | |
| **Thymeleafテンプレート** | | | |
| - index.html（トップページ） | 0.5 | 開発者 | Bootstrap適用 |
| - history.html（履歴ページ） | 0.5 | 開発者 | |
| - CSS（calculator.css） | 0.5 | 開発者 | レスポンシブ対応 |
| **設定・構成** | | | |
| - application.yml, SecurityConfig | 0.5 | 開発者 | |
| - build.gradle, プロジェクト構成 | 0.5 | 開発者 | |
| **統合テスト** | | | |
| - E2Eシナリオテスト | 1.0 | 開発者 | |
| **ドキュメント** | | | |
| - README, Javadoc | 0.5 | 開発者 | |
| **バッファ（TDD学習・調整）** | 1.0 | 開発者 | 初回TDDの学習コスト |
| **合計** | **11.0** | - | 約2.2週間（1人） |

### リスク調整

| リスク | 影響（人日） | 発生確率 | 対策 |
|--------|-------------|---------|------|
| TDD未経験による遅延 | +2.0 | 50% | AI支援、ペアプログラミング |
| Onion Architecture理解 | +1.0 | 30% | 参考実装の調査 |
| ブラウザ互換性問題 | +0.5 | 20% | Bootstrap使用で軽減 |
| テストカバレッジ未達 | +1.0 | 20% | CI/CD自動化 |

**期待値**: 11.0 + (2.0×0.5 + 1.0×0.3 + 0.5×0.2 + 1.0×0.2) = 11.0 + 1.6 = **12.6人日**

### 最終見積もり

- **楽観的**: 11.0 人日（約2.2週間）
- **標準的**: 12.6 人日（約2.5週間） ← **推奨見積もり**
- **悲観的**: 15.0 人日（約3週間）

### スケジュール（標準的ケース）

**前提**: 1人開発、1日あたり5時間の実開発時間

| 週 | 日 | タスク | 累積工数 |
|----|---|--------|---------|
| W1 | Day 1-2 | Domain層（TDD） | 1.5 |
| W1 | Day 3-4 | Application層（TDD） | 3.0 |
| W2 | Day 5-6 | Infrastructure層 | 4.5 |
| W2 | Day 7-8 | Presentation層 | 6.5 |
| W3 | Day 9-10 | Thymeleafテンプレート、CSS | 8.0 |
| W3 | Day 11 | 設定・構成 | 9.0 |
| W3 | Day 12 | 統合テスト | 10.0 |
| W3 | Day 13 | ドキュメント、バッファ | 12.0 |

**完了予定**: 約3週間後

## マイルストーン

| マイルストーン | 完了予定日 | 成果物 | 受け入れ条件 |
|--------------|----------|--------|-------------|
| 設計完了 | 2025-11-06 | 設計書（本ドキュメント） | レビュー承認 |
| Domain層完成 | 2025-11-08 | ドメインモデル、テスト | カバレッジ100% |
| Application層完成 | 2025-11-10 | ユースケース、テスト | カバレッジ95%以上 |
| Infrastructure層完成 | 2025-11-12 | JPA実装、テスト | 統合テスト成功 |
| Presentation層完成 | 2025-11-14 | Controller、UI | 画面動作確認 |
| 統合テスト完了 | 2025-11-16 | 全機能テスト | すべてのシナリオ成功 |
| リリース準備完了 | 2025-11-17 | README、ドキュメント | デプロイ可能状態 |

## 依存関係

### 外部依存

- [ ] なし（スタンドアロンアプリケーション）

### 内部依存

- [x] Java 21のインストール
- [x] Gradle 8.xのインストール
- [ ] IDEのセットアップ（IntelliJ IDEA推奨）
- [ ] Git環境（Jujutsu）

## レビュー・承認

### レビュワー
- [ ] アーキテクト: Onion Architecture準拠確認
- [ ] 技術リード: TDD戦略、テスト設計確認
- [ ] 部長: 見積もり、スケジュール承認

### 承認ステータス
- [ ] 技術レビュー完了
- [ ] アーキテクチャレビュー完了
- [ ] 見積もり承認
- [ ] 最終承認

### レビューポイント

1. **Onion Architecture**:
   - 依存関係ルールが正しく適用されているか
   - Domain層がフレームワーク非依存か
   - ポート（インターフェース）の設計は適切か

2. **TDD戦略**:
   - テスト作成順序は妥当か
   - テストカバレッジ目標は達成可能か
   - モック戦略は適切か

3. **データモデル**:
   - BigDecimalの精度設定は適切か
   - インデックス設計は最適か

4. **セキュリティ**:
   - 入力検証は十分か
   - CSRF、XSS、SQLインジェクション対策は適切か

5. **見積もり**:
   - 工数見積もりは現実的か
   - リスクは適切に考慮されているか

## 付録

### 参考資料

**Onion Architecture**:
- [The Onion Architecture - Jeffrey Palermo](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- [DDD, Hexagonal, Onion, Clean, CQRS - Herberto Graça](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/)

**TDD**:
- [Test Driven Development: By Example - Kent Beck](https://www.amazon.com/dp/0321146530)
- [Growing Object-Oriented Software, Guided by Tests](https://www.amazon.com/dp/0321503627)

**Spring Boot 3.5**:
- [Spring Boot 3.x Reference Documentation](https://docs.spring.io/spring-boot/docs/3.5.x/reference/html/)
- [Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/)

**Java 21**:
- [Java 21 Features](https://openjdk.org/projects/jdk/21/)
- [Records](https://docs.oracle.com/en/java/javase/21/language/records.html)
- [Pattern Matching for switch](https://openjdk.org/jeps/441)

### 決定事項ログ

| 日付 | 決定事項 | 理由 | 影響 |
|------|---------|------|------|
| 2025-11-06 | Java 21採用 | Records、Pattern Matchingなど最新機能活用 | 開発効率向上 |
| 2025-11-06 | Spring Boot 3.5採用 | 最新の安定版、Jakarta EE対応 | 長期サポート |
| 2025-11-06 | Gradle採用（Maven不採用） | Kotlin DSL、柔軟な設定 | ビルド高速化 |
| 2025-11-06 | BigDecimal精度10桁 | 一般的な計算で十分、パフォーマンスとのバランス | 計算精度 |
| 2025-11-06 | Bootstrap 5.3採用 | レスポンシブ対応、モダンなUI | 開発工数削減 |
| 2025-11-06 | H2 Database（開発用） | インメモリDB、テスト高速化 | テスト実行時間 |
| 2025-11-06 | 履歴上限100件 | メモリ消費抑制、十分な履歴 | パフォーマンス |

### 用語集

| 用語 | 定義 |
|------|------|
| Onion Architecture | 依存関係を内側に向けることで、ビジネスロジックをフレームワークから独立させるアーキテクチャパターン |
| Domain層 | ビジネスロジックの中核。外部依存なしの純粋なJavaコード |
| Application層 | ユースケースを実装する層。Domainを使ってアプリケーション固有のロジックを実現 |
| Infrastructure層 | 外部技術（DB、フレームワーク）への依存を隔離する層 |
| Presentation層 | ユーザーインターフェース。コントローラー、DTO、テンプレート |
| Port | Application層が定義するインターフェース。依存性逆転の原則を実現 |
| Adapter | Portを実装する具象クラス（Infrastructure層） |
| DIP | Dependency Inversion Principle（依存性逆転の原則） |
| TDD | Test-Driven Development。テストファーストで開発する手法 |
| BigDecimal | Javaの高精度小数演算クラス。浮動小数点の誤差を回避 |
| DTO | Data Transfer Object。層間でデータを受け渡すためのオブジェクト |

---

**GitHub**: [設計書（最新版）](https://github.com/sk8metalme/michi-practice1/tree/main/.kiro/specs/calculator-app/design.md)  
**要件定義**: [requirements.md](./requirements.md)  
**JIRA**: PRAC1-XX（Epic作成後に更新）

---

**次のステップ**: 
設計のレビューを受けた後、`/kiro:spec-tasks calculator-app` コマンドでタスク分割フェーズに進んでください。

