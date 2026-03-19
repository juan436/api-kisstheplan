import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExpenseCategory } from './schemas/expense-category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class BudgetService {
  constructor(
    @InjectModel(ExpenseCategory.name)
    private categoryModel: Model<ExpenseCategory>,
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
    if (dto.dueDate !== undefined) (item as any).dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.notes !== undefined) (item as any).notes = dto.notes;

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

  // --- Payments (from ExpenseItem.dueDate) ---

  async findAllPaymentsForCalendar(weddingId: string) {
    const categories = await this.categoryModel.find({
      weddingId: new Types.ObjectId(weddingId),
    });

    const result: Array<{
      id: string;
      categoryId: string;
      vendorName: string;
      concept: string;
      amount: number;
      dueDate: string;
      paid: boolean;
      notes?: string;
    }> = [];

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
        dueDate: item.dueDate ? item.dueDate.toISOString().split('T')[0] : null,
        notes: item.notes ?? null,
      })),
    };
  }

  async getUpcomingPayments(weddingId: string, limit = 5) {
    const categories = await this.findCategories(weddingId);

    const items: Array<{
      id: string;
      vendorName: string;
      concept: string;
      amount: number;
      dueDate: string;
      paid: boolean;
      notes: string | null;
    }> = [];

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

    items.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
    return items.slice(0, limit);
  }
}
