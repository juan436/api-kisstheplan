import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import * as https from 'https';
import * as http from 'http';

// Paleta Mocha & Gold
const MOCHA       = '4A3C32';
const GOLD        = 'C7A977';
const GOLD_LIGHT  = 'F0E8D8';
const WHITE       = 'FFFFFF';
const BG_LIGHT    = 'FAF7F2';
const BG_ROW_ALT  = 'F5EFE9';
const GREEN       = '7DB87D';
const RED_SOFT    = 'C47A7A';
const BORDER_CLR  = 'D4C9B8';

const ROLE_LABEL: Record<string, string> = {
  groom:        'Novio',
  bride:        'Novia',
  family_groom: 'Familia del novio',
  family_bride: 'Familia de la novia',
  child:        'Niño',
  baby:         'Bebé',
};

const thin = (color = BORDER_CLR): Partial<ExcelJS.Border> => ({ style: 'thin', color: { argb: `FF${color}` } });
const borders = (color = BORDER_CLR): Partial<ExcelJS.Borders> => ({ top: thin(color), bottom: thin(color), left: thin(color), right: thin(color) });

export interface ParsedGuest {
  firstName:       string;
  lastName?:       string;
  email?:          string;
  mealChoice?:     string;
  allergies?:      string;
  address?:        string;
  transport?:      boolean;
  listName?:       string;
  role?:           string;
  invitationSent?: boolean;
  rsvpStatus?:     string;
}

export interface GuestExportRow {
  firstName:      string;
  lastName:       string;
  email:          string;
  dish:           string;
  allergies:      string;
  address:        string;
  transport:      boolean;
  listName:       string;
  role:           string;
  group:          string;
  invitationSent: boolean;
  rsvp:           string;
}

export interface BudgetCategory {
  name: string;
  items: {
    concept:   string;
    estimated: number;
    real:      number;
    paid:      number;
  }[];
}

@Injectable()
export class ExcelService {

  async generateGuestTemplate(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'KissthePlan';
    const ws = wb.addWorksheet('Invitados');

    // Mismas columnas que la exportación para que el usuario pueda
    // exportar, editar y volver a importar el mismo archivo.
    ws.columns = [
      { header: 'Nombre',      key: '0',  width: 18 },
      { header: 'Apellidos',   key: '1',  width: 20 },
      { header: '@',           key: '2',  width: 28 },
      { header: 'Plato',       key: '3',  width: 18 },
      { header: 'Alergias',    key: '4',  width: 22 },
      { header: 'Dirección',   key: '5',  width: 24 },
      { header: 'Transporte',  key: '6',  width: 12 },
      { header: 'Lista',       key: '7',  width: 8  },
      { header: 'Rol',         key: '8',  width: 18 },
      { header: 'Grupo',       key: '9',  width: 18 },
      { header: 'Invitación',  key: '10', width: 12 },
      { header: 'RSVP',        key: '11', width: 14 },
    ];

    const hRow = ws.getRow(1);
    hRow.height = 24;
    hRow.eachCell((cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${MOCHA}` } };
      cell.font      = { bold: true, color: { argb: `FF${WHITE}` }, size: 10, name: 'Calibri' };
      cell.border    = borders(MOCHA);
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const exRow = ws.addRow(['María', 'García López', 'maria@email.com', 'Menú base', 'Sin gluten', 'Calle Mayor 1', 'No', 'A', 'Familia de la novia', '', 'No', 'Pendiente']);
    exRow.height = 20;
    exRow.eachCell((cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GOLD_LIGHT}` } };
      cell.font      = { color: { argb: `FF${MOCHA}` }, size: 10, name: 'Calibri' };
      cell.border    = borders();
      cell.alignment = { vertical: 'middle' };
    });

    const noteRow = ws.addRow(['← Ejemplo. Bórralo antes de importar.']);
    noteRow.getCell(1).font = { italic: true, color: { argb: `FF${RED_SOFT}` }, size: 9 };

    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }

  async parseGuestImport(buffer: Buffer): Promise<ParsedGuest[]> {
    const wb = new ExcelJS.Workbook();
    const ab: ArrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    await wb.xlsx.load(ab);
    const ws = wb.worksheets[0];
    if (!ws) return [];

    const headerRow = ws.getRow(1);
    const colMap: Record<string, number> = {};
    const normalizeHeader = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\*/g, '').trim();
    headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
      const val = normalizeHeader(String(cell.value ?? ''));
      if (val) colMap[val] = col;
    });

    const get = (row: ExcelJS.Row, key: string): string => {
      const col = colMap[key];
      if (!col) return '';
      const v = row.getCell(col).value;
      return v == null ? '' : String(v).trim();
    };

    // Mapa inverso de etiquetas de rol en español → enum
    const ROLE_IMPORT: Record<string, string> = {
      novio: 'groom', novia: 'bride',
      'familia del novio': 'family_groom', 'familia de la novia': 'family_bride',
      nino: 'child', bebe: 'baby',
      groom: 'groom', bride: 'bride', family_groom: 'family_groom', family_bride: 'family_bride', child: 'child', baby: 'baby',
    };
    const RSVP_IMPORT: Record<string, string> = {
      confirmado: 'confirmed', pendiente: 'pending', rechazado: 'rejected',
      confirmed: 'confirmed', pending: 'pending', rejected: 'rejected',
    };

    const guests: ParsedGuest[] = [];
    ws.eachRow((row, idx) => {
      if (idx === 1) return;
      // Nombre es la primera columna; si vacío, no es una fila de invitado
      const firstName = get(row, 'nombre');
      if (!firstName || firstName.startsWith('←')) return;

      const transportRaw = get(row, 'transporte');
      const invRaw       = get(row, 'invitacion');
      const roleRaw      = normalizeHeader(get(row, 'rol'));
      const rsvpRaw      = normalizeHeader(get(row, 'rsvp'));

      guests.push({
        firstName,
        lastName:       get(row, 'apellidos')  || undefined,
        email:          get(row, '@') || get(row, 'email') || undefined,
        mealChoice:     get(row, 'plato')      || undefined,
        allergies:      get(row, 'alergias')   || undefined,
        address:        get(row, 'direccion')  || undefined,
        transport:      /^s[ií]/i.test(transportRaw),
        listName:       get(row, 'lista')      || 'A',
        role:           ROLE_IMPORT[roleRaw]   || undefined,
        invitationSent: /^s[ií]/i.test(invRaw),
        rsvpStatus:     RSVP_IMPORT[rsvpRaw]  || 'pending',
      });
    });
    return guests;
  }

  async generateBudgetExcel(
    categories: BudgetCategory[],
    summary: { totalEstimated: number; totalReal: number; totalPaid: number },
    weddingName: string,
  ): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'KissthePlan';
    const ws = wb.addWorksheet('Presupuesto');

    // Title
    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `Presupuesto — ${weddingName}`;
    titleCell.font  = { bold: true, size: 14, name: 'Calibri', color: { argb: `FF${MOCHA}` } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GOLD_LIGHT}` } };
    ws.getRow(1).height = 32;

    ws.addRow([]); // spacer

    // Column headers
    const cols = ['Categoría', 'Concepto', 'Estimado', 'Real', 'Diferencia', 'Pagado', 'Pendiente'];
    const colW  = [22, 30, 14, 14, 14, 14, 14];
    ws.columns  = cols.map((h, i) => ({ header: '', key: String(i), width: colW[i] }));

    const hRow = ws.addRow(cols);
    hRow.height = 22;
    hRow.eachCell((cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${MOCHA}` } };
      cell.font      = { bold: true, color: { argb: `FF${WHITE}` }, size: 10, name: 'Calibri' };
      cell.border    = borders(MOCHA);
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const eur = (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    let rowIdx = 4;

    for (const cat of categories) {
      const catStart = rowIdx + 1;

      for (let i = 0; i < cat.items.length; i++) {
        const item  = cat.items[i];
        const diff  = item.estimated - item.real;
        const pend  = item.real - item.paid;
        const isAlt = i % 2 === 1;

        const row = ws.addRow([
          i === 0 ? cat.name : '',
          item.concept,
          item.estimated,
          item.real,
          diff,
          item.paid,
          pend,
        ]);
        row.height = 18;

        const bg = isAlt ? BG_ROW_ALT : BG_LIGHT;

        row.eachCell({ includeEmpty: true }, (cell, col) => {
          const isNum = col >= 3;
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${col === 1 ? GOLD_LIGHT : bg}` } };
          cell.font      = { size: 10, name: 'Calibri', color: { argb: `FF${MOCHA}` }, bold: col === 1 };
          cell.border    = borders();
          cell.alignment = { vertical: 'middle', horizontal: isNum ? 'right' : 'left' };
          if (isNum) cell.numFmt = '#,##0.00 "€"';
          // Diff en verde/rojo
          if (col === 5 && typeof cell.value === 'number') {
            cell.font = { ...cell.font, color: { argb: `FF${cell.value >= 0 ? GREEN : RED_SOFT}` }, bold: true };
          }
        });
        rowIdx++;
      }

      // Merge category column for this category's rows
      if (cat.items.length > 1) {
        ws.mergeCells(catStart, 1, rowIdx, 1);
        const mergedCell = ws.getCell(catStart, 1);
        mergedCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        mergedCell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: `FF${MOCHA}` } };
      }
    }

    // Totals row
    ws.addRow([]); rowIdx++;
    const totals = ws.addRow([
      '', 'TOTAL',
      summary.totalEstimated,
      summary.totalReal,
      summary.totalEstimated - summary.totalReal,
      summary.totalPaid,
      summary.totalReal - summary.totalPaid,
    ]);
    totals.height = 22;
    totals.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${GOLD}` } };
      cell.font   = { bold: true, color: { argb: `FF${WHITE}` }, size: 11, name: 'Calibri' };
      cell.border = borders(GOLD);
      cell.alignment = { vertical: 'middle', horizontal: col >= 3 ? 'right' : 'left' };
      if (col >= 3) cell.numFmt = '#,##0.00 "€"';
    });

    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }

  async generateGuestsExcel(guests: GuestExportRow[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'KissthePlan';
    const ws = wb.addWorksheet('Invitados');

    const RSVP_LABEL: Record<string, string> = { confirmed: 'Confirmado', pending: 'Pendiente', rejected: 'Rechazado' };
    const RSVP_COLOR: Record<string, string> = { confirmed: GREEN, pending: GOLD, rejected: RED_SOFT };

    // Columnas en el mismo orden que la tabla UI
    ws.columns = [
      { header: 'Nombre',     key: 'firstName',      width: 18 },
      { header: 'Apellidos',  key: 'lastName',        width: 20 },
      { header: '@',          key: 'email',           width: 28 },
      { header: 'Plato',      key: 'dish',            width: 18 },
      { header: 'Alergias',   key: 'allergies',       width: 20 },
      { header: 'Dirección',  key: 'address',         width: 24 },
      { header: 'Transporte', key: 'transport',       width: 12 },
      { header: 'Lista',      key: 'listName',        width: 8  },
      { header: 'Rol',        key: 'role',            width: 18 },
      { header: 'Grupo',      key: 'group',           width: 18 },
      { header: 'Invitación', key: 'invitationSent',  width: 12 },
      { header: 'RSVP',       key: 'rsvp',            width: 14 },
    ];

    const hRow = ws.getRow(1);
    hRow.height = 24;
    hRow.eachCell((cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${MOCHA}` } };
      cell.font      = { bold: true, color: { argb: `FF${WHITE}` }, size: 10, name: 'Calibri' };
      cell.border    = borders(MOCHA);
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    guests.forEach((g, idx) => {
      const rsvpLabel = RSVP_LABEL[g.rsvp] ?? g.rsvp;
      const rsvpCol   = RSVP_COLOR[g.rsvp];
      const row = ws.addRow({
        firstName:      g.firstName,
        lastName:       g.lastName,
        email:          g.email,
        dish:           g.dish,
        allergies:      g.allergies,
        address:        g.address,
        transport:      g.transport ? 'Sí' : 'No',
        listName:       g.listName,
        role:           ROLE_LABEL[g.role] ?? g.role,
        group:          g.group,
        invitationSent: g.invitationSent ? 'Sí' : 'No',
        rsvp:           rsvpLabel,
      });
      row.height = 18;
      const bg = idx % 2 === 0 ? BG_LIGHT : BG_ROW_ALT;

      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const isRsvp = col === 12;
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${isRsvp && rsvpCol ? rsvpCol : bg}` } };
        cell.font      = { size: 9, name: 'Calibri', color: { argb: isRsvp && rsvpCol ? `FF${WHITE}` : `FF${MOCHA}` } };
        cell.border    = borders();
        cell.alignment = { vertical: 'middle', horizontal: isRsvp ? 'center' : 'left' };
      });
    });

    ws.views = [{ state: 'frozen', ySplit: 1 }];
    return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
  }

  async generateGuestsPdf(guests: GuestExportRow[], weddingName: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, info: { Title: `Invitados — ${weddingName}`, Author: 'KissthePlan' } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const ML  = 30;
      const PW  = 841.89; // landscape width
      const PH  = 595.28; // landscape height
      const TW  = PW - ML * 2;
      const ROW = 22;
      const pageBottom = PH - 34;

      // 12 columnas en orden idéntico al de la tabla UI
      const COLS = [
        { label: 'Nombre',     x: 30,  w: 80  },
        { label: 'Apellidos',  x: 110, w: 80  },
        { label: 'Email',      x: 190, w: 105 },
        { label: 'Plato',      x: 295, w: 65  },
        { label: 'Alergias',   x: 360, w: 70  },
        { label: 'Dirección',  x: 430, w: 80  },
        { label: 'Tsp',        x: 510, w: 45  },
        { label: 'L',          x: 555, w: 28  },
        { label: 'Rol',        x: 583, w: 65  },
        { label: 'Grupo',      x: 648, w: 65  },
        { label: 'Inv',        x: 713, w: 45  },
        { label: 'RSVP',       x: 758, w: 54  },
      ];

      const RSVP_LABEL: Record<string, string> = { confirmed: 'Confirmado', pending: 'Pendiente', rejected: 'Rechazado' };
      const RSVP_COLOR: Record<string, string> = { confirmed: '#5a9e5a', pending: '#b8943a', rejected: '#c47a7a' };

      const txt = (text: string, x: number, y: number, opts: { w?: number; align?: 'left'|'right'|'center'; bold?: boolean; size?: number; color?: string }) => {
        doc.fillColor(opts.color ?? '#4A3C32').fontSize(opts.size ?? 7)
           .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(text, x, y, { width: opts.w ?? 80, align: opts.align ?? 'left', lineBreak: false });
      };

      let y = 0;

      const drawHeader = () => {
        doc.rect(0, 0, PW, 52).fill('#4A3C32');
        txt(weddingName,           ML, 12, { bold: true, size: 14, color: '#FFFFFF', w: TW - 120 });
        txt('Lista de Invitados',  ML, 32, { size: 8,  color: '#C7A977', w: 200 });
        txt(`${guests.length} invitados`, PW - ML - 110, 20, { size: 8, color: '#C7A977', w: 110, align: 'right' });
        txt('KissthePlan',         PW - ML - 110, 34, { size: 7, color: '#ffffff', w: 110, align: 'right' });
        y = 64;

        doc.rect(ML, y, TW, ROW + 2).fill('#4A3C32');
        COLS.forEach(({ label, x, w }) =>
          txt(label, x + 2, y + 4, { bold: true, size: 6.5, color: '#FFFFFF', w: w - 2 }),
        );
        y += ROW + 2;
      };

      drawHeader();

      guests.forEach((g, idx) => {
        const cells = [
          g.firstName,
          g.lastName   || '',
          g.email      || '',
          g.dish       || '—',
          g.allergies  || '—',
          g.address    || '—',
          g.transport ? 'Sí' : 'No',
          g.listName   || 'A',
          g.role ? (ROLE_LABEL[g.role] ?? g.role) : '—',
          g.group      || '—',
          g.invitationSent ? 'Sí' : 'No',
        ];

        // Altura dinámica basada en el texto más alto de la fila
        doc.fontSize(7).font('Helvetica');
        const dynH = Math.max(ROW,
          Math.max(...COLS.slice(0, 11).map(({ w }, i) =>
            doc.heightOfString(cells[i], { width: w - 4 }),
          )) + 10,
        );

        if (y + dynH > pageBottom) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
          y = 0;
          drawHeader();
        }

        if (idx % 2 === 1) doc.rect(ML, y, TW, dynH).fill('#F5EFE9');
        doc.moveTo(ML, y).lineTo(ML + TW, y).strokeColor('#D4C9B8').lineWidth(0.3).stroke();

        cells.forEach((val, i) => {
          doc.fillColor('#4A3C32').fontSize(7).font('Helvetica')
             .text(val, COLS[i].x + 2, y + 5, { width: COLS[i].w - 4, lineBreak: true });
        });

        // RSVP badge centrado verticalmente
        const rsvpCol   = COLS[11];
        const rsvpLabel = RSVP_LABEL[g.rsvp] ?? g.rsvp;
        const rsvpColor = RSVP_COLOR[g.rsvp];
        const badgeH    = 14;
        const badgeY    = y + (dynH - badgeH) / 2;
        if (rsvpColor) {
          doc.roundedRect(rsvpCol.x + 1, badgeY, rsvpCol.w - 2, badgeH, 3).fill(rsvpColor);
          doc.fillColor('#FFFFFF').fontSize(6).font('Helvetica-Bold')
             .text(rsvpLabel, rsvpCol.x + 1, badgeY + 3, { width: rsvpCol.w - 2, align: 'center', lineBreak: false });
        } else {
          doc.fillColor('#4A3C32').fontSize(7).font('Helvetica')
             .text(rsvpLabel, rsvpCol.x + 2, y + 5, { width: rsvpCol.w - 4, lineBreak: false });
        }

        y += dynH;
      });

      doc.moveTo(ML, PH - 22).lineTo(ML + TW, PH - 22).strokeColor('#D4C9B8').lineWidth(0.5).stroke();
      txt(
        `Generado por KissthePlan  ·  ${new Date().toLocaleDateString('es-ES')}`,
        ML, PH - 14, { size: 6, color: '#9b8b7b', w: TW, align: 'center' },
      );

      doc.end();
    });
  }

  async generateBudgetPdf(
    categories: BudgetCategory[],
    summary: { totalEstimated: number; totalReal: number; totalPaid: number },
    weddingName: string,
    weddingDate?: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: { Title: `Presupuesto — ${weddingName}`, Author: 'KissthePlan' },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Constantes layout ─────────────────────────────────────────────
      const ML = 40; // margen izquierdo
      const MT = 40; // margen superior
      const PW = 595.28;
      const PH = 841.89;
      const TW = PW - ML * 2; // 515.28

      // Columnas: concepto (190) + 5 numéricas (65 c/u = 325) = 515
      const C0 = ML;           // Concepto  x=40
      const C1 = ML + 190;     // Estimado  x=230
      const C2 = ML + 255;     // Real      x=295
      const C3 = ML + 320;     // Diferencia x=360
      const C4 = ML + 385;     // Pagado    x=425
      const C5 = ML + 450;     // Pendiente x=490
      const CW_NUM = 65;       // ancho columna numérica

      const ROW = 20;
      const eur = (v: number) =>
        v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

      // Helper: texto en posición exacta, sin avanzar cursor
      const txt = (
        text: string, x: number, y: number,
        opts: { width?: number; align?: 'left'|'right'|'center'; bold?: boolean; size?: number; color?: string },
      ) => {
        doc
          .fillColor(opts.color ?? '#4A3C32')
          .fontSize(opts.size ?? 8)
          .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
          .text(text, x, y, { width: opts.width ?? 190, align: opts.align ?? 'left', lineBreak: false });
      };

      // Helper: fila numérica completa (5 valores)
      const numRow = (y: number, vals: number[], colors: (string|null)[]) => {
        const xs = [C1, C2, C3, C4, C5];
        vals.forEach((v, i) => {
          txt(eur(v), xs[i], y, { width: CW_NUM, align: 'right', color: colors[i] ?? '#4A3C32' });
        });
      };

      let y = MT;

      // ── Header bloque ─────────────────────────────────────────────────
      doc.rect(0, 0, PW, 70).fill('#4A3C32');
      txt(weddingName, ML, 18, { bold: true, size: 18, color: '#FFFFFF', width: TW - 120 });
      if (weddingDate) {
        txt(weddingDate, ML, 44, { size: 9, color: '#C7A977', width: 250 });
      }
      txt('Presupuesto', PW - ML - 100, 20, { bold: true, size: 10, color: '#C7A977', width: 100, align: 'right' });
      txt('KissthePlan', PW - ML - 100, 36, { size: 8, color: '#ffffff', width: 100, align: 'right' });

      y = 86;

      // ── Cabecera tabla ────────────────────────────────────────────────
      doc.rect(ML, y, TW, ROW + 2).fill('#4A3C32');
      txt('Categoría / Concepto', C0 + 4, y + 6, { bold: true, size: 8, color: '#FFFFFF', width: 185 });
      [['Estimado', C1], ['Real', C2], ['Diferencia', C3], ['Pagado', C4], ['Pendiente', C5]].forEach(
        ([label, x]) => txt(label as string, x as number, y + 6, { bold: true, size: 8, color: '#FFFFFF', width: CW_NUM, align: 'right' }),
      );
      y += ROW + 2;

      // ── Categorías ────────────────────────────────────────────────────
      const pageBottom = PH - 60;

      for (const cat of categories) {
        // Salto de página si no cabe la cabecera + al menos 1 item
        if (y + ROW * 2 > pageBottom) {
          doc.addPage({ size: 'A4', margin: 0 });
          y = MT;
        }

        // Fila categoría
        doc.rect(ML, y, TW, ROW).fill('#EDE4D9');
        txt(cat.name, C0 + 4, y + 6, { bold: true, size: 9, color: '#4A3C32', width: 185 });
        y += ROW;

        for (let i = 0; i < cat.items.length; i++) {
          if (y + ROW > pageBottom) {
            doc.addPage({ size: 'A4', margin: 0 });
            y = MT;
          }

          const item = cat.items[i];
          const diff = item.estimated - item.real;
          const pend = item.real - item.paid;

          // Fondo alternado
          if (i % 2 === 1) doc.rect(ML, y, TW, ROW).fill('#F5EFE9');

          // Línea separadora sutil
          doc.moveTo(ML, y).lineTo(ML + TW, y).strokeColor('#D4C9B8').lineWidth(0.3).stroke();

          txt(item.concept, C0 + 8, y + 6, { size: 8, color: '#4A3C32', width: 178 });
          numRow(y + 6, [item.estimated, item.real, diff, item.paid, pend], [
            null, null,
            diff >= 0 ? '#5a9e5a' : '#c47a7a',
            null,
            pend > 0 ? '#c47a7a' : '#5a9e5a',
          ]);
          y += ROW;
        }
        y += 4; // espacio entre categorías
      }

      // ── Fila TOTAL ────────────────────────────────────────────────────
      if (y + ROW + 2 > pageBottom) {
        doc.addPage({ size: 'A4', margin: 0 });
        y = MT;
      }
      y += 6;
      const tDiff = summary.totalEstimated - summary.totalReal;
      const tPend = summary.totalReal - summary.totalPaid;
      doc.rect(ML, y, TW, ROW + 4).fill('#C7A977');
      txt('TOTAL', C0 + 4, y + 8, { bold: true, size: 9, color: '#FFFFFF', width: 185 });
      numRow(y + 8, [summary.totalEstimated, summary.totalReal, tDiff, summary.totalPaid, tPend],
        ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF']);

      // ── Footer ────────────────────────────────────────────────────────
      doc.moveTo(ML, PH - 36).lineTo(ML + TW, PH - 36).strokeColor('#D4C9B8').lineWidth(0.5).stroke();
      txt(
        `Generado por KissthePlan  ·  ${new Date().toLocaleDateString('es-ES')}`,
        ML, PH - 26, { size: 7, color: '#9b8b7b', width: TW, align: 'center' },
      );

      doc.end();
    });
  }

  // ─── Script PDF ───────────────────────────────────────────────────────────

  async generateScriptPdf(
    entries: Array<{ timeStart?: string; timeEnd?: string; title: string; description?: string; style?: { bold?: boolean; color?: string; fontSize?: string } }>,
    weddingName: string,
  ): Promise<Buffer> {
    const FONT_SIZE_MAP: Record<string, number> = { sm: 8.5, base: 10, lg: 12, xl: 14 };

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Guión — ${weddingName}`, Author: 'KissthePlan' } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const PW = 595.28;
      const PH = 841.89;
      const ML = 44;
      const TW = PW - ML * 2;
      const pageBottom = PH - 40;

      const txt = (text: string, x: number, y: number, opts: { w?: number; align?: 'left'|'center'|'right'; bold?: boolean; size?: number; color?: string; lineBreak?: boolean }) => {
        doc.fillColor(opts.color ?? '#4A3C32')
           .fontSize(opts.size ?? 9)
           .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(text, x, y, { width: opts.w ?? TW, align: opts.align ?? 'left', lineBreak: opts.lineBreak ?? false });
      };

      // Header
      doc.rect(0, 0, PW, 64).fill('#4A3C32');
      txt('Guión de la Boda', ML, 14, { bold: true, size: 16, color: '#C7A977', w: TW });
      txt(weddingName,        ML, 38, { size: 9,  color: '#FFFFFF', w: TW - 100 });
      txt('KissthePlan',    PW - ML - 80, 38, { size: 8, color: '#C7A977', w: 80, align: 'right' });

      let y = 80;

      for (const entry of entries) {
        const st        = entry.style ?? {};
        const titleBold = st.bold ?? true;
        const titleColor = st.color ?? '#4A3C32';
        const titleSize = FONT_SIZE_MAP[st.fontSize ?? 'base'] ?? 10;
        const timeLabel = [entry.timeStart, entry.timeEnd].filter(Boolean).join(' – ');

        // Calcular altura necesaria
        doc.fontSize(titleSize).font(titleBold ? 'Helvetica-Bold' : 'Helvetica');
        const titleH = doc.heightOfString(entry.title, { width: TW - (timeLabel ? 80 : 0) });
        doc.fontSize(8.5).font('Helvetica');
        const descH = entry.description ? doc.heightOfString(entry.description, { width: TW }) : 0;
        const rowH = Math.max(20, titleH + (descH ? descH + 12 : 0) + 22);

        if (y + rowH > pageBottom) {
          doc.addPage({ size: 'A4', margin: 0 });
          y = 40;
        }

        // Time badge
        if (timeLabel) {
          doc.roundedRect(ML, y + 4, 72, 16, 4).fill('#C7A977');
          doc.fillColor('#FFFFFF').fontSize(7).font('Helvetica-Bold')
             .text(timeLabel, ML, y + 8, { width: 72, align: 'center', lineBreak: false });
          txt(entry.title, ML + 80, y + 5, { bold: titleBold, size: titleSize, color: titleColor, w: TW - 80, lineBreak: true });
        } else {
          txt(entry.title, ML, y + 5, { bold: titleBold, size: titleSize, color: titleColor, w: TW, lineBreak: true });
        }

        if (entry.description) {
          const titleLineH = doc.fontSize(titleSize).font(titleBold ? 'Helvetica-Bold' : 'Helvetica').heightOfString(entry.title, { width: TW - (timeLabel ? 80 : 0) });
          txt(entry.description, ML, y + 14 + titleLineH, { size: 8.5, color: '#8c7a6a', w: TW, lineBreak: true });
        }

        // Divider
        y += rowH;
        doc.moveTo(ML, y - 4).lineTo(ML + TW, y - 4).strokeColor('#D4C9B8').lineWidth(0.4).stroke();
      }

      // Footer
      doc.moveTo(ML, PH - 22).lineTo(ML + TW, PH - 22).strokeColor('#D4C9B8').lineWidth(0.5).stroke();
      txt(`Generado por KissthePlan  ·  ${new Date().toLocaleDateString('es-ES')}`, ML, PH - 14, { size: 6, color: '#9b8b7b', w: TW, align: 'center' });

      doc.end();
    });
  }

  // ─── Moodboard PDF ────────────────────────────────────────────────────────

  async generateMoodboardPdf(note: {
    title: string;
    colorPalette: Array<{ hexColor: string; name?: string }>;
    categories: Array<{ name: string; images: Array<{ url: string; caption?: string }> }>;
  }): Promise<Buffer> {
    // Pre-fetch images
    const imageBuffers = new Map<string, Buffer | null>();
    const allUrls = note.categories.flatMap((c) => c.images.map((i) => i.url));
    await Promise.all(allUrls.map(async (url) => {
      imageBuffers.set(url, await this.fetchRemoteImage(url));
    }));

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Moodboard — ${note.title}`, Author: 'KissthePlan' } });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const PW = 595.28;
      const PH = 841.89;
      const ML = 44;
      const TW = PW - ML * 2;
      const pageBottom = PH - 40;

      const txt = (text: string, x: number, y: number, opts: { w?: number; align?: 'left'|'center'|'right'; bold?: boolean; size?: number; color?: string }) => {
        doc.fillColor(opts.color ?? '#4A3C32')
           .fontSize(opts.size ?? 9)
           .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
           .text(text, x, y, { width: opts.w ?? TW, align: opts.align ?? 'left', lineBreak: false });
      };

      // Header
      doc.rect(0, 0, PW, 64).fill('#4A3C32');
      txt('Moodboard', ML, 14, { bold: true, size: 16, color: '#C7A977', w: TW });
      txt(note.title,  ML, 38, { size: 9,  color: '#FFFFFF', w: TW - 100 });
      txt('KissthePlan', PW - ML - 80, 38, { size: 8, color: '#C7A977', w: 80, align: 'right' });

      let y = 82;

      // Color palette
      if (note.colorPalette.length > 0) {
        txt('Paleta de colores', ML, y, { bold: true, size: 11, color: '#4A3C32' });
        y += 20;

        const SW = 36; // swatch size
        const GAP = 12;
        let cx = ML;
        for (const color of note.colorPalette) {
          if (cx + SW + GAP + 60 > PW - ML && cx > ML) { cx = ML; y += SW + 24; }
          doc.circle(cx + SW / 2, y + SW / 2, SW / 2).fill(color.hexColor);
          doc.circle(cx + SW / 2, y + SW / 2, SW / 2).stroke('#D4C9B8').lineWidth(0.5);
          txt(color.hexColor, cx, y + SW + 4, { size: 6.5, color: '#9b8b7b', w: SW + 20 });
          if (color.name) txt(color.name, cx, y + SW + 14, { size: 7, color: '#4A3C32', w: SW + 30 });
          cx += SW + GAP + 30;
        }
        y += SW + 36;
        doc.moveTo(ML, y - 8).lineTo(ML + TW, y - 8).strokeColor('#D4C9B8').lineWidth(0.5).stroke();
      }

      // Categories
      const IMG_W = (TW - 16) / 3;
      const IMG_H = IMG_W * 0.7;

      for (const cat of note.categories) {
        if (cat.images.length === 0) continue;

        if (y + 30 > pageBottom) { doc.addPage({ size: 'A4', margin: 0 }); y = 40; }

        txt(cat.name, ML, y, { bold: true, size: 12, color: '#4A3C32' });
        y += 20;

        let col = 0;
        for (const img of cat.images) {
          if (col === 0 && y + IMG_H + 24 > pageBottom) {
            doc.addPage({ size: 'A4', margin: 0 }); y = 40;
          }
          const ix = ML + col * (IMG_W + 8);
          const imgBuf = imageBuffers.get(img.url);
          if (imgBuf) {
            try {
              doc.image(imgBuf, ix, y, { width: IMG_W, height: IMG_H, cover: [IMG_W, IMG_H] });
            } catch { doc.rect(ix, y, IMG_W, IMG_H).fill('#EDE4D9'); }
          } else {
            doc.rect(ix, y, IMG_W, IMG_H).fill('#EDE4D9');
          }
          if (img.caption) {
            doc.fillColor('#8c7a6a').fontSize(6.5).font('Helvetica')
               .text(img.caption, ix, y + IMG_H + 2, { width: IMG_W, align: 'center', lineBreak: false });
          }
          col++;
          if (col === 3) { col = 0; y += IMG_H + 22; }
        }
        if (col > 0) y += IMG_H + 22;
        y += 10;
      }

      // Footer
      doc.moveTo(ML, PH - 22).lineTo(ML + TW, PH - 22).strokeColor('#D4C9B8').lineWidth(0.5).stroke();
      txt(`Generado por KissthePlan  ·  ${new Date().toLocaleDateString('es-ES')}`, ML, PH - 14, { size: 6, color: '#9b8b7b', w: TW, align: 'center' });

      doc.end();
    });
  }

  private fetchRemoteImage(url: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
      try {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
          if (res.statusCode !== 200) { res.resume(); resolve(null); return; }
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', () => resolve(null));
        });
        req.on('error', () => resolve(null));
        req.setTimeout(8000, () => { req.destroy(); resolve(null); });
      } catch { resolve(null); }
    });
  }
}
