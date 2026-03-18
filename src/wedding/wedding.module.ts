import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wedding, WeddingSchema } from './schemas/wedding.schema';
import { WeddingController } from './wedding.controller';
import { WeddingService } from './wedding.service';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wedding.name, schema: WeddingSchema }]),
    forwardRef(() => TaskModule),
  ],
  controllers: [WeddingController],
  providers: [WeddingService],
  exports: [WeddingService],
})
export class WeddingModule {}
