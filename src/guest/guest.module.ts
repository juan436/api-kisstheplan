import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Guest, GuestSchema } from './schemas/guest.schema';
import { GuestGroup, GuestGroupSchema } from './schemas/guest-group.schema';
import { GuestController } from './guest.controller';
import { GuestService } from './guest.service';
import { WeddingModule } from '../wedding/wedding.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Guest.name, schema: GuestSchema },
      { name: GuestGroup.name, schema: GuestGroupSchema },
    ]),
    WeddingModule,
  ],
  controllers: [GuestController],
  providers: [GuestService],
  exports: [GuestService],
})
export class GuestModule {}
