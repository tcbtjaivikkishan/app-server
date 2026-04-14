import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client!: Redis;
  private isConnected = false;
  private errorLogged = false;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;

    try {
      this.client = redisUrl
        ? new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null,
            enableOfflineQueue: false,
          })
        : new Redis({
            host: '127.0.0.1',
            port: 6379,
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            retryStrategy: () => null,
            enableOfflineQueue: false,
          });

      this.client.connect().catch(() => {
        if (!this.errorLogged) {
          console.warn('⚠️ Redis not available, running without cache');
          this.errorLogged = true;
        }
        this.client?.disconnect();
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.errorLogged = false;
        console.log('✅ Redis connected');
      });

      this.client.on('error', () => {
        if (!this.errorLogged) {
          console.warn('⚠️ Redis unavailable, fallback mode active');
          this.errorLogged = true;
        }
        this.isConnected = false;
      });

    } catch {
      console.warn('⚠️ Redis disabled');
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  async set(key: string, value: any, ttl?: number) {
    if (!this.client || !this.isConnected) return;

    try {
      const data = JSON.stringify(value);

      if (ttl) {
        await this.client.set(key, data, 'EX', ttl);
      } else {
        await this.client.set(key, data);
      }
    } catch {
      // silent fail
    }
  }

  async get(key: string) {
    if (!this.client || !this.isConnected) return null;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async del(key: string) {
    if (!this.client || !this.isConnected) return;

    try {
      return await this.client.del(key);
    } catch {
      return;
    }
  }
}