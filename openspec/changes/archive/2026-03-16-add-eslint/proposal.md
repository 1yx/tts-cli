# Proposal: Add ESLint

## Why

The project currently has no linting or code formatting tooling. While TypeScript provides type checking, there's no enforcement for code quality, consistency, or catching common bugs before runtime. An `eslint.config.mjs` file already exists with comprehensive rules, but ESLint dependencies are not installed and the tooling is not integrated into the development workflow.

## What Changes

- Install ESLint and required plugins (@typescript-eslint, prettier, eslint-plugin-tsdoc, eslint-plugin-jsdoc)
- Install Prettier for code formatting
- Add npm scripts for linting and formatting
- Set up tsconfig.json at project root for type-aware linting
- Configure ignore patterns for build artifacts and dependencies
- Fix any existing lint violations in the codebase

## Capabilities

### New Capabilities

- `code-quality`: Automated code quality enforcement including type safety, async correctness, complexity limits, and documentation requirements

## Impact

- **Development Workflow**: New `bun run lint` and `bun run format` commands
- **Dependencies**: Adds ~15 dev dependencies (eslint, plugins, prettier)
- **Code Quality**: Existing code may need fixes to meet the configured standards (e.g., max 50 lines per function, JSDoc requirements)
- **CI/CD**: Linting can be integrated into automated testing pipelines
