# WebSocket Upgrade - Market Feeds Migration

## Summary
Successfully upgraded `useMarketFeeds.ts` from polling to Durable Objects WebSocket architecture.

## Changes Made

### 1. ✅ Created [wrangler.jsonc](../wrangler.jsonc)
- Added Durable Object binding configuration for `MARKET_FEED_ROOM`
- Enabled `nodejs_compat` flag
- Configured observability (head_sampling_rate: 1)
- Added D1 database binding placeholder

### 2. ✅ Fixed [MarketFeedRoom.ts](../functions/_do/MarketFeedRoom.ts)
**Before Issues:**
- Missing proper type for `env` parameter (was `any`)
- No session cleanup on broadcast errors
- Poor error handling

**After Fixes:**
- Added proper `Env` type from shared types
- Improved broadcast endpoint with:
  - Failed session tracking and cleanup
  - Proper error logging
  - JSON response with broadcast stats
- Better session management

### 3. ✅ Created Shared Type System [functions/types.ts](../functions/types.ts)
**Unified Environment Interface:**
```typescript
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  MARKET_FEED_ROOM: DurableObjectNamespace;
}
```

**Updated Files:**
- [functions/_middleware.ts](../functions/_middleware.ts:1-3) - Now imports from shared types
- [functions/api/feed_cache/connect.ts](../functions/api/feed_cache/connect.ts:1-3) - Now imports from shared types

### 4. ✅ Rewrote [useMarketFeeds.ts](../src/hooks/useMarketFeeds.ts) - WebSocket Implementation

**Removed:**
- ❌ HTTP polling (`fetch()` every 15 minutes)
- ❌ Database polling (`getFeedCache()` every 5 seconds)
- ❌ `AUTO_REFRESH_MS` constant
- ❌ `persistToCache()` function
- ❌ All polling intervals and timers

**Added:**
- ✅ WebSocket connection via `/api/feed_cache/connect`
- ✅ Automatic reconnection with exponential backoff
  - Initial delay: 3 seconds
  - Max delay: 30 seconds
- ✅ Proper connection state management
- ✅ Clean unmount handling
- ✅ Real-time message parsing and state updates
- ✅ Error recovery and connection status reporting

**Key Features:**
```typescript
// WebSocket URL generation (supports ws/wss)
const getWebSocketUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/api/feed_cache/connect`;
};

// Exponential backoff reconnection
ws.onclose = (event) => {
  reconnectTimeoutRef.current = setTimeout(() => {
    connect();
  }, reconnectDelayRef.current);

  reconnectDelayRef.current = Math.min(
    reconnectDelayRef.current * 2,
    MAX_RECONNECT_DELAY_MS
  );
};
```

### 5. ✅ WebSocket Connect Endpoint [functions/api/feed_cache/connect.ts](../functions/api/feed_cache/connect.ts)
**Already Existed:**
- ✅ Proper WebSocket upgrade handling
- ✅ Durable Object routing via `idFromName('global_market_feed')`
- ✅ Error responses for invalid requests

## Architecture Flow

```
┌─────────────────┐         WebSocket          ┌──────────────────────┐
│  React Client   │◄────────────────────────────┤  /api/feed_cache/    │
│  (useMarket     │         wss://              │  connect             │
│   Feeds hook)   │                             └──────────┬───────────┘
└─────────────────┘                                        │
                                                           │ Routes to
                                                           ▼
                                             ┌──────────────────────────┐
                                             │  MarketFeedRoom DO       │
                                             │  (Durable Object)        │
                                             │  - Manages WebSocket     │
                                             │    sessions              │
                                             │  - Broadcasts updates    │
                                             └──────────────────────────┘
                                                           ▲
                                                           │
                                                   POST /broadcast
                                                   (from backend job)
```

## Data Flow

1. **Client connects** → WebSocket upgrade → Durable Object session added
2. **Backend updates data** → POST to `/broadcast` on Durable Object
3. **Durable Object** → Sends JSON payload to all connected WebSocket sessions
4. **React hook** → Parses message → Updates state → UI re-renders

## Interface Compatibility

The `FeedState` interface remains **100% compatible**:
```typescript
export interface FeedState {
  data: FeedPayload | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
  secondsSinceRefresh: number;
  nextRefreshIn: number;  // Now always 0 (real-time updates)
  refresh: () => void;     // Now sends PING to request fresh data
}
```

**No breaking changes** - existing components using the hook will continue to work.

## Deployment Checklist

- [ ] Deploy Durable Object class (`MarketFeedRoom`) via `wrangler deploy`
- [ ] Verify `MARKET_FEED_ROOM` binding is active in Cloudflare dashboard
- [ ] Update D1 database ID in wrangler.jsonc
- [ ] Set `JWT_SECRET` via `wrangler secret put JWT_SECRET`
- [ ] Create backend job to POST feed updates to Durable Object `/broadcast` endpoint
- [ ] Test WebSocket connection in browser DevTools
- [ ] Monitor connection metrics in Cloudflare observability dashboard

## Testing

**Browser DevTools Console:**
```
[useMarketFeeds] WebSocket connected
```

**Test WebSocket manually:**
```bash
# In browser console
ws = new WebSocket('wss://your-domain.com/api/feed_cache/connect')
ws.onmessage = (e) => console.log(JSON.parse(e.data))
```

**Test broadcast endpoint:**
```bash
curl -X POST https://your-domain.com/api/feed_cache/connect/broadcast \
  -H "Content-Type: application/json" \
  -d '{"fetched_at":"2026-03-17T16:00:00Z","sources":[]}'
```

## Next Steps

1. **Create a scheduled worker** or **cron job** to:
   - Fetch market feeds periodically (every 15 minutes)
   - POST results to the Durable Object `/broadcast` endpoint

2. **Add heartbeat/keepalive** (optional):
   - Client sends PING every 30 seconds
   - Server responds with PONG
   - Already implemented in MarketFeedRoom

3. **Monitor metrics**:
   - WebSocket connection count
   - Broadcast success/failure rates
   - Reconnection frequency

## Files Changed

- `wrangler.jsonc` (created)
- `functions/types.ts` (created)
- `functions/_do/MarketFeedRoom.ts` (improved)
- `functions/_middleware.ts` (refactored)
- `functions/api/feed_cache/connect.ts` (refactored)
- `src/hooks/useMarketFeeds.ts` (complete rewrite)
- `docs/WEBSOCKET-UPGRADE.md` (this file)
