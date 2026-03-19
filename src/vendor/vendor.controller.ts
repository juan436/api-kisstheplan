import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreateVendorPaymentDto, UpdateVendorPaymentDto } from './dto/vendor-payment.dto';
import { CreateVendorActivityDto } from './dto/vendor-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WeddingService } from '../wedding/wedding.service';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly weddingService: WeddingService,
  ) {}

  private async getWeddingId(userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return wedding._id.toString();
  }

  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    const weddingId = await this.getWeddingId(userId);
    return this.vendorService.findAll(weddingId);
  }

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateVendorDto) {
    const weddingId = await this.getWeddingId(userId);
    return this.vendorService.create(weddingId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    const weddingId = await this.getWeddingId(userId);
    return this.vendorService.update(weddingId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const weddingId = await this.getWeddingId(userId);
    return this.vendorService.remove(weddingId, id);
  }

  // Payments
  @Post(':id/payments')
  async addPayment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateVendorPaymentDto,
  ) {
    const weddingId = await this.getWeddingId(userId);
    return this.vendorService.addPayment(weddingId, id, dto);
  }

  @Patch(':id/payments/:paymentId')
  async updatePayment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdateVendorPaymentDto,
  ) {
    const weddingId = await this.getWeddingId(userId);
    return this.vendorService.updatePayment(weddingId, id, paymentId, dto);
  }

  @Delete(':id/payments/:paymentId')
  async deletePayment(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ) {
    const weddingId = await this.getWeddingId(userId);
    return this.vendorService.deletePayment(weddingId, id, paymentId);
  }

  // Activity
  @Post(':id/activity')
  async addActivity(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateVendorActivityDto,
  ) {
    const weddingId = await this.getWeddingId(userId);
    return this.vendorService.addActivity(weddingId, id, dto);
  }
}
