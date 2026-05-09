import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Guest, GuestSchema } from './schemas/guest.schema';
import { GuestGroup, GuestGroupSchema } from './schemas/guest-group.schema';
import { Wedding, WeddingSchema } from '../wedding/schemas/wedding.schema';
import { GuestController } from './guest.controller';
import { GuestService } from './guest.service';
import { WeddingModule } from '../wedding/wedding.module';
import { KtpMailerModule } from '../mailer/ktp-mailer.module';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guest.name, schema: GuestSchema },
      { name: GuestGroup.name, schema: GuestGroupSchema },
      { name: Wedding.name, schema: WeddingSchema },
    ]),
    WeddingModule,
    KtpMailerModule,
    ExcelModule,
  ],
  controllers: [GuestController],
  providers: [GuestService],
  exports: [GuestService],
})
export class GuestModule {}
