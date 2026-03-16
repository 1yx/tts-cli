## Why

When users provide incorrect API credentials, they receive a generic "API request failed: 401 Unauthorized" error without the friendly formatting, credential display, and helpful suggestions that work correctly for other API errors like quota exceeded. This creates an inconsistent user experience and makes debugging authentication issues harder than necessary.

The root cause is that HTTP-level errors (4xx, 5xx status codes) are thrown as generic `Error` objects, while API-level errors (parsed from response JSON) are correctly thrown as `APIError` objects with proper handling.

## What Changes

- Map error code `45000010` ("load grant: requested grant not found") to the `auth` error type
- Modify HTTP error handling to parse response body as JSON and throw `APIError` instead of generic `Error`
- Ensure all API errors, whether from HTTP status or response body, are handled with the same friendly UX

## Capabilities

### New Capabilities
None

### Modified Capabilities

- `api-error-handling`: Extended to handle HTTP-level authentication errors (code 45000010) in addition to existing API response errors

## Impact

- **src/errors.ts**: Add 45000010 to auth error code mapping
- **src/tts.ts**: Modify `fetchTTS` function to parse HTTP error response body and throw `APIError`
- **User experience**: Users with incorrect credentials will see consistent error formatting with credential display and helpful suggestions
