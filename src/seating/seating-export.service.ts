import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import PDFDocument = require('pdfkit');
import { SeatingPlan, TableSeat, SeatAssignment } from './schemas/seating-plan.schema';
import { WeddingService } from '../wedding/wedding.service';
import { GuestService } from '../guest/guest.service';

const MOCHA = '#4A3C32', GOLD = '#C7A977', BL = '#FAF7F2', BA = '#F5EFE9', BORDER = '#D4C9B8', WHITE = '#FFFFFF';

type GuestRow = { firstName: string; lastName?: string; _id: Types.ObjectId };

@Injectable()
export class SeatingExportService {
  constructor(
    @InjectModel(SeatingPlan.name) private planModel: Model<SeatingPlan>,
    private weddingService: WeddingService,
    private guestService: GuestService,
  ) {}

  async exportPdf(planId: string, weddingId: string, imageData: string): Promise<Buffer> {
    const plan = await this.planModel.findOne({
      _id: new Types.ObjectId(planId),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (!plan) throw new NotFoundException('Plan de mesas no encontrado');

    const wedding = await this.weddingService.findById(weddingId);
    if (!wedding) throw new NotFoundException('Boda no encontrada');

    const guests = await this.guestService.findAll(weddingId, {});
    const guestMap = new Map<string, GuestRow>(
      guests.map((g) => [g._id.toString(), g as GuestRow]),
    );

    const names = `${wedding.partner1Name} & ${wedding.partner2Name}`;
    const date = wedding.date
      ? new Date(wedding.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this.drawPlanPage(doc, plan.name, names, date, imageData);
      doc.addPage({ size: 'A4', layout: 'portrait', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
      this.drawListingPages(doc, plan, guestMap, names, date);
      doc.end();
    });
  }

  private drawPlanPage(doc: PDFKit.PDFDocument, planName: string, names: string, date: string, imageData: string) {
    const [W, H, MG] = [doc.page.width, doc.page.height, 40];
    doc.rect(0, 0, W, 70).fill(MOCHA);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(20).text(names, MG, 18, { width: W - MG * 2, align: 'center' });
    doc.fillColor(GOLD).font('Helvetica').fontSize(11).text(`${planName}${date ? '  ·  ' + date : ''}`, MG, 45, { width: W - MG * 2, align: 'center' });
    if (imageData) {
      const buf = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const [iW, iH] = [W - MG * 2, H - 130];
      try { doc.image(buf, MG, 80, { width: iW, height: iH, fit: [iW, iH], align: 'center', valign: 'center' }); } catch {}
    }
    doc.fillColor(MOCHA).font('Helvetica').fontSize(8)
      .text(`Generado el ${new Date().toLocaleDateString('es-ES')} · kisstheplan.com`, MG, H - 25, { width: W - MG * 2, align: 'center' });
  }

  private drawListingPages(doc: PDFKit.PDFDocument, plan: SeatingPlan, guestMap: Map<string, GuestRow>, names: string, date: string) {
    const [W, MG] = [doc.page.width, 40];
    const COL = W - MG * 2;
    doc.rect(0, 0, W, 60).fill(MOCHA);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(16).text(names, MG, 14, { width: COL, align: 'center' });
    doc.fillColor(GOLD).font('Helvetica').fontSize(9).text(`${plan.name} — Listado por mesas${date ? '  ·  ' + date : ''}`, MG, 38, { width: COL, align: 'center' });
    let y = 80;
    for (const table of plan.tables) {
      const rows = this.resolveGuests(table, guestMap);
      if (y + 22 + Math.max(1, rows.length) * 16 + 10 > doc.page.height - 50) {
        doc.addPage({ size: 'A4', layout: 'portrait', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
        y = 40;
      }
      doc.rect(MG, y, COL, 22).fill(GOLD);
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(10).text(`${table.name}  (${rows.length}/${table.capacity})`, MG + 8, y + 6);
      y += 22;
      if (rows.length === 0) {
        doc.rect(MG, y, COL, 16).fill(BL);
        doc.fillColor(BORDER).font('Helvetica').fontSize(9).text('Sin invitados asignados', MG + 8, y + 4);
        y += 16;
      } else {
        rows.forEach((name, i) => {
          doc.rect(MG, y, COL, 16).fill(i % 2 === 0 ? BL : BA);
          doc.fillColor(MOCHA).font('Helvetica').fontSize(9).text(`${i + 1}.  ${name}`, MG + 12, y + 4);
          y += 16;
        });
      }
      y += 10;
    }
    y = this.drawSummaryFooter(doc, plan, y, MG, COL);
    doc.fillColor(MOCHA).font('Helvetica').fontSize(8)
      .text(`Generado el ${new Date().toLocaleDateString('es-ES')} · kisstheplan.com`, MG, doc.page.height - 25, { width: COL, align: 'center' });
  }

  private drawSummaryFooter(doc: PDFKit.PDFDocument, plan: SeatingPlan, y: number, MG: number, COL: number): number {
    const total = plan.tables.reduce((a, t) => a + (t.assignments ?? []).filter((x: SeatAssignment) => x.guestId).length, 0);
    const cap   = plan.tables.reduce((a, t: TableSeat) => a + (t.capacity ?? 0), 0);
    if (y + 32 > doc.page.height - 50) {
      doc.addPage({ size: 'A4', layout: 'portrait', margins: { top: 40, bottom: 40, left: 40, right: 40 } });
      y = 40;
    }
    y += 8;
    doc.rect(MG, y, COL, 24).fill(MOCHA);
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10).text(`Total: ${total} invitados / ${cap} asientos`, MG + 8, y + 7);
    return y + 24;
  }

  private resolveGuests(table: TableSeat, guestMap: Map<string, GuestRow>): string[] {
    return (table.assignments ?? [])
      .filter((a: SeatAssignment) => a.guestId)
      .map((a: SeatAssignment) => {
        const g = guestMap.get(a.guestId!.toString());
        return g ? `${g.firstName} ${g.lastName ?? ''}`.trim() : null;
      })
      .filter((n): n is string => n !== null);
  }
}
