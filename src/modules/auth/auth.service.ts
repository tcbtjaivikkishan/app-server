import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { User } from '../users/schemas/user.schema';
import { ZohoAuthService } from '../../zoho/core/zoho-auth.service';
import { RedisService } from '../../common/redis/redis.service';
import axios from 'axios';

const OTP_TTL_SEC = 300;
const OTP_COOLDOWN_SEC = 60;
const RL_WINDOW_SEC = 900;
const SEND_LIMIT = 5;
const VERIFY_LIMIT = 10;
const OTP_MAX_ATTEMPTS = 5;

const REFRESH_TTL_SEC = 30 * 24 * 60 * 60; // 30d sliding

function otpKey(mobile: string) { return `auth:otp:${mobile}`; }
function otpCooldownKey(mobile: string) { return `auth:otp:cooldown:${mobile}`; }
function otpSendRlKey(mobile: string) { return `auth:otp:send:${mobile}`; }
function otpVerifyRlKey(mobile: string) { return `auth:otp:verify:${mobile}`; }

function sessKey(sid: string) { return `auth:sess:${sid}`; }
function userSessionsKey(uid: string) { return `auth:user_sessions:${uid}`; }
function deviceSessionKey(deviceId: string) { return `auth:device_session:${deviceId}`; }

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private zohoService: ZohoAuthService,
    private redis: RedisService,
  ) {}

  private normalizeMobile(input: string): string {
    const raw = (input ?? '').trim();
    const stripped = raw.replace(/[\s\-().]/g, '');

    if (stripped.startsWith('+')) return stripped;
    if (stripped.startsWith('00')) return `+${stripped.slice(2)}`;

    const defaultCc = (process.env.DEFAULT_COUNTRY_CODE ?? '+91').trim();
    const digitsOnly = stripped.replace(/\D/g, '');

    if (digitsOnly.length === 10) return `${defaultCc}${digitsOnly}`;
    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) return `${defaultCc}${digitsOnly.slice(1)}`;

    return stripped;
  }

  private async setOtpPayloadKeepingTtl(
    mobile: string,
    payload: { hash: string; attempts: number },
  ) {
    const r = this.redis.client;
    const key = otpKey(mobile);
    const ttl = await r.ttl(key);
    const ttlToUse = ttl > 0 ? ttl : OTP_TTL_SEC;
    await r.set(key, JSON.stringify(payload), 'EX', ttlToUse);
  }

  async createGuest() {
    const guest = await this.userModel.create({
      mobile_number: `guest_${Date.now()}`,
      is_guest: true,
      guest_session_id: uuidv4(),
    });
    return guest;
  }
  async sendOtp(mobile_number: string) {
    const mobile = this.normalizeMobile(mobile_number);
    const r = this.redis.client;
  
    if (await r.exists(otpCooldownKey(mobile))) {
      // throw new TooManyRequestsException('Please wait before requesting another OTP');
    }
  
    const sendCount = await r.incr(otpSendRlKey(mobile));
    if (sendCount === 1) await r.expire(otpSendRlKey(mobile), RL_WINDOW_SEC);
  
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);
  
    await r.set(otpKey(mobile), JSON.stringify({ hash, attempts: 0 }), 'EX', OTP_TTL_SEC);
    await r.set(otpCooldownKey(mobile), '1', 'EX', OTP_COOLDOWN_SEC);
  
    const flowName = 'login-sms1';
    const encodedFlowName = encodeURIComponent(flowName);
  console.log(otp);
    try {
      await axios.post(
        `https://control.msg91.com/api/v5/oneapi/api/flow/${encodedFlowName}/run`,
        {
          data: {
            sendTo: [
              {
                to: [
                  {
                    mobiles: `+91${mobile}`,
                    variables: {
                      var: {
                        type: 'text',
                        value: otp,
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          headers: {
            authkey: process.env.MSG91_AUTH_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      const err = error as any;
      console.error('MSG91 Error:', err.response?.data || err.message);
      throw new Error('Failed to send OTP');
    }
  
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(input: { mobile_number: string; otp: string; device_id: string; guest_session_id?: string }) {
    const mobile = this.normalizeMobile(input.mobile_number);
    const r = this.redis.client;

    const verifyCount = await r.incr(otpVerifyRlKey(mobile));
    if (verifyCount === 1) await r.expire(otpVerifyRlKey(mobile), RL_WINDOW_SEC);
    // if (verifyCount > VERIFY_LIMIT) throw new TooManyRequestsException('Too many attempts, try later');

    const raw = await r.get(otpKey(mobile));
    if (!raw) throw new BadRequestException('OTP expired');

    const payload: { hash: string; attempts: number } = JSON.parse(raw);

    const ok = await bcrypt.compare(input.otp, payload.hash);
    if (!ok) {
      const attempts = (payload.attempts ?? 0) + 1;
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await r.del(otpKey(mobile));
      } else {
        await this.setOtpPayloadKeepingTtl(mobile, { hash: payload.hash, attempts });
      }
      throw new UnauthorizedException('Invalid OTP');
    }

    await r.del(otpKey(mobile));

    // upsert user
    let user = await this.userModel.findOne({ mobile_number: mobile });
    if (!user) {
      user = await this.userModel.create({ mobile_number: mobile, is_guest: false });
    }

    user.last_login_at = new Date();

    // CRM sync (keep your existing behavior)
    if (!user.zoho_contact_id) {
      try {
        // const contactId = await this.zohoService.upsertContact(user);
        // user.zoho_contact_id = contactId;
      } catch {
        // don’t block login
      }
    }

    await user.save();

    // TODO: guest_session_id merge hook here (cart migration) using input.guest_session_id

    // 1 session per device: revoke old
    const oldSid = await r.get(deviceSessionKey(input.device_id));
    if (oldSid) {
      const uid = user._id.toString();
      await r.del(sessKey(oldSid));
      await r.srem(userSessionsKey(uid), oldSid);
    }

    // create new session
    const sid = uuidv4();
    const refresh = randomBytes(48).toString('base64url');
    const rtHash = await bcrypt.hash(refresh, 10);
    const now = Date.now();

    const uid = user._id.toString();

    await r.hset(sessKey(sid), {
      uid,
      rt_hash: rtHash,
      device_id: input.device_id,
      created_at: String(now),
      last_used_at: String(now),
    });
    await r.expire(sessKey(sid), REFRESH_TTL_SEC);

    await r.set(deviceSessionKey(input.device_id), sid, 'EX', REFRESH_TTL_SEC);
    await r.sadd(userSessionsKey(uid), sid);

    const access = this.jwtService.sign({ sub: uid, sid });

    return {
      access_token: access,
      refresh_token: refresh,
      session_id: sid,
      user,
    };
  }

  async refresh(session_id: string, refresh_token: string) {
    const r = this.redis.client;

    const sess = await r.hgetall(sessKey(session_id));
    if (!sess?.uid || !sess?.rt_hash) throw new UnauthorizedException('Invalid session');

    const ok = await bcrypt.compare(refresh_token, sess.rt_hash);
    if (!ok) {
      // token reuse/theft => revoke session
      await r.del(sessKey(session_id));
      await r.srem(userSessionsKey(sess.uid), session_id);
      if (sess?.device_id) {
        const mapped = await r.get(deviceSessionKey(sess.device_id));
        if (mapped === session_id) {
          await r.del(deviceSessionKey(sess.device_id));
        }
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newRefresh = randomBytes(48).toString('base64url');
    const newHash = await bcrypt.hash(newRefresh, 10);

    await r.hset(sessKey(session_id), { rt_hash: newHash, last_used_at: String(Date.now()) });
    await r.expire(sessKey(session_id), REFRESH_TTL_SEC); // sliding TTL

    const access = this.jwtService.sign({ sub: sess.uid, sid: session_id });

    return { access_token: access, refresh_token: newRefresh, session_id };
  }

  async logout(session_id: string) {
    const r = this.redis.client;

    const sess = await r.hgetall(sessKey(session_id));
    if (sess?.uid) await r.srem(userSessionsKey(sess.uid), session_id);
    if (sess?.device_id) {
      const mapped = await r.get(deviceSessionKey(sess.device_id));
      if (mapped === session_id) {
        await r.del(deviceSessionKey(sess.device_id));
      }
    }

    await r.del(sessKey(session_id));
    return { message: 'Logged out' };
  }
}