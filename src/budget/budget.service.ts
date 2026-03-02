import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExpenseCategory } from './schemas/expense-category.schema';
import { PaymentSchedule } from './schemas/payment-schedule.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class BudgetService {
  constructor(
    @InjectModel(ExpenseCategory.name)
    private categoryModel: Model<ExpenseCategory>,
    @InjectModel(PaymentSchedule.name)
    private paymentModel: Model<PaymentSchedule>,
  ) {}

  // --- Categories ---

  async findCategories(weddingId: string): Promise<ExpenseCategory[]> {
    return this.categoryModel
      .find({ weddingId: new Types.ObjectId(weddingId) })
      .sort({ order: 1 });
  }

  async createCategory(
    weddingId: string,
    dto: CreateCategoryDto,
  ): Promise<ExpenseCategory> {
    const count = await this.categoryModel.countDocuments({
      weddingId: new Types.ObjectId(weddingId),
    });
    return this.categoryModel.create({
      weddingId: new Types.ObjectId(weddingId),
      name: dto.name,
      order: dto.order ?? count,
    });
  }

  async updateCategory(
    categoryId: string,
    weddingId: string,
    dto: UpdateCategoryDto,
  ): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();

    const updated = await this.categoryModel.findByIdAndUpdate(
      categoryId,
      dto,
      { new: true },
    );
    return updated!;
  }

  async deleteCategory(categoryId: string, weddingId: string): Promise<void> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    await this.categoryModel.findByIdAndDelete(categoryId);
  }

  // --- Items (embedded in category) ---

  async addItem(
    categoryId: string,
    weddingId: string,
    dto: CreateItemDto,
  ): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();

    cat.items.push({
      concept: dto.concept,
      estimated: dto.estimated ?? 0,
      actual: dto.actual ?? 0,
      paid: dto.paid ?? 0,
    } as any);
    await cat.save();
    return cat;
  }

  async updateItem(
    categoryId: string,
    itemId: string,
    weddingId: string,
    dto: UpdateItemDto,
  ): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();

    const item = cat.items.find((i: any) => i._id.toString() === itemId);
    if (!item) throw new NotFoundException('Item no encontrado');

    if (dto.concept !== undefined) item.concept = dto.concept;
    if (dto.estimated !== undefined) item.estimated = dto.estimated;
    if (dto.actual !== undefined) item.actual = dto.actual;
    if (dto.paid !== undefined) item.paid = dto.paid;

    await cat.save();
    return cat;
  }

  async deleteItem(
    categoryId: string,
    itemId: string,
    weddingId: string,
  ): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();

    cat.items = cat.items.filter(
      (i: any) => i._id.toString() !== itemId,
    ) as any;
    await cat.save();
    return cat;
  }

  // --- Summary ---

  async getSummary(weddingId: string) {
    const categories = await this.findCategories(weddingId);
    let totalEstimated = 0;
    let totalReal = 0;
    let totalPaid = 0;

    for (const cat of categories) {
      for (const item of cat.items) {
        totalEstimated += item.estimated;
        totalReal += item.actual;
        totalPaid += item.paid;
      }
    }

    return {
      totalEstimated,
      totalReal,
      totalPaid,
      totalPending: totalReal - totalPaid,
    };
  }

  // --- Payments ---

  async findPayments(weddingId: string): Promise<PaymentSchedule[]> {
    return this.paymentModel
      .find({ weddingId: new Types.ObjectId(weddingId) })
      .sort({ dueDate: 1 });
  }

  async createPayment(
    weddingId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentSchedule> {
    return this.paymentModel.create({
      weddingId: new Types.ObjectId(weddingId),
      vendorName: dto.vendorName,
      concept: dto.concept,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      categoryId: dto.categoryId
        ? new Types.ObjectId(dto.categoryId)
        : undefined,
      vendorId: dto.vendorId
        ? new Types.ObjectId(dto.vendorId)
        : undefined,
      notes: dto.notes,
    });
  }

  async updatePayment(
    paymentId: string,
    weddingId: string,
    dto: UpdatePaymentDto,
  ): Promise<PaymentSchedule> {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.weddingId.toString() !== weddingId) {
      throw new ForbiddenException();
    }

    const updateData: Record<string, unknown> = {};
    if (dto.vendorName !== undefined) updateData.vendorName = dto.vendorName;
    if (dto.concept !== undefined) updateData.concept = dto.concept;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.paid !== undefined) {
      updateData.paidAt = dto.paid ? new Date() : null;
    }

    const updated = await this.paymentModel.findByIdAndUpdate(
      paymentId,
      updateData,
      { new: true },
    );
    return updated!;
  }

  async deletePayment(
    paymentId: string,
    weddingId: string,
  ): Promise<void> {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.weddingId.toString() !== weddingId) {
      throw new ForbiddenException();
    }
    await this.paymentModel.findByIdAndDelete(paymentId);
  }

  // --- Response mappers ---

  categoryToResponse(cat: ExpenseCategory) {
    return {
      id: cat._id.toString(),
      name: cat.name,
      items: cat.items.map((item: any) => ({
        id: item._id.toString(),
        categoryId: cat._id.toString(),
        concept: item.concept,
        estimated: item.estimated,
        real: item.actual,
        paid: item.paid,
      })),
    };
  }

  paymentToResponse(payment: PaymentSchedule) {
    return {
      id: payment._id.toString(),
      vendorName: payment.vendorName,
      concept: payment.concept,
      amount: payment.amount,
      dueDate: payment.dueDate.toISOString().split('T')[0],
      paid: !!payment.paidAt,
    };
  }

  async getUpcomingPayments(weddingId: string, limit = 5) {
    const payments = await this.paymentModel
      .find({
        weddingId: new Types.ObjectId(weddingId),
        paidAt: null,
      })
      .sort({ dueDate: 1 })
      .limit(limit);
    return payments.map((p) => this.paymentToResponse(p));
  }
}
