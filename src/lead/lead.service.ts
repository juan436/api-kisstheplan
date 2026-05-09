import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead } from './schemas/lead.schema';
import { KtpMailerService } from '../mailer/ktp-mailer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LeadService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    private readonly mailer: KtpMailerService,
    private readonly config: ConfigService,
  ) {}

  async subscribe(email: string): Promise<void> {
    const existing = await this.leadModel.findOne({ email });
    if (existing) throw new ConflictException('Este email ya está registrado');

    await this.leadModel.create({ email });

    const adminEmail = this.config.get<string>('ADMIN_EMAIL', 'kisstheplan@gmail.com');
    const date = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    this.mailer.sendNewLead({ to: adminEmail, email, date })
      .then(() => console.log(`[lead] Notificación enviada a ${adminEmail}`))
      .catch((err) => console.error('[lead] Error enviando notificación:', err));
  }
}
