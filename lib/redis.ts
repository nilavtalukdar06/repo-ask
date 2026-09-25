import { Redis } from "@upstash/redis";

const globalForRedis = global as unknown as {
  redis: Redis;
};

const redis = globalForRedis.redis || Redis.fromEnv();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export default redis;
