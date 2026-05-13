import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Note, NoteSchema } from './schemas/note.schema';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { WeddingModule } from '../wedding/wedding.module';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Note.name, schema: NoteSchema }]),
    WeddingModule,
    ExcelModule,
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
