import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  public client: Redis;
  private isConnected = false;

  onModuleInit() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: 6379,
        lazyConnect: true, // ✅ prevents immediate crash
        maxRetriesPerRequest: 1,
        password: process.env.REDIS_PASSWORD,
      });

      this.client.connect().catch(() => {
        console.warn('⚠️ Redis not available, running without cache');
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis connected');
      });

      this.client.on('error', () => {
        this.isConnected = false;
        // console.warn('⚠️ Redis error, fallback mode');
      });

    } catch (err) {
      console.warn('⚠️ Redis disabled');
    }
  }

  async set(key: string, value: any, ttl?: number) {
    if (!this.client || !this.isConnected) return; // ✅ skip safely

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
    if (!this.client || !this.isConnected) return null; // ✅ fallback

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