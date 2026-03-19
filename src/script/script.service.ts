import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScriptEntry } from './schemas/script-entry.schema';
import { ScriptArea } from './schemas/script-area.schema';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { CreateAreaDto } from './dto/create-area.dto';

const DEFAULT_TEMPLATE: Omit<CreateEntryDto, 'order'>[] = [
  { timeType: 'exact', timeStart: '09:00', title: 'Maquillaje y peluquería', description: 'Preparativos de los novios', style: {} },
  { timeType: 'exact', timeStart: '17:00', title: 'Llegada de invitados', description: 'Recepción en la entrada', style: {} },
  { timeType: 'range', timeStart: '17:30', timeEnd: '18:15', title: 'Ceremonia', description: 'Intercambio de votos y anillos', style: {} },
  { timeType: 'range', timeStart: '18:30', timeEnd: '20:00', title: 'Banquete y cocktail', description: 'Cóctel de bienvenida y aperitivos', style: {} },
  { timeType: 'exact', timeStart: '20:00', title: 'Cena', description: 'Menú degustación', style: {} },
  { timeType: 'exact', timeStart: '22:30', title: 'Corte de tarta', description: '', style: {} },
  { timeType: 'exact', timeStart: '23:00', title: 'Fiesta y barra libre', description: 'Primer baile y celebración', style: {} },
];

@Injectable()
export class ScriptService {
  constructor(
    @InjectModel(ScriptEntry.name) private entryModel: Model<ScriptEntry>,
    @InjectModel(ScriptArea.name) private areaModel: Model<ScriptArea>,
  ) {}

  // --- Entries ---

  async findEntries(weddingId: string) {
    return this.entryModel
      .find({ weddingId: new Types.ObjectId(weddingId) })
      .sort({ order: 1 });
  }

  async createEntry(weddingId: string, dto: CreateEntryDto) {
    const count = await this.entryModel.countDocuments({ weddingId: new Types.ObjectId(weddingId) });
    return this.entryModel.create({
      ...dto,
      weddingId: new Types.ObjectId(weddingId),
      order: dto.order ?? count,
    });
  }

  async updateEntry(id: string, weddingId: string, dto: UpdateEntryDto) {
    const entry = await this.entryModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(weddingId) },
      { $set: dto },
      { new: true },
    );
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    return entry;
  }

  async deleteEntry(id: string, weddingId: string) {
    const result = await this.entryModel.deleteOne({
      _id: new Types.ObjectId(id),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Entrada no encontrada');
  }

  async reorderEntries(weddingId: string, ids: string[]) {
    const wid = new Types.ObjectId(weddingId);
    await Promise.all(
      ids.map((id, index) =>
        this.entryModel.updateOne(
          { _id: new Types.ObjectId(id), weddingId: wid },
          { $set: { order: index } },
        ),
      ),
    );
    return this.findEntries(weddingId);
  }

  async seedTemplate(weddingId: string) {
    const existing = await this.entryModel.countDocuments({
      weddingId: new Types.ObjectId(weddingId),
    });
    if (existing > 0) return; // don't overwrite
    const entries = DEFAULT_TEMPLATE.map((e, i) => ({
      ...e,
      weddingId: new Types.ObjectId(weddingId),
      order: i,
    }));
    return this.entryModel.insertMany(entries);
  }

  // --- Areas ---

  async findAreas(weddingId: string) {
    return this.areaModel
      .find({ weddingId: new Types.ObjectId(weddingId) })
      .sort({ order: 1 });
  }

  async createArea(weddingId: string, dto: CreateAreaDto) {
    const count = await this.areaModel.countDocuments({ weddingId: new Types.ObjectId(weddingId) });
    return this.areaModel.create({
      ...dto,
      weddingId: new Types.ObjectId(weddingId),
      order: dto.order ?? count,
    });
  }

  async updateArea(id: string, weddingId: string, dto: Partial<CreateAreaDto>) {
    const area = await this.areaModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(weddingId) },
      { $set: dto },
      { new: true },
    );
    if (!area) throw new NotFoundException('Área no encontrada');
    return area;
  }

  async deleteArea(id: string, weddingId: string) {
    const result = await this.areaModel.deleteOne({
      _id: new Types.ObjectId(id),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Área no encontrada');
  }

  // --- Response mappers ---

  entryToResponse(entry: ScriptEntry) {
    return {
      id: (entry as any)._id.toString(),
      timeType: entry.timeType,
      timeStart: entry.timeStart,
      timeEnd: entry.timeEnd,
      title: entry.title,
      description: entry.description,
      style: entry.style,
      order: entry.order,
    };
  }

  areaToResponse(area: ScriptArea) {
    return {
      id: (area as any)._id.toString(),
      name: area.name,
      imageUrl: area.imageUrl,
      order: area.order,
    };
  }
}
