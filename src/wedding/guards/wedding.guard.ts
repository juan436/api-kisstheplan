import { Injectable, CanActivate, ExecutionContext, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WeddingService } from '../wedding.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { SubscriptionService } from '../../subscription/subscription.service';

@Injectable()
export class WeddingGuard implements CanActivate {
  constructor(
    private weddingService: WeddingService,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: AuthUser; wedding: unknown }>();
    const { weddingId } = request.user;
    if (!weddingId) throw new NotFoundException('No tienes boda creada');
    const wedding = await this.weddingService.findById(weddingId);
    if (!wedding) throw new NotFoundException('Boda no encontrada');

    const sub = await this.subscriptionService.findByWeddingId(weddingId);
    if (sub && sub.status === 'expired') {
      throw new ForbiddenException('SUBSCRIPTION_EXPIRED');
    }

    request.wedding = wedding;
    return true;
  }
}
