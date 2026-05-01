import type { CreateEntryDto } from '../dto/create-entry.dto';

export const DEFAULT_SCRIPT_TEMPLATE: Omit<CreateEntryDto, 'order'>[] = [
  { timeType: 'exact', timeStart: '09:00', title: 'Maquillaje y peluquería', description: 'Preparativos de los novios', style: {} },
  { timeType: 'exact', timeStart: '17:00', title: 'Llegada de invitados', description: 'Recepción en la entrada', style: {} },
  { timeType: 'range', timeStart: '17:30', timeEnd: '18:15', title: 'Ceremonia', description: 'Intercambio de votos y anillos', style: {} },
  { timeType: 'range', timeStart: '18:30', timeEnd: '20:00', title: 'Banquete y cocktail', description: 'Cóctel de bienvenida y aperitivos', style: {} },
  { timeType: 'exact', timeStart: '20:00', title: 'Cena', description: 'Menú degustación', style: {} },
  { timeType: 'exact', timeStart: '22:30', title: 'Corte de tarta', description: '', style: {} },
  { timeType: 'exact', timeStart: '23:00', title: 'Fiesta y barra libre', description: 'Primer baile y celebración', style: {} },
];
