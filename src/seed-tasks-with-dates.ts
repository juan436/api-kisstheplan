/**
 * seed-tasks-with-dates.ts
 *
 * Adds concrete tasks WITH dueDate to existing weddings.
 * Does NOT delete any existing data.
 * Run: pnpm seed:tasks
 */
import * as mongoose from 'mongoose';
import { WeddingSchema } from './wedding/schemas/wedding.schema';
import { TaskSchema } from './task/schemas/task.schema';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/kisstheplan';

const concreteTasks = [
  { title: 'Confirmar menú con catering', category: 'Catering', stage: '3-5 meses', dueDate: new Date('2026-03-25'), status: 'pending' },
  { title: 'Enviar invitaciones digitales', category: 'Invitados', stage: '3-5 meses', dueDate: new Date('2026-04-05'), status: 'pending' },
  { title: 'Prueba de vestido final', category: 'Vestuario', stage: '3-5 meses', dueDate: new Date('2026-04-10'), status: 'pending' },
  { title: 'Reunión con fotógrafo', category: 'Foto', stage: '3-5 meses', dueDate: new Date('2026-03-28'), status: 'pending' },
  { title: 'Reservar autobús invitados', category: 'Transporte', stage: '3-5 meses', dueDate: new Date('2026-05-01'), status: 'pending' },
  { title: 'Decidir distribución mesas', category: 'Organización', stage: '1-2 meses', dueDate: new Date('2026-06-01'), status: 'pending' },
  { title: 'Seleccionar tarta nupcial', category: 'Catering', stage: '3-5 meses', dueDate: new Date('2026-04-15'), status: 'pending' },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const WeddingModel = mongoose.model('Wedding', WeddingSchema);
  const TaskModel = mongoose.model('Task', TaskSchema);

  const weddings = await WeddingModel.find({});
  if (weddings.length === 0) {
    console.log('No weddings found. Run pnpm seed first.');
    await mongoose.disconnect();
    return;
  }

  for (const wedding of weddings) {
    const tasks = concreteTasks.map((t) => ({
      ...t,
      weddingId: wedding._id,
      order: 99,
      isCustom: true,
    }));
    await TaskModel.insertMany(tasks);
    console.log(`Added ${tasks.length} tasks to wedding: ${wedding.slug}`);
  }

  console.log('\nDone. No existing data was modified.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
