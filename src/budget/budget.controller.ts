import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { BudgetCategoryService } from './budget-category.service';
import { BudgetPaymentService } from './budget-payment.service';
import { BudgetSummaryService } from './budget-summary.service';
import { ExcelService } from '../excel/excel.service';
import { WeddingService } from '../wedding/wedding.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateItemPaymentDto } from './dto/create-item-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeddingGuard } from '../wedding/guards/wedding.guard';
import { CurrentWeddingId } from '../common/decorators/current-wedding-id.decorator';

@ApiTags('Budget')
@Controller('budget')
@UseGuards(JwtAuthGuard, WeddingGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(
    private categoryService: BudgetCategoryService,
    private paymentService: BudgetPaymentService,
    private summaryService: BudgetSummaryService,
    private excelService: ExcelService,
    private weddingService: WeddingService,
  ) {}

  @Get('categories')
  async getCategories(@CurrentWeddingId() weddingId: string) {
    return this.categoryService.findCategoriesWithPaid(weddingId);
  }

  @Post('categories')
  async createCategory(@CurrentWeddingId() weddingId: string, @Body() dto: CreateCategoryDto) {
    const cat = await this.categoryService.createCategory(weddingId, dto);
    return this.categoryService.categoryToResponse(cat);
  }

  @Patch('categories/:id')
  async updateCategory(@CurrentWeddingId() weddingId: string, @Param('id') catId: string, @Body() dto: UpdateCategoryDto) {
    const cat = await this.categoryService.updateCategory(catId, weddingId, dto);
    return this.categoryService.categoryToResponse(cat);
  }

  @Delete('categories/:id')
  async deleteCategory(@CurrentWeddingId() weddingId: string, @Param('id') catId: string) {
    await this.categoryService.deleteCategory(catId, weddingId);
    return { message: 'Categoría eliminada' };
  }

  @Post('categories/:id/items')
  async addItem(@CurrentWeddingId() weddingId: string, @Param('id') catId: string, @Body() dto: CreateItemDto) {
    const cat = await this.categoryService.addItem(catId, weddingId, dto);
    return this.categoryService.categoryToResponse(cat);
  }

  @Patch('categories/:catId/items/:itemId')
  async updateItem(@CurrentWeddingId() weddingId: string, @Param('catId') catId: string, @Param('itemId') itemId: string, @Body() dto: UpdateItemDto) {
    const cat = await this.categoryService.updateItem(catId, itemId, weddingId, dto);
    return this.categoryService.categoryToResponse(cat);
  }

  @Delete('categories/:catId/items/:itemId')
  async deleteItem(@CurrentWeddingId() weddingId: string, @Param('catId') catId: string, @Param('itemId') itemId: string) {
    const cat = await this.categoryService.deleteItem(catId, itemId, weddingId);
    return this.categoryService.categoryToResponse(cat);
  }

  @Get('categories/:catId/items/:itemId/payments')
  async getItemPayments(@CurrentWeddingId() weddingId: string, @Param('catId') catId: string, @Param('itemId') itemId: string) {
    return this.paymentService.getItemPayments(catId, itemId, weddingId);
  }

  @Post('categories/:catId/items/:itemId/payments')
  async createItemPayment(@CurrentWeddingId() weddingId: string, @Param('catId') catId: string, @Param('itemId') itemId: string, @Body() dto: CreateItemPaymentDto) {
    return this.paymentService.createItemPayment(catId, itemId, weddingId, dto);
  }

  @Patch('payments/:paymentId')
  async updatePayment(@CurrentWeddingId() weddingId: string, @Param('paymentId') paymentId: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentService.updatePayment(paymentId, weddingId, dto);
  }

  @Delete('payments/:paymentId')
  async deletePayment(@CurrentWeddingId() weddingId: string, @Param('paymentId') paymentId: string) {
    await this.paymentService.deletePayment(paymentId, weddingId);
    return { message: 'Pago eliminado' };
  }

  @Get('summary')
  async getSummary(@CurrentWeddingId() weddingId: string) {
    return this.summaryService.getSummary(weddingId);
  }

  @Get('vendor/:vendorId/payments')
  async getVendorPayments(@CurrentWeddingId() weddingId: string, @Param('vendorId') vendorId: string) {
    return this.paymentService.findPaymentsByVendor(weddingId, vendorId);
  }

  @Get('export/excel')
  async exportExcel(@CurrentWeddingId() weddingId: string, @Res() res: Response) {
    const [cats, summary, wedding] = await Promise.all([
      this.categoryService.findCategoriesWithPaid(weddingId),
      this.summaryService.getSummary(weddingId),
      this.weddingService.findById(weddingId),
    ]);

    const weddingName = wedding
      ? `${wedding.partner1Name} & ${wedding.partner2Name}`
      : 'KissthePlan';

    const budgetCats = cats.map((c) => ({
      name: c.name,
      items: c.items.map((i) => ({
        concept:   i.concept,
        estimated: i.estimated,
        real:      i.real,
        paid:      i.paid,
      })),
    }));

    const buffer = await this.excelService.generateBudgetExcel(budgetCats, summary, weddingName);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="presupuesto.xlsx"',
    });
    res.send(buffer);
  }

  @Get('export/pdf')
  async exportPdf(@CurrentWeddingId() weddingId: string, @Res() res: Response) {
    const [cats, summary, wedding] = await Promise.all([
      this.categoryService.findCategoriesWithPaid(weddingId),
      this.summaryService.getSummary(weddingId),
      this.weddingService.findById(weddingId),
    ]);

    const weddingName = wedding
      ? `${wedding.partner1Name} & ${wedding.partner2Name}`
      : 'KissthePlan';

    const weddingDate = wedding?.date
      ? new Date(wedding.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : undefined;

    const budgetCats = cats.map((c) => ({
      name: c.name,
      items: c.items.map((i) => ({
        concept:   i.concept,
        estimated: i.estimated,
        real:      i.real,
        paid:      i.paid,
      })),
    }));

    const buffer = await this.excelService.generateBudgetPdf(budgetCats, summary, weddingName, weddingDate);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="presupuesto.pdf"',
    });
    res.send(buffer);
  }

  @Get('payments/upcoming')
  async getUpcomingPayments(@CurrentWeddingId() weddingId: string) {
    return this.paymentService.getUpcomingPayments(weddingId, 5);
  }

  @Get('payments')
  async getPayments(@CurrentWeddingId() weddingId: string) {
    return this.paymentService.findAllPaymentsForCalendar(weddingId);
  }
}
