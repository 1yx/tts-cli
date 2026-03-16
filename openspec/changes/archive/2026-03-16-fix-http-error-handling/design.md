## Context

Currently, HTTP-level errors (4xx, 5xx status codes) in the TTS API request throw generic `Error` objects. This happens because the `fetchTTS` function checks `response.ok` and throws a generic error when false, without attempting to parse the response body for API-specific error details.

The Doubao API returns error details in the response body even for HTTP errors, including error codes like `45000010` (invalid credentials). However, the current code doesn't parse this JSON and throws a generic error, bypassing the friendly `APIError` handling.

## Goals / Non-Goals

**Goals:**
- Parse HTTP error response bodies to extract API error codes and messages
- Map error code `45000010` to the `auth` error type
- Throw `APIError` for all API errors (both HTTP-level and response-level)
- Provide consistent user experience for all API errors

**Non-Goals:**
- Changing the error type categories (auth, quota, rate_limit, unknown)
- Modifying the CLI error display logic (already works correctly for `APIError`)
- Handling non-API HTTP errors (network timeouts, DNS failures, etc.)

## Decisions

### Parse HTTP error response body before throwing

When `response.ok` is false, parse the response body as JSON to extract error details. If JSON parsing fails or the response doesn't contain the expected error structure, fall back to a generic error.

**Rationale:** The Doubao API consistently returns error details in JSON format even for HTTP errors. Parsing this allows us to provide the same friendly handling for all API errors.

### Map 45000010 to auth type

Error code `45000010` ("load grant: requested grant not found in SaaS storage") represents an authentication/authorization failure and should be handled the same as `45000000`.

**Rationale:** Both errors indicate invalid credentials or insufficient permissions. Users should see the same "check your app_id and token" suggestion.

### Throw APIError instead of generic Error

Replace the generic `Error` thrown in the `!response.ok` block with `APIError`, including error code, message, and type.

**Rationale:** This ensures all API errors flow through the same `APIError` catch block in `index.ts`, providing consistent formatting and suggestions.

## Risks / Trade-offs

**Risk:** JSON parsing of error response might fail if the API returns non-JSON error responses.

**Mitigation:** Wrap JSON.parse in try-catch and fall back to generic error with original response text.

**Trade-off:** We're making an assumption that error responses always contain `{header: {code, message}}` structure. If the API changes this format, our parsing might fail.

**Mitigation:** The fallback to generic error ensures we still show something to the user, even if we can't extract structured details.
