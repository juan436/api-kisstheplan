import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeddingGuard } from '../wedding/guards/wedding.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentWeddingId } from '../common/decorators/current-wedding-id.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CollaboratorService } from './collaborator.service';
import { InviteCollaboratorDto } from './dto/invite-collaborator.dto';
import { CreateManualCollaboratorDto } from './dto/create-manual-collaborator.dto';

/** Rutas que requieren boda activa (owner o colaborador ya aceptado) */
@ApiTags('collaborators')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WeddingGuard)
@Controller('collaborators')
export class CollaboratorController {
  constructor(private readonly service: CollaboratorService) {}

  @Get()
  findAll(@CurrentWeddingId() weddingId: string) {
    return this.service.findAll(weddingId);
  }

  @Post('invite')
  invite(@CurrentWeddingId() weddingId: string, @Body() dto: InviteCollaboratorDto) {
    return this.service.invite(weddingId, dto.email);
  }

  @Post('create-manual')
  createManual(@CurrentWeddingId() weddingId: string, @Body() dto: CreateManualCollaboratorDto) {
    return this.service.createManual(weddingId, dto.email, dto.password, dto.name);
  }

  @Delete(':id')
  revoke(@CurrentWeddingId() weddingId: string, @Param('id') id: string) {
    return this.service.revoke(weddingId, id);
  }
}

/** Rutas de aceptación: solo JWT (el usuario puede no tener boda todavía) */
@ApiTags('collaborators')
@Controller('collaborators')
export class CollaboratorPublicController {
  constructor(private readonly service: CollaboratorService) {}

  @Get('invite-info/:token')
  getInviteInfo(@Param('token') token: string) {
    return this.service.getInviteInfo(token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('accept/:token')
  accept(@Param('token') token: string, @CurrentUser() user: AuthUser) {
    return this.service.accept(token, user.id);
  }
}
