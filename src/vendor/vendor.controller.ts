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
import { WeddingGuard } from '../wedding/guards/wedding.guard';
import { CurrentWeddingId } from '../common/decorators/current-wedding-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard, WeddingGuard)
@ApiBearerAuth()
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  async findAll(@CurrentWeddingId() weddingId: string) {
    return this.vendorService.findAll(weddingId);
  }

  @Post()
  async create(@CurrentWeddingId() weddingId: string, @Body() dto: CreateVendorDto) {
    return this.vendorService.create(weddingId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentWeddingId() weddingId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorService.update(weddingId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentWeddingId() weddingId: string, @Param('id') id: string) {
    return this.vendorService.remove(weddingId, id);
  }

  // Payments
  @Post(':id/payments')
  async addPayment(
    @CurrentWeddingId() weddingId: string,
    @Param('id') id: string,
    @Body() dto: CreateVendorPaymentDto,
  ) {
    return this.vendorService.addPayment(weddingId, id, dto);
  }

  @Patch(':id/payments/:paymentId')
  async updatePayment(
    @CurrentWeddingId() weddingId: string,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdateVendorPaymentDto,
  ) {
    return this.vendorService.updatePayment(weddingId, id, paymentId, dto);
  }

  @Delete(':id/payments/:paymentId')
  async deletePayment(
    @CurrentWeddingId() weddingId: string,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.vendorService.deletePayment(weddingId, id, paymentId);
  }

  // Activity
  @Post(':id/activity')
  async addActivity(
    @CurrentWeddingId() weddingId: string,
    @Param('id') id: string,
    @Body() dto: CreateVendorActivityDto,
    @CurrentUser() user: { name: string },
  ) {
    return this.vendorService.addActivity(weddingId, id, dto, user.name);
  }
}
