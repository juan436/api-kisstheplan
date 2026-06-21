import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CollaboratorDocument = Collaborator & Document;

@Schema({ timestamps: true })
export class Collaborator {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true })
  weddingId: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId | null;

  @Prop({ required: true })
  token: string;

  @Prop({ type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' })
  status: 'pending' | 'accepted' | 'revoked';

  @Prop({ type: Date, default: null })
  acceptedAt: Date | null;
}

export const CollaboratorSchema = SchemaFactory.createForClass(Collaborator);

CollaboratorSchema.index({ weddingId: 1 });
CollaboratorSchema.index({ token: 1 }, { unique: true });
CollaboratorSchema.index({ userId: 1 });
