import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeddingGuard } from '../wedding/guards/wedding.guard';
import { CurrentWeddingId } from '../common/decorators/current-wedding-id.decorator';
import { CreateNoteDto, UpdateNoteDto, AddColorDto, AddCategoryDto, AddImageDto } from './dto/note.dto';

@UseGuards(JwtAuthGuard, WeddingGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async findAll(@CurrentWeddingId() weddingId: string) {
    const notes = await this.notesService.findAll(weddingId);
    return notes.map((n) => this.notesService.toResponse(n));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentWeddingId() weddingId: string) {
    const note = await this.notesService.findOne(id, weddingId);
    return this.notesService.toResponse(note);
  }

  @Post()
  async create(@Body() dto: CreateNoteDto, @CurrentWeddingId() weddingId: string) {
    const note = await this.notesService.create(weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateNoteDto, @CurrentWeddingId() weddingId: string) {
    const note = await this.notesService.update(id, weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentWeddingId() weddingId: string) {
    await this.notesService.delete(id, weddingId);
    return { success: true };
  }

  @Post(':id/colors')
  async addColor(@Param('id') id: string, @Body() dto: AddColorDto, @CurrentWeddingId() weddingId: string) {
    const note = await this.notesService.addColor(id, weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Delete(':id/colors/:colorId')
  async removeColor(@Param('id') id: string, @Param('colorId') colorId: string, @CurrentWeddingId() weddingId: string) {
    const note = await this.notesService.removeColor(id, colorId, weddingId);
    return this.notesService.toResponse(note);
  }

  @Post(':id/categories')
  async addCategory(@Param('id') id: string, @Body() dto: AddCategoryDto, @CurrentWeddingId() weddingId: string) {
    const note = await this.notesService.addCategory(id, weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Delete(':id/categories/:categoryId')
  async removeCategory(@Param('id') id: string, @Param('categoryId') categoryId: string, @CurrentWeddingId() weddingId: string) {
    const note = await this.notesService.removeCategory(id, categoryId, weddingId);
    return this.notesService.toResponse(note);
  }

  @Post(':id/categories/:categoryId/images')
  async addImage(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: AddImageDto,
    @CurrentWeddingId() weddingId: string,
  ) {
    const note = await this.notesService.addImage(id, categoryId, weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Delete(':id/categories/:categoryId/images/:imageId')
  async removeImage(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Param('imageId') imageId: string,
    @CurrentWeddingId() weddingId: string,
  ) {
    const note = await this.notesService.removeImage(id, categoryId, imageId, weddingId);
    return this.notesService.toResponse(note);
  }
}
