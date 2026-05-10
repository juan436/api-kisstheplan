import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatingPlan, SeatingPlanSchema } from './schemas/seating-plan.schema';
import { SeatingController } from './seating.controller';
import { SeatingService } from './seating.service';
import { SeatingExportService } from './seating-export.service';
import { WeddingModule } from '../wedding/wedding.module';
import { GuestModule } from '../guest/guest.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeatingPlan.name, schema: SeatingPlanSchema },
    ]),
    forwardRef(() => WeddingModule),
    GuestModule,
  ],
  controllers: [SeatingController],
  providers: [SeatingService, SeatingExportService],
  exports: [SeatingService],
})
export class SeatingModule {}
