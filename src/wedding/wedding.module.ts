import { Module, forwardRef } from '@nestjs/common';
import { WeddingGuard } from './guards/wedding.guard';
import { MongooseModule } from '@nestjs/mongoose';
import { Wedding, WeddingSchema } from './schemas/wedding.schema';
import { WeddingController } from './wedding.controller';
import { WeddingService } from './wedding.service';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { ExpenseCategory, ExpenseCategorySchema } from '../budget/schemas/expense-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wedding.name, schema: WeddingSchema },
      { name: ExpenseCategory.name, schema: ExpenseCategorySchema },
    ]),
    forwardRef(() => TaskModule),
    UserModule,
  ],
  controllers: [WeddingController],
  providers: [WeddingService, WeddingGuard],
  exports: [WeddingService, WeddingGuard],
})
export class WeddingModule {}
