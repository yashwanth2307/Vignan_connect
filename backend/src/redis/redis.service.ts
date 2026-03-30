import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Redis-compatible service with in-memory fallback.
 * When Redis is not available, uses an in-memory Map with TTL support.
 * This allows the app to run without Docker/Redis.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private memStore = new Map<string, { value: string; expiresAt?: number }>();
  private redisClient: any = null;
  private useMemory = false;

  constructor(private config: ConfigService) {
    this.initRedis();
  }

  private async initRedis() {
    try {
      const Redis = (await import('ioredis')).default;
      this.redisClient = new Redis({
        host: this.config.get('REDIS_HOST', 'localhost'),
        port: this.config.get<number>('REDIS_PORT', 6379),
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 2) return null; // Stop retrying after 2 attempts
          return Math.min(times * 200, 1000);
        },
        connectTimeout: 3000,
        lazyConnect: true,
      });

      this.redisClient.on('error', () => {
        if (!this.useMemory) {
          console.log('⚠️  Redis not available — using in-memory store');
          this.useMemory = true;
        }
      });

      await this.redisClient.connect();
      console.log('✅ Redis connected');
    } catch {
      console.log('⚠️  Redis not available — using in-memory store');
      this.useMemory = true;
    }
  }

  // Clean expired keys from memory store
  private cleanExpired() {
    const now = Date.now();
    for (const [key, entry] of this.memStore) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.memStore.delete(key);
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemory) {
      this.cleanExpired();
      const entry = this.memStore.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt <= Date.now()) {
        this.memStore.delete(key);
        return null;
      }
      return entry.value;
    }
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.useMemory) {
      this.memStore.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      });
      return;
    }
    if (ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (this.useMemory) {
      this.memStore.delete(key);
      return;
    }
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.useMemory) {
      this.cleanExpired();
      const entry = this.memStore.get(key);
      if (!entry) return false;
      if (entry.expiresAt && entry.expiresAt <= Date.now()) {
        this.memStore.delete(key);
        return false;
      }
      return true;
    }
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  async setJson(key: string, data: any, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(data), ttlSeconds);
  }

  async getJson<T = any>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  getClient(): any {
    return this.redisClient || this.memStore;
  }

  async onModuleDestroy() {
    if (this.redisClient && !this.useMemory) {
      await this.redisClient.quit();
    }
  }
}
