import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from './schemas/lead.schema';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { KtpMailerModule } from '../mailer/ktp-mailer.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lead.name, schema: LeadSchema }]),
    KtpMailerModule,
  ],
  controllers: [LeadController],
  providers: [LeadService],
})
export class LeadModule {}
