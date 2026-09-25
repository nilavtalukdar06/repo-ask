import redis from "@/lib/redis";
import { secret } from "@/lib/secret";

function cacheKey(userId: string) {
  return `ai-gateway-api-key:${userId}`;
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

// Cache-first lookup of a user's Vercel AI Gateway API key, falling back to
// Infisical (the source of truth) on a miss and repopulating the cache.
export async function getApiKeyForUser(userId: string): Promise<string> {
  const cached = await getCachedApiKey(userId);
  if (cached) {
    return cached;
  }

  await secret.auth().universalAuth.login({
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
  });
  const result = await secret.secrets().getSecret({
    environment: "dev",
    projectId: process.env.PROJECT_ID!,
    secretName: `AI_GATEWAY_API_KEY_${userId}`,
  });

  await setCachedApiKey(userId, result.secretValue);

  return result.secretValue;
}
