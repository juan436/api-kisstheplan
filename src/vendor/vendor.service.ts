import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vendor } from './schemas/vendor.schema';
import { ExpenseCategory } from '../budget/schemas/expense-category.schema';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateVendorPaymentDto, UpdateVendorPaymentDto } from './dto/vendor-payment.dto';
import { CreateVendorActivityDto } from './dto/vendor-activity.dto';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor.name) private vendorModel: Model<Vendor>,
    @InjectModel(ExpenseCategory.name) private categoryModel: Model<ExpenseCategory>,
  ) {}

  private toResponse(vendor: Vendor) {
    const obj = vendor.toObject({ virtuals: false });
    return {
      id: obj._id.toString(),
      name: obj.name,
      categories: obj.categories,
      status: obj.status,
      contactName: obj.contactName,
      email: obj.email,
      phone: obj.phone,
      web: obj.web,
      social: obj.social,
      contractUrl: obj.contractUrl,
      needsStaffMenu: obj.needsStaffMenu,
      staffCount: obj.staffCount,
      staffAllergies: obj.staffAllergies,
      notes: obj.notes,
      totalAmount: obj.totalAmount,
      payments: (obj.payments || []).map((p: any) => ({
        id: p._id.toString(),
        amount: p.amount,
        dueDate: p.dueDate ? (p.dueDate instanceof Date ? p.dueDate.toISOString().split('T')[0] : p.dueDate) : null,
        paid: p.paid,
        notes: p.notes,
      })),
      activity: (obj.activity || []).map((a: any) => ({
        id: a._id.toString(),
        type: a.type,
        content: a.content,
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        author: a.author,
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
      })),
    };
  }

  /** For each vendor category, find-or-create a budget category and add an item linked to this vendor. */
  private async syncBudget(weddingId: string, vendorId: string, vendorName: string, categories: string[]) {
    const weddingOid = new Types.ObjectId(weddingId);
    const vendorOid = new Types.ObjectId(vendorId);

    for (const catName of categories) {
      // Find existing category (case-insensitive)
      let cat = await this.categoryModel.findOne({
        weddingId: weddingOid,
        name: { $regex: new RegExp(`^${catName}$`, 'i') },
      });

      // Create category if it doesn't exist
      if (!cat) {
        const count = await this.categoryModel.countDocuments({ weddingId: weddingOid });
        cat = await this.categoryModel.create({ weddingId: weddingOid, name: catName, order: count });
      }

      // Check if an item for this vendor already exists in this category
      const alreadyLinked = cat.items.some(
        (item: any) => item.vendorId?.toString() === vendorId,
      );
      if (alreadyLinked) continue;

      // Add item linked to vendor
      cat.items.push({ concept: vendorName, estimated: 0, actual: 0, paid: 0, vendorId: vendorOid, vendorName } as any);
      await cat.save();
    }
  }

  async findAll(weddingId: string) {
    const vendors = await this.vendorModel
      .find({ weddingId: new Types.ObjectId(weddingId) })
      .sort({ createdAt: -1 })
      .exec();
    return vendors.map((v) => this.toResponse(v));
  }

  async create(weddingId: string, dto: CreateVendorDto) {
    const vendor = await this.vendorModel.create({
      weddingId: new Types.ObjectId(weddingId),
      ...dto,
    });
    try {
      await this.syncBudget(weddingId, vendor._id.toString(), vendor.name, vendor.categories);
    } catch (e) {
      console.error('[VendorService] Budget sync error:', e);
    }
    return this.toResponse(vendor);
  }

  async update(weddingId: string, vendorId: string, dto: UpdateVendorDto) {
    const vendor = await this.vendorModel.findOneAndUpdate(
      { _id: new Types.ObjectId(vendorId), weddingId: new Types.ObjectId(weddingId) },
      { $set: dto },
      { new: true },
    );
    if (!vendor) throw new NotFoundException('Vendor not found');
    return this.toResponse(vendor);
  }

  async remove(weddingId: string, vendorId: string) {
    const result = await this.vendorModel.deleteOne({
      _id: new Types.ObjectId(vendorId),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Vendor not found');
  }

  // Payments
  async addPayment(weddingId: string, vendorId: string, dto: CreateVendorPaymentDto) {
    const vendor = await this.vendorModel.findOne({
      _id: new Types.ObjectId(vendorId),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    vendor.payments.push({
      amount: dto.amount,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      paid: false,
      notes: dto.notes || '',
    } as any);
    await vendor.save();
    return this.toResponse(vendor);
  }

  async updatePayment(weddingId: string, vendorId: string, paymentId: string, dto: UpdateVendorPaymentDto) {
    const vendor = await this.vendorModel.findOne({
      _id: new Types.ObjectId(vendorId),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    const payment = vendor.payments.find((p) => p._id.toString() === paymentId);
    if (!payment) throw new NotFoundException('Payment not found');
    if (dto.amount !== undefined) payment.amount = dto.amount;
    if (dto.dueDate !== undefined) payment.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    if (dto.paid !== undefined) payment.paid = dto.paid;
    if (dto.notes !== undefined) payment.notes = dto.notes;
    await vendor.save();
    return this.toResponse(vendor);
  }

  async deletePayment(weddingId: string, vendorId: string, paymentId: string) {
    const vendor = await this.vendorModel.findOne({
      _id: new Types.ObjectId(vendorId),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    vendor.payments = vendor.payments.filter((p) => p._id.toString() !== paymentId) as any;
    await vendor.save();
    return this.toResponse(vendor);
  }

  // Activity
  async addActivity(weddingId: string, vendorId: string, dto: CreateVendorActivityDto) {
    const vendor = await this.vendorModel.findOne({
      _id: new Types.ObjectId(vendorId),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    vendor.activity.unshift({
      type: dto.type,
      content: dto.content,
      fileUrl: dto.fileUrl,
      fileName: dto.fileName,
      author: 'Tú',
      createdAt: new Date(),
    } as any);
    await vendor.save();
    return this.toResponse(vendor);
  }
}
