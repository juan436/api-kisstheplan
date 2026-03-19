import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatingPlan, SeatingPlanSchema } from './schemas/seating-plan.schema';
import { SeatingController } from './seating.controller';
import { SeatingService } from './seating.service';
import { WeddingModule } from '../wedding/wedding.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeatingPlan.name, schema: SeatingPlanSchema },
    ]),
    forwardRef(() => WeddingModule),
  ],
  controllers: [SeatingController],
  providers: [SeatingService],
  exports: [SeatingService],
})
export class SeatingModule {}
