import type { Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  if (!env.MARKET_FEED_ROOM) {
    return new Response('MARKET_FEED_ROOM binding is missing', { status: 500 });
  }

  const id = env.MARKET_FEED_ROOM.idFromName('global_market_feed');
  const stub = env.MARKET_FEED_ROOM.get(id);

  // Pass the incoming request directly to the Durable Object
  return stub.fetch(request);
};
