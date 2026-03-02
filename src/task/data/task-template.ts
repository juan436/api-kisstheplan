export interface TaskTemplate {
  title: string;
  category: string;
  stage: string;
  order: number;
}

export const defaultTaskTemplate: TaskTemplate[] = [
  // +12 meses
  { title: 'Definir presupuesto general', category: 'Organización', stage: '+12 meses', order: 1 },
  { title: 'Elegir fecha de la boda', category: 'Organización', stage: '+12 meses', order: 2 },
  { title: 'Buscar y reservar finca/espacio', category: 'Finca', stage: '+12 meses', order: 3 },
  { title: 'Contratar wedding planner (opcional)', category: 'Organización', stage: '+12 meses', order: 4 },

  // 9-12 meses
  { title: 'Buscar y contratar catering', category: 'Catering', stage: '9-12 meses', order: 5 },
  { title: 'Buscar y contratar fotógrafo', category: 'Foto', stage: '9-12 meses', order: 6 },
  { title: 'Buscar y contratar videógrafo', category: 'Vídeo', stage: '9-12 meses', order: 7 },
  { title: 'Buscar y contratar música/DJ', category: 'Música', stage: '9-12 meses', order: 8 },
  { title: 'Elegir vestido de novia', category: 'Vestuario', stage: '9-12 meses', order: 9 },
  { title: 'Elegir traje del novio', category: 'Vestuario', stage: '9-12 meses', order: 10 },

  // 6-8 meses
  { title: 'Contratar decoración y flores', category: 'Decoración', stage: '6-8 meses', order: 11 },
  { title: 'Diseñar invitaciones', category: 'Papelería', stage: '6-8 meses', order: 12 },
  { title: 'Crear lista de invitados definitiva', category: 'Invitados', stage: '6-8 meses', order: 13 },
  { title: 'Reservar transporte para invitados', category: 'Transporte', stage: '6-8 meses', order: 14 },
  { title: 'Contratar sistema de sonido', category: 'Música', stage: '6-8 meses', order: 15 },

  // 3-5 meses
  { title: 'Enviar invitaciones', category: 'Invitados', stage: '3-5 meses', order: 16 },
  { title: 'Confirmar menú con catering', category: 'Catering', stage: '3-5 meses', order: 17 },
  { title: 'Prueba de vestido final', category: 'Vestuario', stage: '3-5 meses', order: 18 },
  { title: 'Elegir tarta nupcial', category: 'Catering', stage: '3-5 meses', order: 19 },
  { title: 'Reunión con fotógrafo para planificar', category: 'Foto', stage: '3-5 meses', order: 20 },

  // 1-2 meses
  { title: 'Confirmar asistencia invitados', category: 'Invitados', stage: '1-2 meses', order: 21 },
  { title: 'Decidir distribución de mesas', category: 'Organización', stage: '1-2 meses', order: 22 },
  { title: 'Preparar guión del día', category: 'Organización', stage: '1-2 meses', order: 23 },
  { title: 'Prueba de peluquería y maquillaje', category: 'Belleza', stage: '1-2 meses', order: 24 },
  { title: 'Confirmar detalles con todos los proveedores', category: 'Organización', stage: '1-2 meses', order: 25 },

  // Última semana
  { title: 'Ensayo de ceremonia', category: 'Organización', stage: 'Última semana', order: 26 },
  { title: 'Preparar discursos y votos', category: 'Organización', stage: 'Última semana', order: 27 },
  { title: 'Confirmar horarios con proveedores', category: 'Organización', stage: 'Última semana', order: 28 },
];
