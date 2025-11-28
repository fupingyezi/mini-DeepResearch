import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.connect().catch(console.error);

redis.on("error", (err) => {
  console.error("Redis Client Error", err);
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

export async function setCache(
  key: string,
  value: string,
  expireSeconds?: number
) {
  const stringValue = JSON.stringify(value);
  if (expireSeconds) {
    await redis.setEx(key, expireSeconds, stringValue);
  } else {
    await redis.set(key, stringValue);
  }
}

export async function getCache(key: string) {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

export async function deleteCache(key: string) {
  await redis.del(key);
}

export default redis;
