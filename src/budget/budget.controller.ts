import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetCategoryService } from './budget-category.service';
import { BudgetPaymentService } from './budget-payment.service';
import { BudgetSummaryService } from './budget-summary.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateItemPaymentDto } from './dto/create-item-payment.dto';
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
    private categoryService: BudgetCategoryService,
    private paymentService: BudgetPaymentService,
    private summaryService: BudgetSummaryService,
    private weddingService: WeddingService,
  ) {}

  @Get('categories')
  async getCategories(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.categoryService.findCategoriesWithPaid(wedding._id.toString());
  }

  @Post('categories')
  async createCategory(@CurrentUser('id') userId: string, @Body() dto: CreateCategoryDto) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.categoryService.createCategory(wedding._id.toString(), dto);
    return this.categoryService.categoryToResponse(cat);
  }

  @Patch('categories/:id')
  async updateCategory(@CurrentUser('id') userId: string, @Param('id') catId: string, @Body() dto: UpdateCategoryDto) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.categoryService.updateCategory(catId, wedding._id.toString(), dto);
    return this.categoryService.categoryToResponse(cat);
  }

  @Delete('categories/:id')
  async deleteCategory(@CurrentUser('id') userId: string, @Param('id') catId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.categoryService.deleteCategory(catId, wedding._id.toString());
    return { message: 'Categoría eliminada' };
  }

  @Post('categories/:id/items')
  async addItem(@CurrentUser('id') userId: string, @Param('id') catId: string, @Body() dto: CreateItemDto) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.categoryService.addItem(catId, wedding._id.toString(), dto);
    return this.categoryService.categoryToResponse(cat);
  }

  @Patch('categories/:catId/items/:itemId')
  async updateItem(@CurrentUser('id') userId: string, @Param('catId') catId: string, @Param('itemId') itemId: string, @Body() dto: UpdateItemDto) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.categoryService.updateItem(catId, itemId, wedding._id.toString(), dto);
    return this.categoryService.categoryToResponse(cat);
  }

  @Delete('categories/:catId/items/:itemId')
  async deleteItem(@CurrentUser('id') userId: string, @Param('catId') catId: string, @Param('itemId') itemId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const cat = await this.categoryService.deleteItem(catId, itemId, wedding._id.toString());
    return this.categoryService.categoryToResponse(cat);
  }

  @Get('categories/:catId/items/:itemId/payments')
  async getItemPayments(@CurrentUser('id') userId: string, @Param('catId') catId: string, @Param('itemId') itemId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.paymentService.getItemPayments(catId, itemId, wedding._id.toString());
  }

  @Post('categories/:catId/items/:itemId/payments')
  async createItemPayment(@CurrentUser('id') userId: string, @Param('catId') catId: string, @Param('itemId') itemId: string, @Body() dto: CreateItemPaymentDto) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.paymentService.createItemPayment(catId, itemId, wedding._id.toString(), dto);
  }

  @Patch('payments/:paymentId')
  async updatePayment(@CurrentUser('id') userId: string, @Param('paymentId') paymentId: string, @Body() dto: UpdatePaymentDto) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.paymentService.updatePayment(paymentId, wedding._id.toString(), dto);
  }

  @Delete('payments/:paymentId')
  async deletePayment(@CurrentUser('id') userId: string, @Param('paymentId') paymentId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.paymentService.deletePayment(paymentId, wedding._id.toString());
    return { message: 'Pago eliminado' };
  }

  @Get('summary')
  async getSummary(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.summaryService.getSummary(wedding._id.toString());
  }

  @Get('vendor/:vendorId/payments')
  async getVendorPayments(@CurrentUser('id') userId: string, @Param('vendorId') vendorId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.paymentService.findPaymentsByVendor(wedding._id.toString(), vendorId);
  }

  @Get('payments/upcoming')
  async getUpcomingPayments(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.paymentService.getUpcomingPayments(wedding._id.toString(), 5);
  }

  @Get('payments')
  async getPayments(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.paymentService.findAllPaymentsForCalendar(wedding._id.toString());
  }
}
