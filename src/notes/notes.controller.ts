import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateNoteDto, UpdateNoteDto, AddColorDto, AddCategoryDto, AddImageDto } from './dto/note.dto';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    const notes = await this.notesService.findAll(user.weddingId);
    return notes.map((n) => this.notesService.toResponse(n));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const note = await this.notesService.findOne(id, user.weddingId);
    return this.notesService.toResponse(note);
  }

  @Post()
  async create(@Body() dto: CreateNoteDto, @CurrentUser() user: any) {
    const note = await this.notesService.create(user.weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateNoteDto, @CurrentUser() user: any) {
    const note = await this.notesService.update(id, user.weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.notesService.delete(id, user.weddingId);
    return { success: true };
  }

  // Colors
  @Post(':id/colors')
  async addColor(@Param('id') id: string, @Body() dto: AddColorDto, @CurrentUser() user: any) {
    const note = await this.notesService.addColor(id, user.weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Delete(':id/colors/:colorId')
  async removeColor(@Param('id') id: string, @Param('colorId') colorId: string, @CurrentUser() user: any) {
    const note = await this.notesService.removeColor(id, colorId, user.weddingId);
    return this.notesService.toResponse(note);
  }

  // Categories
  @Post(':id/categories')
  async addCategory(@Param('id') id: string, @Body() dto: AddCategoryDto, @CurrentUser() user: any) {
    const note = await this.notesService.addCategory(id, user.weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Delete(':id/categories/:categoryId')
  async removeCategory(@Param('id') id: string, @Param('categoryId') categoryId: string, @CurrentUser() user: any) {
    const note = await this.notesService.removeCategory(id, categoryId, user.weddingId);
    return this.notesService.toResponse(note);
  }

  // Images
  @Post(':id/categories/:categoryId/images')
  async addImage(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: AddImageDto,
    @CurrentUser() user: any,
  ) {
    const note = await this.notesService.addImage(id, categoryId, user.weddingId, dto);
    return this.notesService.toResponse(note);
  }

  @Delete(':id/categories/:categoryId/images/:imageId')
  async removeImage(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: any,
  ) {
    const note = await this.notesService.removeImage(id, categoryId, imageId, user.weddingId);
    return this.notesService.toResponse(note);
  }
}
