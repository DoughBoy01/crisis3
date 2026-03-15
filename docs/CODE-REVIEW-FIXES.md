# Code Review Fixes

Comprehensive fixes applied following the 2026-03-15 code review. Issues are listed in priority order with rationale and resolution.

---

## Critical Fixes

### 1. Silent Promise Rejection — `useMarketFeeds.ts`
**File:** `src/hooks/useMarketFeeds.ts:104`
**Problem:** `persistToCache(json).catch(() => {})` silently discarded all cache persistence errors, making failures invisible and impossible to diagnose.
**Fix:** Replaced with `.catch((err) => console.error("[useMarketFeeds] cache persist failed:", err))` so failures are logged to the edge function / browser console.

### 2. localStorage Without Fallback — `useUserSettings.ts`, `useActionCompletions.ts`
**Files:** `src/hooks/useUserSettings.ts:7`, `src/hooks/useActionCompletions.ts:6`
**Problem:** Direct `localStorage.getItem/setItem` calls without try/catch crash in private browsing mode, iOS Safari with storage blocked, or any environment where localStorage is unavailable.
**Fix:** Wrapped in try/catch. On failure, generates a fresh UUID in memory so the session still works — data just won't persist across page loads in restricted environments.

### 3. Unhandled Promise — `AdminLogin.tsx`
**File:** `src/components/AdminLogin.tsx:31`
**Problem:** `supabase.auth.signOut()` was called without `await` when a non-admin user attempted login. If signOut failed, the error was silently discarded and the user might remain authenticated.
**Fix:** Added `await` and captured the error with `console.error` logging.

### 4. Unsafe Auth Destructuring — `useDismissedIntel.ts`
**File:** `src/hooks/useDismissedIntel.ts:44,70`
**Problem:** `const { data: { user } } = await supabase.auth.getUser()` would throw an uncaught exception if `getUser()` returned an error, because destructuring `{ user }` from an error response could fail before the `if (!user)` guard ran.
**Fix:** Changed to `const { data, error: authError } = await supabase.auth.getUser()` with an explicit `if (authError || !data.user) return` guard before accessing `data.user`.

### 5. XSS via Unescaped HTML — `send-morning-brief/index.ts`
**File:** `supabase/functions/send-morning-brief/index.ts`
**Problem:** AI-generated content (narrative, headlines, rationale, sector text, shipping lane data, fertilizer entries, three_things, procurement actions, market outlook) was interpolated directly into HTML email templates without escaping. A malicious or hallucinated value containing `<script>`, `<img onerror=...>`, or similar could execute JavaScript in email clients that render HTML.
**Fix:** Added `escHtml()` utility function that escapes `&`, `<`, `>`, `"`, `'`. Applied to all user-controlled and AI-generated string fields injected into HTML.
**Deployed:** Yes.

### 6. Unsafe Object Mutation — `delete-story/index.ts`
**File:** `supabase/functions/delete-story/index.ts:76`
**Problem:** The function mutated `payload.sources[].items` directly on the object fetched from the database. This is unsafe for two reasons: (1) concurrent requests could corrupt each other's data in memory, and (2) no runtime validation confirmed the payload structure before mutation.
**Fix:** Added explicit type guards (`typeof`, `Array.isArray`) before accessing nested properties. Replaced direct mutation with immutable updates using `.map()` and spread (`{ ...source, items: filtered }`). Pre-normalised the search title once before the loop.
**Deployed:** Yes.

---

## High Severity Fixes

### 7. Race Condition / Stale Closure — `useDailyBrief.ts`
**File:** `src/hooks/useDailyBrief.ts:80`
**Problem:** The `trigger` callback used `brief` from the closure in its guard condition (`if (prevPersonaRef.current === triggerPersona && brief) return`). This meant the callback had a stale reference to `brief`, causing incorrect deduplication — it would skip legitimate re-generation requests, or allow duplicate requests when the ref and state were out of sync. The callback also had `[brief]` as a dependency, meaning it was recreated every time a brief loaded, potentially causing downstream re-renders.
**Fix:** Replaced the persona ref + brief closure guard with a single `generatingRef` boolean ref. This cleanly prevents concurrent duplicate requests without any dependency on state. Removed `brief` from the dependency array, making the callback stable across renders.

### 8. Inconsistent Error Formatting — hooks
**Files:** `src/hooks/useMarketFeeds.ts`, `src/hooks/useHistoricalContext.ts`, `src/hooks/useDailyBrief.ts`, `src/hooks/useDailyDiff.ts`
**Problem:** `String(e)` was used to format errors, which produces `"Error: message"` for Error objects and inconsistent output for other throwables. This made error messages harder to read in the UI.
**Fix:** Replaced with `e instanceof Error ? e.message : String(e)` across all hooks for consistent, readable error messages.

### 9. Structured Error Logging — Edge Functions
**Files:** `supabase/functions/market-feeds/index.ts`, `supabase/functions/ai-brief/index.ts`
**Problem:** Top-level catch blocks returned error responses but did not log the error, making production debugging difficult — the error was only visible to the caller, not in server-side logs.
**Fix:** Added `console.error("[function-name] unhandled error:", e)` before each top-level error response.
**Deployed:** Yes.

---

## Medium Severity Fixes

### 10. Type Casting Without Runtime Validation — `DiagnosticsPage.tsx`
**File:** `src/components/DiagnosticsPage.tsx:249`
**Problem:** Properties from the feed_cache payload were accessed via TypeScript `as` casts (`source.success as boolean`, `source.items as unknown[] | undefined`, etc.) without any runtime check. If the payload structure changed or was malformed, the component would silently use incorrect values or crash.
**Fix:** Replaced all `as` casts with explicit runtime type guards (`typeof x === 'boolean'`, `Array.isArray(x)`, etc.) with safe fallback defaults.

---

## Status Summary

| # | Issue | Severity | Status | Files Changed |
|---|-------|----------|--------|---------------|
| 1 | Silent cache persist error | Critical | Fixed | `useMarketFeeds.ts` |
| 2 | localStorage no fallback | Critical | Fixed | `useUserSettings.ts`, `useActionCompletions.ts` |
| 3 | Unhandled signOut promise | High | Fixed | `AdminLogin.tsx` |
| 4 | Unsafe auth destructuring | High | Fixed | `useDismissedIntel.ts` |
| 5 | XSS in email HTML | Critical | Fixed + Deployed | `send-morning-brief/index.ts` |
| 6 | Unsafe payload mutation | Critical | Fixed + Deployed | `delete-story/index.ts` |
| 7 | Race condition / stale closure | High | Fixed | `useDailyBrief.ts` |
| 8 | Inconsistent error formatting | Low | Fixed | `useMarketFeeds.ts`, `useHistoricalContext.ts`, `useDailyDiff.ts` |
| 9 | No error logging in edge functions | Medium | Fixed + Deployed | `market-feeds/index.ts`, `ai-brief/index.ts` |
| 10 | Unsafe type casts | Medium | Fixed | `DiagnosticsPage.tsx` |

---

## Remaining Known Issues (Not Fixed — Lower Priority)

- **`feedDerived.ts` size (1152 lines):** Should be split into domain-specific files. No logic change needed, purely organisational.
- **No test coverage:** No unit or integration tests exist. Recommend adding Vitest tests for hooks and `feedDerived.ts` derivation logic.
- **Magic numbers in `feedDerived.ts`:** Signal thresholds (1.5%, 2%, 0.5%) are undocumented inline constants. Should be extracted to named constants.
- **Accessibility:** Interactive icons throughout the UI lack `aria-label` attributes.
- **No Error Boundary:** The Dashboard has no React Error Boundary. A single component crash will unmount the entire page.
- **RLS on historical tables:** Public read access on `commodity_percentiles`, `commodity_seasonal_patterns`, `conflict_zone_baselines` — intentional but should be documented.
