import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WeddingService } from '../wedding.service';

@Injectable()
export class WeddingGuard implements CanActivate {
  constructor(private weddingService: WeddingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: { id: string }; wedding: unknown }>();
    request.wedding = await this.weddingService.findByUserId(request.user.id);
    return true;
  }
}
