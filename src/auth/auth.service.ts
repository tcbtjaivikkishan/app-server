/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/schemas/user.schema';
import { ZohoService } from '../zoho/zoho.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private zohoService: ZohoService,
  ) {}

  // 🔹 Create Guest User
  async createGuest() {
    const guest = await this.userModel.create({
      mobile_number: `guest_${Date.now()}`,
      is_guest: true,
      guest_session_id: uuidv4(),
    });

    return guest;
  }

  // 🔹 Send OTP
  async sendOtp(mobile_number: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    let user = await this.userModel.findOne({ mobile_number });

    if (!user) {
      user = await this.userModel.create({
        mobile_number,
        is_guest: false,
      });
    }

    user.otp = {
      code: hashedOtp,
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      attempts: 0,
    };

    await user.save();

    // 🔥 Replace with SMS provider later
    console.log('OTP:', otp);

    return { message: 'OTP sent successfully' };
  }

  // 🔹 Verify OTP
  async verifyOtp(mobile_number: string, otp: string) {
    const user = await this.userModel.findOne({ mobile_number });

    // ❌ Invalid user or no OTP
    if (!user || !user.otp) {
      throw new Error('Invalid request');
    }

    // ❌ OTP expired
    if (user.otp.expires_at < new Date()) {
      throw new Error('OTP expired');
    }

    // ❌ Wrong OTP
    const isMatch = await bcrypt.compare(otp, user.otp.code);

    if (!isMatch) {
      user.otp.attempts += 1;
      await user.save();
      throw new Error('Invalid OTP');
    }

    // ✅ OTP verified
    user.last_login_at = new Date();
    user.otp = null;

    // 🔥 CRM Sync (safe, non-blocking)
    if (!user.zoho_contact_id) {
      try {
        const contactId = await this.zohoService.upsertContact(user);
        user.zoho_contact_id = contactId;
      } catch (error) {
        console.error('CRM Sync Failed:', error);
        // ❗ Don't block login
      }
    }

    // ✅ Save once
    await user.save();

    // 🔐 Generate JWT
    const token = this.jwtService.sign({
      userId: user._id,
    });

    return {
      access_token: token,
      user,
    };
  }
}
