import redis from "@/lib/redis";

function cacheKey(userId: string) {
  return `openai-api-key:${userId}`;
}

export async function getCachedApiKey(userId: string) {
  return redis.get<string>(cacheKey(userId));
}

export async function setCachedApiKey(userId: string, apiKey: string) {
  await redis.set(cacheKey(userId), apiKey);
}

export async function deleteCachedApiKey(userId: string) {
  await redis.del(cacheKey(userId));
}
