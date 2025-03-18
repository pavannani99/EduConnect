import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function cacheData(key: string, data: any, ttl: number) {
  await redis.set(key, JSON.stringify(data), 'EX', ttl);
}

export async function getCachedData(key: string) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
} 