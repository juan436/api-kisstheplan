import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note } from './schemas/note.schema';
import { CreateNoteDto, UpdateNoteDto, AddColorDto, AddCategoryDto, AddImageDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private noteModel: Model<Note>) {}

  private validateWeddingId(weddingId: string | null) {
    if (!weddingId) {
      throw new BadRequestException('Debes crear tu boda primero antes de usar las notas');
    }
  }

  async findAll(weddingId: string | null) {
    this.validateWeddingId(weddingId);
    return this.noteModel.find({ weddingId: new Types.ObjectId(weddingId!) }).sort({ createdAt: -1 });
  }

  async findOne(id: string, weddingId: string | null) {
    this.validateWeddingId(weddingId);
    const note = await this.noteModel.findOne({
      _id: new Types.ObjectId(id),
      weddingId: new Types.ObjectId(weddingId!),
    });
    if (!note) throw new NotFoundException('Nota no encontrada');
    return note;
  }

  async create(weddingId: string | null, dto: CreateNoteDto) {
    this.validateWeddingId(weddingId);
    return this.noteModel.create({
      weddingId: new Types.ObjectId(weddingId!),
      type: dto.type,
      title: dto.title,
      vendorId: dto.vendorId ? new Types.ObjectId(dto.vendorId) : null,
      content: dto.content || '',
      colorPalette: [],
      categories: dto.type === 'moodboard' ? [
        { _id: new Types.ObjectId(), name: 'Ceremonia', images: [], order: 0 },
        { _id: new Types.ObjectId(), name: 'Aperitivo', images: [], order: 1 },
        { _id: new Types.ObjectId(), name: 'Cena', images: [], order: 2 },
      ] : [],
    });
  }

  async update(id: string, weddingId: string | null, dto: UpdateNoteDto) {
    this.validateWeddingId(weddingId);
    const note = await this.noteModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(weddingId!) },
      { $set: dto },
      { new: true },
    );
    if (!note) throw new NotFoundException('Nota no encontrada');
    return note;
  }

  async delete(id: string, weddingId: string | null) {
    this.validateWeddingId(weddingId);
    const result = await this.noteModel.deleteOne({
      _id: new Types.ObjectId(id),
      weddingId: new Types.ObjectId(weddingId!),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Nota no encontrada');
  }

  // ─── Color Palette ───────────────────────────────────────────────────────────

  async addColor(noteId: string, weddingId: string | null, dto: AddColorDto) {
    const note = await this.findOne(noteId, weddingId);
    note.colorPalette.push({
      _id: new Types.ObjectId(),
      hexColor: dto.hexColor,
      name: dto.name,
      order: note.colorPalette.length,
    } as any);
    await note.save();
    return note;
  }

  async removeColor(noteId: string, colorId: string, weddingId: string | null) {
    const note = await this.findOne(noteId, weddingId);
    note.colorPalette = note.colorPalette.filter((c) => c._id.toString() !== colorId) as any;
    await note.save();
    return note;
  }

  // ─── Moodboard Categories ────────────────────────────────────────────────────

  async addCategory(noteId: string, weddingId: string | null, dto: AddCategoryDto) {
    const note = await this.findOne(noteId, weddingId);
    note.categories.push({
      _id: new Types.ObjectId(),
      name: dto.name,
      images: [],
      order: note.categories.length,
    } as any);
    await note.save();
    return note;
  }

  async removeCategory(noteId: string, categoryId: string, weddingId: string | null) {
    const note = await this.findOne(noteId, weddingId);
    note.categories = note.categories.filter((c) => c._id.toString() !== categoryId) as any;
    await note.save();
    return note;
  }

  async addImage(noteId: string, categoryId: string, weddingId: string | null, dto: AddImageDto) {
    const note = await this.findOne(noteId, weddingId);
    const category = note.categories.find((c) => c._id.toString() === categoryId);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    category.images.push({
      _id: new Types.ObjectId(),
      url: dto.url,
      caption: dto.caption,
      order: category.images.length,
    } as any);
    await note.save();
    return note;
  }

  async removeImage(noteId: string, categoryId: string, imageId: string, weddingId: string | null) {
    const note = await this.findOne(noteId, weddingId);
    const category = note.categories.find((c) => c._id.toString() === categoryId);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    category.images = category.images.filter((img) => img._id.toString() !== imageId) as any;
    await note.save();
    return note;
  }

  toResponse(note: Note) {
    const n = note as any;
    return {
      id: n._id.toString(),
      type: note.type,
      title: note.title,
      vendorId: note.vendorId ? note.vendorId.toString() : null,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      colorPalette: (note.colorPalette || []).map((c) => ({
        id: c._id.toString(),
        hexColor: c.hexColor,
        name: c.name,
        order: c.order,
      })),
      categories: (note.categories || []).map((cat) => ({
        id: cat._id.toString(),
        name: cat.name,
        order: cat.order,
        images: (cat.images || []).map((img) => ({
          id: img._id.toString(),
          url: img.url,
          caption: img.caption,
          order: img.order,
        })),
      })),
    };
  }
}
