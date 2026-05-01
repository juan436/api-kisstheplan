import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExpenseCategory, ExpenseItem } from './schemas/expense-category.schema';
import { PaymentSchedule } from './schemas/payment-schedule.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class BudgetCategoryService {
  constructor(
    @InjectModel(ExpenseCategory.name) private categoryModel: Model<ExpenseCategory>,
    @InjectModel(PaymentSchedule.name) private paymentScheduleModel: Model<PaymentSchedule>,
  ) {}

  async findCategories(weddingId: string): Promise<ExpenseCategory[]> {
    return this.categoryModel.find({ weddingId: new Types.ObjectId(weddingId) }).sort({ order: 1 });
  }

  async findCategoriesWithPaid(weddingId: string) {
    const [categories, payments] = await Promise.all([
      this.findCategories(weddingId),
      this.paymentScheduleModel.find({ weddingId: new Types.ObjectId(weddingId) }),
    ]);
    return categories.map((cat) => this.mapCategoryWithPaid(cat, payments));
  }

  async createCategory(weddingId: string, dto: CreateCategoryDto): Promise<ExpenseCategory> {
    const count = await this.categoryModel.countDocuments({ weddingId: new Types.ObjectId(weddingId) });
    return this.categoryModel.create({ weddingId: new Types.ObjectId(weddingId), name: dto.name, order: dto.order ?? count });
  }

  async updateCategory(categoryId: string, weddingId: string, dto: UpdateCategoryDto): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    return (await this.categoryModel.findByIdAndUpdate(categoryId, dto, { new: true }))!;
  }

  async deleteCategory(categoryId: string, weddingId: string): Promise<void> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    await this.categoryModel.findByIdAndDelete(categoryId);
    await this.paymentScheduleModel.deleteMany({ categoryId: new Types.ObjectId(categoryId) });
  }

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
    } as ExpenseItem);
    await cat.save();
    return cat;
  }

  async updateItem(categoryId: string, itemId: string, weddingId: string, dto: UpdateItemDto): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    const item = cat.items.find((i) => i._id.toString() === itemId);
    if (!item) throw new NotFoundException('Item no encontrado');
    if (dto.concept !== undefined)    item.concept    = dto.concept;
    if (dto.estimated !== undefined)  item.estimated  = dto.estimated;
    if (dto.actual !== undefined)     item.actual     = dto.actual;
    if (dto.paid !== undefined)       item.paid       = dto.paid;
    if (dto.dueDate !== undefined)    item.dueDate    = dto.dueDate ? new Date(dto.dueDate) : undefined;
    if (dto.notes !== undefined)      item.notes      = dto.notes;
    if (dto.vendorId !== undefined)   item.vendorId   = dto.vendorId ? new Types.ObjectId(dto.vendorId) : undefined;
    if (dto.vendorName !== undefined) item.vendorName = dto.vendorName;
    await cat.save();
    return cat;
  }

  async deleteItem(categoryId: string, itemId: string, weddingId: string): Promise<ExpenseCategory> {
    const cat = await this.categoryModel.findById(categoryId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    if (cat.weddingId.toString() !== weddingId) throw new ForbiddenException();
    cat.items = cat.items.filter((i) => i._id.toString() !== itemId);
    await cat.save();
    await this.paymentScheduleModel.deleteMany({ itemId: new Types.ObjectId(itemId) });
    return cat;
  }

  categoryToResponse(cat: ExpenseCategory) {
    return this.mapCategoryWithPaid(cat, []);
  }

  mapCategoryWithPaid(cat: ExpenseCategory, payments: PaymentSchedule[]) {
    return {
      id: cat._id.toString(),
      name: cat.name,
      items: cat.items.map((item) => {
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
}
