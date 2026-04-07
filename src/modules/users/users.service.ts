/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  // 🔹 Create Guest
  async createGuest() {
    return this.userModel.create({
      mobile_number: `guest_${Date.now()}`,
      is_guest: true,
      guest_session_id: uuidv4(),
    });
  }

  // 🔹 Find by mobile
  async findByMobile(mobile: string) {
    return this.userModel.findOne({ mobile_number: mobile });
  }

  // 🔹 Find by ID
  async findById(id: string) {
    return this.userModel.findById(id);
  }

  // 🔹 Create or Get user (OTP flow)
  async findOrCreateUser(mobile: string) {
    let user = await this.findByMobile(mobile);

    if (!user) {
      user = await this.userModel.create({
        mobile_number: mobile,
        is_guest: false,
      });
    }

    return user;
  }

  // 🔹 Update user
  async updateUser(id: string, data: any) {
    return this.userModel.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  // 🔹 Convert guest → registered
  async convertGuestToUser(userId: string, data: any) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        ...data,
        is_guest: false,
      },
      { new: true },
    );
  }

  // 🔹 Add address
  async addAddress(userId: string, address: any) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $push: { addresses: address } },
      { new: true },
    );
  }
}
