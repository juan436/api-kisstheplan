import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WeddingService } from '../wedding/wedding.service';

@ApiTags('Budget')
@Controller('budget')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(
    private budgetService: BudgetService,
    private weddingService: WeddingService,
  ) {}

  // --- Categories ---

  @Get('categories')
  async getCategories(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const categories = await this.budgetService.findCategories(
      wedding._id.toString(),
    );
    return categories.map((c) => this.budgetService.categoryToResponse(c));
  }

  @Post('categories')
  async createCategory(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.budgetService.createCategory(
      wedding._id.toString(),
      dto,
    );
    return this.budgetService.categoryToResponse(cat);
  }

  @Patch('categories/:id')
  async updateCategory(
    @CurrentUser('id') userId: string,
    @Param('id') catId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.budgetService.updateCategory(
      catId,
      wedding._id.toString(),
      dto,
    );
    return this.budgetService.categoryToResponse(cat);
  }

  @Delete('categories/:id')
  async deleteCategory(
    @CurrentUser('id') userId: string,
    @Param('id') catId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.budgetService.deleteCategory(catId, wedding._id.toString());
    return { message: 'Categoría eliminada' };
  }

  // --- Items ---

  @Post('categories/:id/items')
  async addItem(
    @CurrentUser('id') userId: string,
    @Param('id') catId: string,
    @Body() dto: CreateItemDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.budgetService.addItem(
      catId,
      wedding._id.toString(),
      dto,
    );
    return this.budgetService.categoryToResponse(cat);
  }

  @Patch('categories/:catId/items/:itemId')
  async updateItem(
    @CurrentUser('id') userId: string,
    @Param('catId') catId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.budgetService.updateItem(
      catId,
      itemId,
      wedding._id.toString(),
      dto,
    );
    return this.budgetService.categoryToResponse(cat);
  }

  @Delete('categories/:catId/items/:itemId')
  async deleteItem(
    @CurrentUser('id') userId: string,
    @Param('catId') catId: string,
    @Param('itemId') itemId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.budgetService.deleteItem(
      catId,
      itemId,
      wedding._id.toString(),
    );
    return this.budgetService.categoryToResponse(cat);
  }

  // --- Summary ---

  @Get('summary')
  async getSummary(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.budgetService.getSummary(wedding._id.toString());
  }

  // --- Payments ---

  @Get('payments')
  async getPayments(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const payments = await this.budgetService.findPayments(
      wedding._id.toString(),
    );
    return payments.map((p) => this.budgetService.paymentToResponse(p));
  }

  @Post('payments')
  async createPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const payment = await this.budgetService.createPayment(
      wedding._id.toString(),
      dto,
    );
    return this.budgetService.paymentToResponse(payment);
  }

  @Patch('payments/:id')
  async updatePayment(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const payment = await this.budgetService.updatePayment(
      paymentId,
      wedding._id.toString(),
      dto,
    );
    return this.budgetService.paymentToResponse(payment);
  }

  @Delete('payments/:id')
  async deletePayment(
    @CurrentUser('id') userId: string,
    @Param('id') paymentId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.budgetService.deletePayment(
      paymentId,
      wedding._id.toString(),
    );
    return { message: 'Pago eliminado' };
  }
}
