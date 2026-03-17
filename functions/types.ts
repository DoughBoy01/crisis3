export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  MARKET_FEED_ROOM: DurableObjectNamespace;
}

export type JwtPayload = {
  sub: string;
  role: string;
  exp: number;
};
