import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { Vendor, VendorSchema } from './schemas/vendor.schema';
import { WeddingModule } from '../wedding/wedding.module';
import { ExpenseCategory, ExpenseCategorySchema } from '../budget/schemas/expense-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vendor.name, schema: VendorSchema },
      { name: ExpenseCategory.name, schema: ExpenseCategorySchema },
    ]),
    WeddingModule,
  ],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}
