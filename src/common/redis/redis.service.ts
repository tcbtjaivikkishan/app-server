import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private isConnected = false;
  private errorLogged = false; // ✅ only log once

  onModuleInit() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: 6379,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // ✅ stop retrying — no spam
        enableOfflineQueue: false,  // ✅ don't queue commands when offline
      });

      this.client.connect().catch(() => {
        if (!this.errorLogged) {
          console.warn('⚠️ Redis not available, running without cache');
          this.errorLogged = true;
        }
        this.client?.disconnect();  // ✅ stop reconnect attempts
        this.client = null;
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
<<<<<<< HEAD
=======
        // console.warn('⚠️ Redis error, fallback mode');
>>>>>>> 10c0adbb8c422e5aeb44fa230a241f6db3317e24
      });

    } catch {
      console.warn('⚠️ Redis disabled');
      this.client = null;
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
      // silent
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