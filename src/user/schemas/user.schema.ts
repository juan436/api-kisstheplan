import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop()
  passwordHash?: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  refreshTokenHash?: string;

  @Prop({ sparse: true, unique: true })
  googleId?: string;

  @Prop({ default: false })
  onboardingComplete: boolean;

  @Prop({ type: String, enum: ['owner', 'collaborator', 'admin'], default: 'owner' })
  role: 'owner' | 'collaborator' | 'admin';
}

export const UserSchema = SchemaFactory.createForClass(User);
