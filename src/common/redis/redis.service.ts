import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client!: Redis; // ✅ FIXED

  onModuleInit() {
    this.client = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });
  }

  async set(key: string, value: any, ttl?: number) {
    const data = JSON.stringify(value);

    if (ttl) {
      await this.client.set(key, data, 'EX', ttl);
    } else {
      await this.client.set(key, data);
    }
  }

  async get(key: string) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async del(key: string) {
    return this.client.del(key);
  }
}