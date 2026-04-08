/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';
import { CrmService } from '../../zoho/crm/crm.service';

@Injectable()
export class UsersService {
  [x: string]: any;
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,

    private crmService: CrmService,
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
    const cleanId = id.replace(/[^a-fA-F0-9]/g, '');

    const user = await this.userModel.findByIdAndUpdate(cleanId, data, {
      new: true,
    });

    if (!user) throw new Error('User not found');

    // CRM sync
    if (user.zoho_contact_id) {
      try {
        await this.crmService.updateContact(user.zoho_contact_id, {
          First_Name: user.name,
          Email: user.email,
          Phone: user.mobile_number,
        });
      } catch (error) {
        console.error('CRM update failed:', error);
      }
    }

    return user;
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
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $push: { addresses: address } },
      { new: true },
    );

    if (!user) return null;

    // 🔥 Optional CRM sync (only if needed)
    if (user.zoho_contact_id) {
      try {
        await this.crmService.updateContact(user.zoho_contact_id, {
          Mailing_Street: address.line1,
          Mailing_City: address.city,
          Mailing_State: address.state,
          Mailing_Zip: address.pincode,
        });
      } catch (e) {
        console.error('CRM address update failed:', e);
      }
    }

    return user;
  }
}
