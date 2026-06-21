import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMine(@CurrentUser('weddingId') weddingId: string | null) {
    if (!weddingId) return null;
    const sub = await this.subscriptionService.findByWeddingId(weddingId);
    if (!sub) return null;
    return this.subscriptionService.toResponse(sub);
  }
}
