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
import { CreateItemPaymentDto } from './dto/create-item-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class BudgetService {
  constructor(
    @InjectModel(ExpenseCategory.name)
    private categoryModel: Model<ExpenseCategory>,
    @InjectModel(PaymentSchedule.name)
    private paymentScheduleModel: Model<PaymentSchedule>,
  ) {}

  // --- Categories ---

  async findCategories(weddingId: string): Promise<ExpenseCategory[]> {
    return this.categoryModel
      .find({ weddingId: new Types.ObjectId(weddingId) })
      .sort({ order: 1 });
  }

  async findCategoriesWithPaid(weddingId: string) {
    const [categories, payments] = await Promise.all([
      this.findCategories(weddingId),
      this.paymentScheduleModel.find({ weddingId: new Types.ObjectId(weddingId) }),
    ]);
    return categories.map((cat) => this.mapCategoryWithPaid(cat, payments));
  }

  async createCategory(weddingId: string, dto: CreateCategoryDto): Promise<ExpenseCategory> {
    const count = await this.categoryModel.countDocuments({
      weddingId: new Types.ObjectId(weddingId),
    });
    return this.categoryModel.create({
      weddingId: new Types.ObjectId(weddingId),
      name: dto.name,
      order: dto.order ?? count,
    });
  }

  async updateCategory(categoryId: string, weddingId: string, dto: UpdateCategoryDto): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    const updated = await this.categoryModel.findByIdAndUpdate(categoryId, dto, { new: true });
    return updated!;
  }

  async deleteCategory(categoryId: string, weddingId: string): Promise<void> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    await this.categoryModel.findByIdAndDelete(categoryId);
    await this.paymentScheduleModel.deleteMany({ categoryId: new Types.ObjectId(categoryId) });
  }

  // --- Items ---

  async addItem(categoryId: string, weddingId: string, dto: CreateItemDto): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    cat.items.push({
      concept: dto.concept,
      estimated: dto.estimated ?? 0,
      actual: dto.actual ?? 0,
      paid: dto.paid ?? 0,
      ...(dto.vendorId ? { vendorId: new Types.ObjectId(dto.vendorId) } : {}),
      ...(dto.vendorName ? { vendorName: dto.vendorName } : {}),
    } as any);
    await cat.save();
    return cat;
  }

  async updateItem(categoryId: string, itemId: string, weddingId: string, dto: UpdateItemDto): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    const item = cat.items.find((i: any) => i._id.toString() === itemId);
    if (!item) throw new NotFoundException('Item no encontrado');

    if (dto.concept !== undefined)    item.concept    = dto.concept;
    if (dto.estimated !== undefined)  item.estimated  = dto.estimated;
    if (dto.actual !== undefined)     item.actual     = dto.actual;
    if (dto.paid !== undefined)       item.paid       = dto.paid;
    if (dto.dueDate !== undefined)    (item as any).dueDate    = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.notes !== undefined)      (item as any).notes      = dto.notes;
    if (dto.vendorId !== undefined)   (item as any).vendorId   = dto.vendorId ? new Types.ObjectId(dto.vendorId) : null;
    if (dto.vendorName !== undefined) (item as any).vendorName = dto.vendorName;

    await cat.save();
    return cat;
  }

  async deleteItem(categoryId: string, itemId: string, weddingId: string): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    cat.items = cat.items.filter((i: any) => i._id.toString() !== itemId) as any;
    await cat.save();
    await this.paymentScheduleModel.deleteMany({ itemId: new Types.ObjectId(itemId) });
    return cat;
  }

  // --- Item Payments (PaymentSchedule) ---

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
    const item = cat.items.find((i: any) => i._id.toString() === itemId);
    if (!item) throw new NotFoundException('Item no encontrado');

    const vendorId = (item as any).vendorId ?? undefined;
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
    if (dto.paid !== undefined)     payment.paidAt   = dto.paid ? (payment.paidAt || new Date()) : (undefined as any);

    await payment.save();
    return this.paymentToResponse(payment);
  }

  async deletePayment(paymentId: string, weddingId: string): Promise<void> {
    const payment = await this.paymentScheduleModel.findById(paymentId);
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.weddingId.toString() !== weddingId) throw new ForbiddenException();
    await this.paymentScheduleModel.findByIdAndDelete(paymentId);
  }

  // --- Summary ---

  async getSummary(weddingId: string) {
    const [categories, payments] = await Promise.all([
      this.findCategories(weddingId),
      this.paymentScheduleModel.find({ weddingId: new Types.ObjectId(weddingId) }),
    ]);

    let totalEstimated = 0;
    let totalReal = 0;
    let totalPaid = 0;

    for (const cat of categories) {
      for (const item of cat.items as any[]) {
        totalEstimated += item.estimated;
        totalReal += item.actual;
        const itemPayments = payments.filter((p) => p.itemId?.toString() === item._id.toString());
        totalPaid += itemPayments.length > 0
          ? itemPayments.filter((p) => !!p.paidAt).reduce((s, p) => s + p.amount, 0)
          : item.paid;
      }
    }

    return { totalEstimated, totalReal, totalPaid, totalPending: totalReal - totalPaid };
  }

  // --- Payments calendar / upcoming ---

  async findAllPaymentsForCalendar(weddingId: string) {
    const payments = await this.paymentScheduleModel
      .find({ weddingId: new Types.ObjectId(weddingId), itemId: { $exists: true } })
      .sort({ dueDate: 1 });

    if (payments.length > 0) {
      return payments.map((p) => ({
        id: p._id.toString(),
        categoryId: p.categoryId?.toString() ?? null,
        vendorName: p.vendorName || '',
        concept: p.concept,
        amount: p.amount,
        dueDate: p.dueDate.toISOString().split('T')[0],
        paid: !!p.paidAt,
        notes: p.notes,
      }));
    }

    // Fallback: legacy item.dueDate
    const categories = await this.findCategories(weddingId);
    const result: any[] = [];
    for (const cat of categories) {
      for (const item of cat.items as any[]) {
        if (!item.dueDate) continue;
        result.push({
          id: `item-${item._id.toString()}`,
          categoryId: cat._id.toString(),
          vendorName: cat.name,
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
      .sort({ dueDate: 1 })
      .limit(limit);

    if (payments.length > 0) {
      const categories = await this.findCategories(weddingId);
      return payments.map((p) => {
        const cat = categories.find((c) => c._id.toString() === p.categoryId?.toString());
        return {
          id: p._id.toString(),
          vendorName: cat?.name || p.vendorName || '',
          concept: p.concept,
          amount: p.amount,
          dueDate: p.dueDate.toISOString().split('T')[0],
          paid: false,
          notes: p.notes ?? null,
        };
      });
    }

    // Fallback: legacy item.dueDate
    const categories = await this.findCategories(weddingId);
    const items: any[] = [];
    for (const cat of categories) {
      for (const item of cat.items as any[]) {
        if (!item.dueDate) continue;
        const isPaid = item.actual > 0 && item.paid >= item.actual;
        if (isPaid) continue;
        items.push({
          id: item._id.toString(),
          vendorName: cat.name,
          concept: item.concept,
          amount: item.actual > 0 ? item.actual : item.estimated,
          dueDate: new Date(item.dueDate).toISOString().split('T')[0],
          paid: false,
          notes: item.notes ?? null,
        });
      }
    }
    items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return items.slice(0, limit);
  }

  // --- Vendor-linked payments ---

  async findPaymentsByVendor(weddingId: string, vendorId: string) {
    const categories = await this.categoryModel.find({
      weddingId: new Types.ObjectId(weddingId),
      'items.vendorId': new Types.ObjectId(vendorId),
    });

    const linkedItems: { catId: string; itemId: string; concept: string; real: number }[] = [];
    const itemIds: Types.ObjectId[] = [];

    for (const cat of categories) {
      for (const item of cat.items as any[]) {
        if (item.vendorId?.toString() === vendorId) {
          linkedItems.push({ catId: cat._id.toString(), itemId: item._id.toString(), concept: item.concept, real: item.actual });
          itemIds.push(item._id);
        }
      }
    }

    if (linkedItems.length === 0) {
      return { isLinked: false, linkedItems: [], payments: [] };
    }

    const payments = await this.paymentScheduleModel
      .find({ weddingId: new Types.ObjectId(weddingId), itemId: { $in: itemIds } })
      .sort({ dueDate: 1 });

    return { isLinked: true, linkedItems, payments: payments.map((p) => this.paymentToResponse(p)) };
  }

  // --- Response mappers ---

  categoryToResponse(cat: ExpenseCategory) {
    return this.mapCategoryWithPaid(cat, []);
  }

  private mapCategoryWithPaid(cat: ExpenseCategory, payments: PaymentSchedule[]) {
    return {
      id: cat._id.toString(),
      name: cat.name,
      items: cat.items.map((item: any) => {
        const itemPayments = payments.filter((p) => p.itemId?.toString() === item._id.toString());
        const paid = itemPayments.length > 0
          ? itemPayments.filter((p) => !!p.paidAt).reduce((s, p) => s + p.amount, 0)
          : item.paid;
        return {
          id: item._id.toString(),
          categoryId: cat._id.toString(),
          concept: item.concept,
          estimated: item.estimated,
          real: item.actual,
          paid,
          dueDate: item.dueDate ? item.dueDate.toISOString().split('T')[0] : null,
          notes: item.notes ?? null,
          vendorId: item.vendorId?.toString() ?? null,
          vendorName: item.vendorName ?? null,
        };
      }),
    };
  }

  private paymentToResponse(payment: PaymentSchedule) {
    return {
      id: (payment._id as any).toString(),
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
