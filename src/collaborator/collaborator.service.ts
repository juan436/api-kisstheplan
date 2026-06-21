import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Collaborator } from './schemas/collaborator.schema';
import { Wedding } from '../wedding/schemas/wedding.schema';
import { KtpMailerService } from '../mailer/ktp-mailer.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

type CollaboratorLike = {
  _id: Types.ObjectId | unknown;
  email: string;
  status: string;
  acceptedAt?: Date | null;
};

@Injectable()
export class CollaboratorService {
  constructor(
    @InjectModel(Collaborator.name) private collaboratorModel: Model<Collaborator>,
    @InjectModel(Wedding.name) private weddingModel: Model<Wedding>,
    private mailer: KtpMailerService,
    private config: ConfigService,
    private userService: UserService,
  ) {}

  private toResponse(c: CollaboratorLike) {
    return {
      id: (c._id as Types.ObjectId).toString(),
      email: c.email,
      status: c.status,
      acceptedAt: c.acceptedAt ? (c.acceptedAt as Date).toISOString() : null,
    };
  }

  private async assertSlotAvailable(weddingOid: Types.ObjectId, email: string): Promise<void> {
    const active = await this.collaboratorModel.countDocuments({
      weddingId: weddingOid,
      status: { $in: ['pending', 'accepted'] },
    });
    if (active >= 3) throw new BadRequestException('Máximo 3 colaboradores por boda');

    const existing = await this.collaboratorModel.findOne({
      weddingId: weddingOid,
      email: email.toLowerCase().trim(),
      status: { $in: ['pending', 'accepted'] },
    });
    if (existing) throw new ConflictException('Este email ya tiene una invitación activa');
  }

  async invite(weddingId: string, email: string) {
    const weddingOid = new Types.ObjectId(weddingId);
    await this.assertSlotAvailable(weddingOid, email);

    const wedding = await this.weddingModel.findById(weddingOid).lean();
    if (!wedding) throw new NotFoundException('Boda no encontrada');

    const token = randomUUID();
    const collaborator = await this.collaboratorModel.create({
      weddingId: weddingOid,
      email: email.toLowerCase().trim(),
      token,
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const acceptUrl = `${frontendUrl}/invitar/${token}`;

    this.mailer
      .sendCollaboratorInvite({
        to: email,
        partner1Name: wedding.partner1Name,
        partner2Name: wedding.partner2Name,
        acceptUrl,
      })
      .catch((err) => console.error('[CollaboratorService] Mail error:', err));

    return this.toResponse(collaborator as CollaboratorLike);
  }

  async createManual(weddingId: string, email: string, password: string, name: string) {
    const weddingOid = new Types.ObjectId(weddingId);
    await this.assertSlotAvailable(weddingOid, email);

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) throw new ConflictException('Este email ya tiene una cuenta en KissthePlan');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.userService.create({ email: email.toLowerCase().trim(), passwordHash, name, role: 'collaborator' });
    await this.userService.setOnboardingComplete(user._id.toString());

    const collaborator = await this.collaboratorModel.create({
      weddingId: weddingOid,
      email: email.toLowerCase().trim(),
      token: randomUUID(),
      userId: user._id,
      status: 'accepted',
      acceptedAt: new Date(),
    });

    return this.toResponse(collaborator as CollaboratorLike);
  }

  async findAll(weddingId: string) {
    const docs = await this.collaboratorModel
      .find({ weddingId: new Types.ObjectId(weddingId), status: { $ne: 'revoked' } })
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((c) => this.toResponse(c as CollaboratorLike));
  }

  async revoke(weddingId: string, collaboratorId: string) {
    const result = await this.collaboratorModel.findOneAndUpdate(
      { _id: new Types.ObjectId(collaboratorId), weddingId: new Types.ObjectId(weddingId) },
      { $set: { status: 'revoked', userId: null } },
      { new: true },
    );
    if (!result) throw new NotFoundException('Colaborador no encontrado');
  }

  async accept(token: string, userId: string) {
    const collaborator = await this.collaboratorModel.findOne({ token });
    if (!collaborator) throw new NotFoundException('Invitación no válida');
    if (collaborator.status === 'revoked') throw new BadRequestException('Esta invitación ha sido revocada');

    await this.userService.setRole(userId, 'collaborator');
    await this.userService.setOnboardingComplete(userId);

    if (collaborator.status === 'accepted') {
      return { weddingId: collaborator.weddingId.toString() };
    }

    collaborator.userId = new Types.ObjectId(userId);
    collaborator.status = 'accepted';
    collaborator.acceptedAt = new Date();
    await collaborator.save();

    return { weddingId: collaborator.weddingId.toString() };
  }

  async getInviteInfo(token: string) {
    const collaborator = await this.collaboratorModel.findOne({ token }).lean();
    if (!collaborator) throw new NotFoundException('Invitación no válida');
    const wedding = await this.weddingModel.findById(collaborator.weddingId).lean();
    if (!wedding) throw new NotFoundException('Boda no encontrada');
    return {
      email: collaborator.email,
      status: collaborator.status,
      partner1Name: wedding.partner1Name,
      partner2Name: wedding.partner2Name,
    };
  }

  async findAcceptedByUserId(userId: string): Promise<string | null> {
    const doc = await this.collaboratorModel
      .findOne({ userId: new Types.ObjectId(userId), status: 'accepted' })
      .lean();
    return doc ? doc.weddingId.toString() : null;
  }
}
