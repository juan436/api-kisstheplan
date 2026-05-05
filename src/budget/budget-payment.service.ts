import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExpenseCategory } from './schemas/expense-category.schema';
import { PaymentSchedule } from './schemas/payment-schedule.schema';
import { CreateItemPaymentDto } from './dto/create-item-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class BudgetPaymentService {
  constructor(
    @InjectModel(ExpenseCategory.name) private categoryModel: Model<ExpenseCategory>,
    @InjectModel(PaymentSchedule.name) private paymentScheduleModel: Model<PaymentSchedule>,
  ) {}

  private async findCategories(weddingId: string): Promise<ExpenseCategory[]> {
    return this.categoryModel.find({ weddingId: new Types.ObjectId(weddingId) }).sort({ order: 1 });
  }

  async getItemPayments(categoryId: string, itemId: string, weddingId: string) {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    const payments = await this.paymentScheduleModel
      .find({ weddingId: new Types.ObjectId(weddingId), itemId: new Types.ObjectId(itemId) })
      .sort({ dueDate: 1 });
    return payments.map((p) => this.paymentToResponse(p));
  }

  async createItemPayment(categoryId: string, itemId: string, weddingId: string, dto: CreateItemPaymentDto) {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    const item = cat.items.find((i) => i._id.toString() === itemId);
    if (!item) throw new NotFoundException('Item no encontrado');
    const vendorId = item.vendorId ?? undefined;
    const payment = await this.paymentScheduleModel.create({
      weddingId: new Types.ObjectId(weddingId),
      categoryId: new Types.ObjectId(categoryId),
      itemId: new Types.ObjectId(itemId),
      ...(vendorId ? { vendorId } : {}),
      concept: dto.concept,
      amount: dto.amount,
      dueDate: new Date(dto.dueDate),
      notes: dto.notes,
    });
    return this.paymentToResponse(payment);
  }

  async updatePayment(paymentId: string, weddingId: string, dto: UpdatePaymentDto) {
    const payment = await this.paymentScheduleModel.findById(paymentId);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.weddingId.toString() !== weddingId) throw new ForbiddenException();
    if (dto.concept !== undefined)  payment.concept  = dto.concept;
    if (dto.amount !== undefined)   payment.amount   = dto.amount;
    if (dto.dueDate !== undefined)  payment.dueDate  = new Date(dto.dueDate);
    if (dto.notes !== undefined)    payment.notes    = dto.notes;
    if (dto.paid !== undefined)     payment.paidAt   = dto.paid ? (payment.paidAt || new Date()) : undefined;
    await payment.save();
    return this.paymentToResponse(payment);
  }

  async deletePayment(paymentId: string, weddingId: string): Promise<void> {
    const payment = await this.paymentScheduleModel.findById(paymentId);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.weddingId.toString() !== weddingId) throw new ForbiddenException();
    await this.paymentScheduleModel.findByIdAndDelete(paymentId);
  }

  async findAllPaymentsForCalendar(weddingId: string) {
    const [payments, categories] = await Promise.all([
      this.paymentScheduleModel
        .find({ weddingId: new Types.ObjectId(weddingId), itemId: { $exists: true } })
        .sort({ dueDate: 1 }),
      this.findCategories(weddingId),
    ]);

    if (payments.length > 0) {
      return payments.map((p) => {
        const cat = categories.find((c) => c._id.toString() === p.categoryId?.toString());
        return {
          id: p._id.toString(),
          categoryId: p.categoryId?.toString() ?? null,
          categoryName: cat?.name ?? null,
          vendorId: p.vendorId?.toString() ?? null,
          vendorName: p.vendorName || '',
          concept: p.concept,
          amount: p.amount,
          dueDate: p.dueDate.toISOString().split('T')[0],
          paid: !!p.paidAt,
          notes: p.notes,
        };
      });
    }

    const result: { id: string; categoryId: string | null; categoryName: string; vendorId: string | null; vendorName: string; concept: string; amount: number; dueDate: string; paid: boolean; notes: string | undefined }[] = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        if (!item.dueDate) continue;
        result.push({
          id: `item-${item._id.toString()}`,
          categoryId: cat._id.toString(),
          categoryName: cat.name,
          vendorId: item.vendorId?.toString() ?? null,
          vendorName: item.vendorName || cat.name,
          concept: item.concept,
          amount: item.actual || item.estimated || 0,
          dueDate: new Date(item.dueDate).toISOString().split('T')[0],
          paid: item.paid > 0 && item.paid >= (item.actual || item.estimated || 0),
          notes: item.notes,
        });
      }
    }
    return result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  async getUpcomingPayments(weddingId: string, limit = 5) {
    const payments = await this.paymentScheduleModel
      .find({ weddingId: new Types.ObjectId(weddingId), itemId: { $exists: true }, paidAt: { $exists: false } })
      .sort({ dueDate: 1 }).limit(limit);
    if (payments.length > 0) {
      const categories = await this.findCategories(weddingId);
      return payments.map((p) => {
        const cat = categories.find((c) => c._id.toString() === p.categoryId?.toString());
        return { id: p._id.toString(), vendorName: cat?.name || p.vendorName || '', concept: p.concept, amount: p.amount, dueDate: p.dueDate.toISOString().split('T')[0], paid: false, notes: p.notes ?? null };
      });
    }
    const categories = await this.findCategories(weddingId);
    const items: { id: string; vendorName: string; concept: string; amount: number; dueDate: string; paid: boolean; notes: string | null }[] = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        if (!item.dueDate) continue;
        if (item.actual > 0 && item.paid >= item.actual) continue;
        items.push({ id: item._id.toString(), vendorName: cat.name, concept: item.concept, amount: item.actual > 0 ? item.actual : item.estimated, dueDate: new Date(item.dueDate).toISOString().split('T')[0], paid: false, notes: item.notes ?? null });
      }
    }
    items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return items.slice(0, limit);
  }

  async findPaymentsByVendor(weddingId: string, vendorId: string) {
    const categories = await this.categoryModel.find({ weddingId: new Types.ObjectId(weddingId), 'items.vendorId': new Types.ObjectId(vendorId) });
    const linkedItems: { catId: string; itemId: string; concept: string; real: number }[] = [];
    const itemIds: Types.ObjectId[] = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        if (item.vendorId?.toString() !== vendorId) continue;
        linkedItems.push({ catId: cat._id.toString(), itemId: item._id.toString(), concept: item.concept, real: item.actual });
        itemIds.push(item._id);
      }
    }
    if (linkedItems.length === 0) return { isLinked: false, linkedItems: [], payments: [] };
    const payments = await this.paymentScheduleModel
      .find({ weddingId: new Types.ObjectId(weddingId), itemId: { $in: itemIds } })
      .sort({ dueDate: 1 });
    return { isLinked: true, linkedItems, payments: payments.map((p) => this.paymentToResponse(p)) };
  }

  paymentToResponse(payment: PaymentSchedule) {
    return {
      id: (payment._id as Types.ObjectId).toString(),
      itemId: payment.itemId?.toString() ?? null,
      categoryId: payment.categoryId?.toString() ?? null,
      concept: payment.concept,
      amount: payment.amount,
      dueDate: payment.dueDate.toISOString().split('T')[0],
      paid: !!payment.paidAt,
      notes: payment.notes ?? null,
    };
  }
}
