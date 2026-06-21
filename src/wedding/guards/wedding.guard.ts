import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { WeddingService } from '../wedding.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class WeddingGuard implements CanActivate {
  constructor(private weddingService: WeddingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: AuthUser; wedding: unknown }>();
    const { weddingId } = request.user;
    if (!weddingId) throw new NotFoundException('No tienes boda creada');
    const wedding = await this.weddingService.findById(weddingId);
    if (!wedding) throw new NotFoundException('Boda no encontrada');
    request.wedding = wedding;
    return true;
  }
}
