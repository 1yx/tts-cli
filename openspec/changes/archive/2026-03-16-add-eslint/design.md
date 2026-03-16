# Design: Add ESLint

## Context

The project is a TypeScript + Bun CLI tool with no current linting or formatting infrastructure. An `eslint.config.mjs` file exists with comprehensive rules (type-aware linting, async safety, code quality limits, TSDoc requirements, Temporal API enforcement), but ESLint dependencies are not installed and the toolchain is not integrated into the development workflow.

**Current state:**

- `eslint.config.mjs` exists with 300+ lines of configuration
- No ESLint packages in package.json
- No Prettier
- No tsconfig.json at project root (required for type-aware linting)
- No npm scripts for lint/format

**Constraints:**

- Must use Bun as package manager (not npm/yarn)
- Must preserve existing eslint.config.mjs rules
- Must work with Bun's TypeScript runtime
- Should minimize disruption to existing code

## Goals / Non-Goals

**Goals:**

- Install and configure ESLint with all required plugins
- Set up Prettier for code formatting
- Add type-aware linting capability
- Provide lint and format npm scripts
- Fix existing code to meet configured standards

**Non-Goals:**

- Modifying eslint.config.mjs rules (use as-is)
- Setting up pre-commit hooks (can be added later)
- CI/CD integration (can be added later)
- Custom rule configurations

## Decisions

### 1. Package Installation

**Decision:** Install all ESLint-related packages via `bun add -d`

**Packages to install:**

- eslint (core)
- @typescript-eslint/parser
- @typescript-eslint/eslint-plugin
- eslint-plugin-prettier
- eslint-config-prettier
- eslint-plugin-tsdoc
- eslint-plugin-jsdoc
- prettier
- globals

**Rationale:** Bun's package manager is compatible with npm packages. Using `-d` flag marks them as dev dependencies.

**Alternative:** Use npm directly — rejected because project uses Bun.

### 2. TypeScript Configuration for Type-Aware Linting

**Decision:** Create tsconfig.json at project root with `@typescript-eslint` recommendations

**Required settings:**

- `compilerOptions.strict`: true (already followed by code)
- `compilerOptionsesModuleInterop`: true (Bun ESM compatibility)
- `include`: ["src/**/*", "test/**/*"]

**Rationale:** The eslint.config.mjs requires `parserOptions.project: true` for type-aware rules like no-floating-promises and no-misused-promises.

**Alternative:** Skip type-aware linting — rejected because it's a core feature of the existing config.

### 3. Code Quality Limits

**Decision:** Accept configured limits and refactor code accordingly

**Limits in eslint.config.mjs:**

- Max 50 lines per function
- Max 500 lines per file
- Max 4 nesting depth
- Max 3 parameters per function
- Max 10 cyclomatic complexity

**Known violations:**

- `src/tts.ts` runPlayMode() is ~150 lines
- Some functions exceed parameter limits

**Rationale:** These limits improve maintainability. Refactoring is a one-time cost.

**Alternative:** Disable limits — rejected because they're valuable code quality guards.

### 4. Temporal API Rule

**Decision:** Keep the rule but assess impact first

**Rule blocks:** `new Date()`, `Date.now()`, `Date.parse()`

**Rationale:** The project may not use Date APIs. If it does, we can decide to:

- Migrate to Temporal API
- Add exception to ignore pattern
- Remove the rule

**Alternative:** Remove rule preemptively — rejected without assessment.

### 5. Prettier Configuration

**Decision:** Create `.prettierrc` with sensible defaults

**Default settings:**

- singleQuote: true (matches current code style)
- trailingComma: "es5"
- semi: true
- tabWidth: 2

**Rationale:** eslint.config.mjs specifies `usePrettierrc: true`, so Prettier needs its own config file.

### 6. NPM Scripts

**Decision:** Add lint, format, and typecheck scripts

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit"
}
```

**Rationale:** Provides standard commands. `typecheck` already exists, others are new.

## Risks / Trade-offs

### Risk: ESLint version compatibility with Bun

**Mitigation:** Use latest ESLint v9+ which has good ESM support. Test immediately after installation.

### Risk: Type-aware linting performance

**Mitigation:** It can be slow on large codebases. Acceptable for this project size (~10 source files).

### Risk: Existing code violations

**Mitigation:** Use `eslint --fix` to auto-fix most issues. Manual fixes required for:

- Long functions (refactor)
- Missing JSDoc (add)
- Complexity violations (refactor)

### Trade-off: Strictness vs development speed

**Choice:** Prioritize code quality. The strict config catches real bugs (floating promises, misused async) that save debugging time.

## Migration Plan

### Installation Steps

1. Install packages: `bun add -d eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-prettier eslint-config-prettier eslint-plugin-tsdoc eslint-plugin-jsdoc prettier globals`

2. Create tsconfig.json at project root

3. Create .prettierrc with project conventions

4. Add lint/format scripts to package.json

5. Run `bun run lint` to identify violations

6. Fix violations iteratively:
   - Run `bun run lint:fix` for auto-fixable issues
   - Manually fix remaining issues (refactor long functions, add JSDoc, etc.)

7. Verify with `bun run lint && bun run typecheck && bun test`

### Rollback Strategy

Git commit before starting. If issues arise:

- Remove packages: `bun remove eslint prettier ...`
- Delete tsconfig.json, .prettierrc
- Restore package.json scripts
- Git checkout to revert code changes

## Open Questions

1. **Should we add .eslintrc.js for legacy IDE support?**
   - Some IDEs may not recognize eslint.config.mjs yet
   - Recommendation: Hold off, see if IDE support is sufficient

2. **Should pre-commit hooks be added?**
   - husky + lint-staged would enforce linting before commits
   - Recommendation: Separate change after ESLint is working

3. **Should CI be configured?**
   - GitHub Actions workflow for lint checking
   - Recommendation: Separate change after ESLint is working
