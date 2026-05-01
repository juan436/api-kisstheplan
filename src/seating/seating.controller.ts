import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SeatingService } from './seating.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { AssignSeatDto } from './dto/assign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeddingGuard } from '../wedding/guards/wedding.guard';
import { CurrentWeddingId } from '../common/decorators/current-wedding-id.decorator';

@ApiTags('Seating')
@Controller('seating')
@UseGuards(JwtAuthGuard, WeddingGuard)
@ApiBearerAuth()
export class SeatingController {
  constructor(private seatingService: SeatingService) {}

  // --- Plans ---

  @Get('plans')
  async getPlans(@CurrentWeddingId() weddingId: string) {
    const plans = await this.seatingService.findPlans(weddingId);
    return plans.map((p) => this.seatingService.toResponse(p));
  }

  @Post('plans')
  async createPlan(
    @CurrentWeddingId() weddingId: string,
    @Body() dto: CreatePlanDto,
  ) {
    const plan = await this.seatingService.createPlan(weddingId, dto);
    return this.seatingService.toResponse(plan);
  }

  @Patch('plans/:planId')
  async updatePlan(
    @CurrentWeddingId() weddingId: string,
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const plan = await this.seatingService.updatePlan(planId, weddingId, dto);
    return this.seatingService.toResponse(plan);
  }

  @Delete('plans/:planId')
  async deletePlan(
    @CurrentWeddingId() weddingId: string,
    @Param('planId') planId: string,
  ) {
    await this.seatingService.deletePlan(planId, weddingId);
    return { message: 'Plan de mesas eliminado' };
  }

  // --- Tables ---

  @Post('plans/:planId/tables')
  async addTable(
    @CurrentWeddingId() weddingId: string,
    @Param('planId') planId: string,
    @Body() dto: CreateTableDto,
  ) {
    const plan = await this.seatingService.addTable(planId, weddingId, dto);
    return this.seatingService.toResponse(plan);
  }

  @Patch('plans/:planId/tables/:tableId')
  async updateTable(
    @CurrentWeddingId() weddingId: string,
    @Param('planId') planId: string,
    @Param('tableId') tableId: string,
    @Body() dto: UpdateTableDto,
  ) {
    const plan = await this.seatingService.updateTable(planId, tableId, weddingId, dto);
    return this.seatingService.toResponse(plan);
  }

  @Delete('plans/:planId/tables/:tableId')
  async deleteTable(
    @CurrentWeddingId() weddingId: string,
    @Param('planId') planId: string,
    @Param('tableId') tableId: string,
  ) {
    const plan = await this.seatingService.deleteTable(planId, tableId, weddingId);
    return this.seatingService.toResponse(plan);
  }

  // --- Seat Assignments ---

  @Patch('plans/:planId/tables/:tableId/seats/:seatNumber')
  async assignSeat(
    @CurrentWeddingId() weddingId: string,
    @Param('planId') planId: string,
    @Param('tableId') tableId: string,
    @Param('seatNumber', ParseIntPipe) seatNumber: number,
    @Body() dto: AssignSeatDto,
  ) {
    const plan = await this.seatingService.assignGuest(
      planId,
      tableId,
      seatNumber,
      weddingId,
      dto.guestId,
    );
    return this.seatingService.toResponse(plan);
  }
}
