import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScriptEntry, ScriptEntrySchema } from './schemas/script-entry.schema';
import { ScriptArea, ScriptAreaSchema } from './schemas/script-area.schema';
import { ScriptController } from './script.controller';
import { ScriptService } from './script.service';
import { WeddingModule } from '../wedding/wedding.module';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScriptEntry.name, schema: ScriptEntrySchema },
      { name: ScriptArea.name, schema: ScriptAreaSchema },
    ]),
    forwardRef(() => WeddingModule),
    ExcelModule,
  ],
  controllers: [ScriptController],
  providers: [ScriptService],
  exports: [ScriptService],
})
export class ScriptModule {}
