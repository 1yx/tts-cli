# Tasks: Fix HTTP Error Handling

## 1. Update Error Code Mapping

- [x] 1.1 Add error code 45000010 to auth type mapping in `src/errors.ts`
- [x] 1.2 Update `getAPIErrorType()` to use explicit list instead of range for public error codes
- [x] 1.3 Run `bun run typecheck` to verify no type errors

## 2. Modify HTTP Error Handling in fetchTTS

- [x] 2.1 Locate the `!response.ok` error handling block in `src/tts.ts` (around line 197)
- [x] 2.2 Replace generic Error throw with JSON parsing attempt
- [x] 2.3 Extract error code and message from parsed JSON response body
- [x] 2.4 Throw `APIError` with parsed code, message, and type
- [x] 2.5 Add try-catch fallback for non-JSON responses (throw generic Error with response text)

## 3. Verification

- [x] 3.1 Test with invalid credentials (verify 45000010 shows friendly message) - Added integration test
- [x] 3.2 Test with valid credentials to ensure normal flow still works - Manual testing ✓
- [x] 3.3 Run `bun run lint` - should pass with no new errors
- [x] 3.4 Run `bun test` - all tests should pass (88 pass, 3 skip) ✓
- [x] 3.5 Added test cases for getAPIErrorType with 45000010
- [x] 3.6 Added integration test for HTTP 401 JSON body parsing
- [x] 3.7 Added validation for empty --appId and --token values ✓
