import { Controller, Post, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('stripe/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createCheckout(
    @CurrentUser() user: AuthUser,
  ): Promise<{ url: string }> {
    const url = await this.paymentService.createCheckoutSession(user.weddingId!, user.id);
    return { url };
  }

  @Post('stripe/portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createPortal(
    @Body('stripeCustomerId') stripeCustomerId: string,
  ): Promise<{ url: string }> {
    const url = await this.paymentService.createPortalSession(stripeCustomerId);
    return { url };
  }

  @Post('stripe/webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    await this.paymentService.handleWebhook(req.body as Buffer, signature);
    return { received: true };
  }
}
