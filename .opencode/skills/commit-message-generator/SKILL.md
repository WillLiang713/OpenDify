---
name: commit-message-generator
description: 为代码变更生成符合 Conventional Commits 规范的中文提交信息。当用户需要对 git diff 进行总结并编写规范的 commit message 时使用。
---

# Commit Message Generator

## Overview

本技能协助生成清晰、规范且符合 Conventional Commits 标准的中文提交信息。通过分析代码变更（git diff），自动识别变更类型、提取作用域并撰写简洁准确的描述。

## Workflow

1. **分析变更**: 审查 `git diff` 输出，识别主要变更点。
2. **确定类型**: 根据变更性质选择合适的类型（feat, fix, docs, refactor 等）。
3. **提取作用域**: 识别受影响的模块或文件路径。
4. **撰写描述**: 使用祈使语气撰写简短的中文描述。
5. **生成信息**: 组合成最终的提交信息格式。

## Guidelines

详细的类型定义、作用域提取规则和撰写原则请参阅 [conventions.md](references/conventions.md)。

## Usage Examples

### 简单功能新增
**Diff**: `src/api/user.ts` 添加了获取用户列表的接口。
**Commit**: `feat(api): 添加获取用户列表接口`

### 修复 Bug
**Diff**: `src/utils/date.ts` 修复了日期格式化在特定时区下的显示问题。
**Commit**: `fix(utils): 修复特定时区下的日期格式化错误`

### 代码重构
**Diff**: 优化了 `src/components/Button.tsx` 的内部逻辑，不改变外部表现。
**Commit**: `refactor(ui): 优化按钮组件内部渲染逻辑`
