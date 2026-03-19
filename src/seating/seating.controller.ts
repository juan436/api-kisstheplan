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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WeddingService } from '../wedding/wedding.service';

@ApiTags('Seating')
@Controller('seating')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SeatingController {
  constructor(
    private seatingService: SeatingService,
    private weddingService: WeddingService,
  ) {}

  // --- Plans ---

  @Get('plans')
  async getPlans(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const plans = await this.seatingService.findPlans(wedding._id.toString());
    return plans.map((p) => this.seatingService.toResponse(p));
  }

  @Post('plans')
  async createPlan(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePlanDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const plan = await this.seatingService.createPlan(wedding._id.toString(), dto);
    return this.seatingService.toResponse(plan);
  }

  @Patch('plans/:planId')
  async updatePlan(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const plan = await this.seatingService.updatePlan(planId, wedding._id.toString(), dto);
    return this.seatingService.toResponse(plan);
  }

  @Delete('plans/:planId')
  async deletePlan(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.seatingService.deletePlan(planId, wedding._id.toString());
    return { message: 'Plan de mesas eliminado' };
  }

  // --- Tables ---

  @Post('plans/:planId/tables')
  async addTable(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Body() dto: CreateTableDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const plan = await this.seatingService.addTable(planId, wedding._id.toString(), dto);
    return this.seatingService.toResponse(plan);
  }

  @Patch('plans/:planId/tables/:tableId')
  async updateTable(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Param('tableId') tableId: string,
    @Body() dto: UpdateTableDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const plan = await this.seatingService.updateTable(planId, tableId, wedding._id.toString(), dto);
    return this.seatingService.toResponse(plan);
  }

  @Delete('plans/:planId/tables/:tableId')
  async deleteTable(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Param('tableId') tableId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const plan = await this.seatingService.deleteTable(planId, tableId, wedding._id.toString());
    return this.seatingService.toResponse(plan);
  }

  // --- Seat Assignments ---

  @Patch('plans/:planId/tables/:tableId/seats/:seatNumber')
  async assignSeat(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Param('tableId') tableId: string,
    @Param('seatNumber', ParseIntPipe) seatNumber: number,
    @Body() dto: AssignSeatDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const plan = await this.seatingService.assignGuest(
      planId,
      tableId,
      seatNumber,
      wedding._id.toString(),
      dto.guestId,
    );
    return this.seatingService.toResponse(plan);
  }
}
