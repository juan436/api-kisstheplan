import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async create(data: {
    email: string;
    passwordHash: string;
    name: string;
    role?: 'owner' | 'collaborator';
  }): Promise<User> {
    return this.userModel.create(data);
  }

  async setRole(userId: string, role: 'owner' | 'collaborator'): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { role });
  }

  async createGoogleUser(data: {
    email: string;
    name: string;
    googleId: string;
    avatarUrl?: string;
  }): Promise<User> {
    return this.userModel.create({ ...data, onboardingComplete: false });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId });
  }

  async linkGoogleId(
    userId: string,
    googleId: string,
    avatarUrl?: string,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      googleId,
      ...(avatarUrl && { avatarUrl }),
    });
  }

  async setOnboardingComplete(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { onboardingComplete: true });
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash });
  }
}
