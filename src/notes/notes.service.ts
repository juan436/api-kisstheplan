import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note, MoodboardColor, MoodboardCategory, MoodboardImage } from './schemas/note.schema';
import { CreateNoteDto, UpdateNoteDto, AddColorDto, AddCategoryDto, AddImageDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private noteModel: Model<Note>) {}

  async findAll(weddingId: string) {
    return this.noteModel.find({ weddingId: new Types.ObjectId(weddingId) }).sort({ createdAt: -1 });
  }

  async findOne(id: string, weddingId: string) {
    const note = await this.noteModel.findOne({
      _id: new Types.ObjectId(id),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (!note) throw new NotFoundException('Nota no encontrada');
    return note;
  }

  async create(weddingId: string, dto: CreateNoteDto) {
    return this.noteModel.create({
      weddingId: new Types.ObjectId(weddingId),
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

  async update(id: string, weddingId: string, dto: UpdateNoteDto) {
    const note = await this.noteModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(weddingId) },
      { $set: dto },
      { new: true },
    );
    if (!note) throw new NotFoundException('Nota no encontrada');
    return note;
  }

  async delete(id: string, weddingId: string) {
    const result = await this.noteModel.deleteOne({
      _id: new Types.ObjectId(id),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Nota no encontrada');
  }

  // ─── Color Palette ───────────────────────────────────────────────────────────

  async addColor(noteId: string, weddingId: string, dto: AddColorDto) {
    const note = await this.findOne(noteId, weddingId);
    note.colorPalette.push({
      _id: new Types.ObjectId(),
      hexColor: dto.hexColor,
      name: dto.name,
      order: note.colorPalette.length,
    } as MoodboardColor);
    await note.save();
    return note;
  }

  async removeColor(noteId: string, colorId: string, weddingId: string) {
    const note = await this.findOne(noteId, weddingId);
    const idx = note.colorPalette.findIndex((c) => c._id.toString() === colorId);
    if (idx !== -1) note.colorPalette.splice(idx, 1);
    note.markModified('colorPalette');
    await note.save();
    return note;
  }

  // ─── Moodboard Categories ────────────────────────────────────────────────────

  async addCategory(noteId: string, weddingId: string, dto: AddCategoryDto) {
    const note = await this.findOne(noteId, weddingId);
    note.categories.push({
      _id: new Types.ObjectId(),
      name: dto.name,
      images: [],
      order: note.categories.length,
    } as MoodboardCategory);
    await note.save();
    return note;
  }

  async removeCategory(noteId: string, categoryId: string, weddingId: string) {
    const note = await this.findOne(noteId, weddingId);
    const idx = note.categories.findIndex((c) => c._id.toString() === categoryId);
    if (idx !== -1) note.categories.splice(idx, 1);
    note.markModified('categories');
    await note.save();
    return note;
  }

  async addImage(noteId: string, categoryId: string, weddingId: string, dto: AddImageDto) {
    const note = await this.findOne(noteId, weddingId);
    const category = note.categories.find((c) => c._id.toString() === categoryId);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    category.images.push({
      _id: new Types.ObjectId(),
      url: dto.url,
      caption: dto.caption,
      order: category.images.length,
    } as MoodboardImage);
    note.markModified('categories');
    await note.save();
    return note;
  }

  async removeImage(noteId: string, categoryId: string, imageId: string, weddingId: string) {
    const note = await this.findOne(noteId, weddingId);
    const category = note.categories.find((c) => c._id.toString() === categoryId);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    const imgIdx = category.images.findIndex((img) => img._id.toString() === imageId);
    if (imgIdx !== -1) category.images.splice(imgIdx, 1);
    note.markModified('categories');
    await note.save();
    return note;
  }

  toResponse(note: Note) {
    return {
      id: (note._id as Types.ObjectId).toString(),
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
