# Spec: Code Quality

Automated code quality enforcement through linting and formatting.

## ADDED Requirements

### Requirement: ESLint configuration exists

The project MUST include an `eslint.config.mjs` file that defines linting rules for TypeScript source files.

#### Scenario: ESLint config file is present

- **WHEN** examining the project root
- **THEN** `eslint.config.mjs` exists
- **AND** the file exports a valid ESLint flat configuration

### Requirement: Linting scripts available

The project MUST provide npm scripts for running ESLint.

#### Scenario: Lint script runs ESLint

- **GIVEN** the project has been configured with ESLint
- **WHEN** user runs `bun run lint`
- **THEN** ESLint executes on all project files
- **AND** violations are reported to the console

#### Scenario: Lint fix script auto-fixes violations

- **GIVEN** the project has been configured with ESLint
- **WHEN** user runs `bun run lint:fix`
- **THEN** ESLint executes with `--fix` flag
- **AND** auto-fixable violations are corrected in source files

### Requirement: Type-aware linting enabled

ESLint MUST perform type-aware linting using TypeScript compiler services.

#### Scenario: Type-aware rules detect misused promises

- **GIVEN** a TypeScript file contains async code
- **WHEN** ESLint runs with type-aware rules enabled
- **THEN** violations of `@typescript-eslint/no-misused-promises` are detected
- **AND** violations of `@typescript-eslint/no-floating-promises` are detected

### Requirement: Code formatting with Prettier

The project MUST use Prettier for code formatting, integrated with ESLint.

#### Scenario: Format script runs Prettier

- **GIVEN** the project has been configured with Prettier
- **WHEN** user runs `bun run format`
- **THEN** Prettier reformats all project files
- **AND** files are written to disk with corrected formatting

#### Scenario: Format check verifies formatting

- **GIVEN** the project has been configured with Prettier
- **WHEN** user runs `bun run format:check`
- **THEN** Prettier checks formatting without writing files
- **AND** exit code is non-zero if formatting issues exist

### Requirement: Code quality limits enforced

ESLint MUST enforce limits on function size, file size, complexity, and nesting depth.

#### Scenario: Function length limit enforced

- **GIVEN** a TypeScript source file contains a function
- **WHEN** the function exceeds 50 lines of code (excluding blanks and comments)
- **THEN** ESLint reports a `max-lines-per-function` violation
- **AND** the violation includes the line count that exceeded the limit

#### Scenario: File length limit enforced

- **GIVEN** a TypeScript source file
- **WHEN** the file exceeds 500 lines of code (excluding blanks and comments)
- **THEN** ESLint reports a `max-lines` violation
- **AND** the violation indicates the file should be split

#### Scenario: Complexity limit enforced

- **GIVEN** a TypeScript source file contains a function
- **WHEN** the function has cyclomatic complexity exceeding 10
- **THEN** ESLint reports a `complexity` violation
- **AND** the violation indicates the function should be refactored

#### Scenario: Parameter count limit enforced

- **GIVEN** a TypeScript source file contains a function
- **WHEN** the function declares more than 3 parameters
- **THEN** ESLint reports a `max-params` violation
- **AND** the violation suggests using an options object instead

### Requirement: Async safety enforced

ESLint MUST enforce correct async/await usage and Promise handling.

#### Scenario: Floating promises detected

- **GIVEN** a TypeScript source file contains a Promise that is not awaited or handled
- **WHEN** ESLint runs
- **THEN** ESLint reports a `@typescript-eslint/no-floating-promises` violation
- **AND** the violation indicates the Promise should be awaited or returned

#### Scenario: Misused promises detected

- **GIVEN** a TypeScript source file passes an async function where a sync function is expected
- **WHEN** ESLint runs with type-aware rules
- **THEN** ESLint reports a `@typescript-eslint/no-misused-promises` violation

### Requirement: Documentation requirements

ESLint MUST require JSDoc/TSDoc comments on public functions, types, and classes.

#### Scenario: JSDoc required on exported functions

- **GIVEN** a TypeScript source file exports a function
- **WHEN** the function declaration lacks JSDoc documentation
- **THEN** ESLint reports a `jsdoc/require-jsdoc` violation
- **AND** the violation indicates JSDoc is required for exported declarations

#### Scenario: JSDoc required on exported types

- **GIVEN** a TypeScript source file exports a type or interface
- **WHEN** the type declaration lacks documentation
- **THEN** ESLint reports a violation requiring documentation
- **AND** the violation indicates TSDoc is required for exported type declarations

### Requirement: TypeScript best practices enforced

ESLint MUST enforce TypeScript-specific best practices and prevent unsafe patterns.

#### Scenario: Type-only imports enforced

- **GIVEN** a TypeScript source file imports a type-only symbol
- **WHEN** the import uses regular `import` syntax
- **THEN** ESLint reports a `@typescript-eslint/consistent-type-imports` violation
- **AND** the violation suggests using `import type` syntax

#### Scenario: No explicit any allowed

- **GIVEN** a TypeScript source file uses `any` type
- **WHEN** ESLint runs
- **THEN** ESLint reports a `@typescript-eslint/no-explicit-any` warning
- **AND** the warning suggests using `unknown` or a more specific type

#### Scenario: Type assertions discouraged

- **GIVEN** a TypeScript source file uses a type assertion (`as Type`)
- **WHEN** the assertion appears in source code
- **THEN** ESLint reports a violation with message "Avoid type assertions (as). Use a type guard, explicit annotation, or correct inference instead."

#### Scenario: Non-null assertions discouraged

- **GIVEN** a TypeScript source file uses a non-null assertion (`!`)
- **WHEN** the assertion appears in source code
- **THEN** ESLint reports a violation with message "Avoid non-null assertions (!). Handle null/undefined explicitly or refine the type."
