import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserSchema } from './user/schemas/user.schema';
import { WeddingSchema } from './wedding/schemas/wedding.schema';
import { GuestSchema } from './guest/schemas/guest.schema';
import { ExpenseCategorySchema } from './budget/schemas/expense-category.schema';
import { PaymentScheduleSchema } from './budget/schemas/payment-schedule.schema';
import { TaskSchema } from './task/schemas/task.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kisstheplan';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserModel = mongoose.model('User', UserSchema);
  const WeddingModel = mongoose.model('Wedding', WeddingSchema);
  const GuestModel = mongoose.model('Guest', GuestSchema);
  const ExpenseCategoryModel = mongoose.model('ExpenseCategory', ExpenseCategorySchema);
  const PaymentScheduleModel = mongoose.model('PaymentSchedule', PaymentScheduleSchema);
  const TaskModel = mongoose.model('Task', TaskSchema);

  // Clean existing data
  await Promise.all([
    UserModel.deleteMany({}),
    WeddingModel.deleteMany({}),
    GuestModel.deleteMany({}),
    ExpenseCategoryModel.deleteMany({}),
    PaymentScheduleModel.deleteMany({}),
    TaskModel.deleteMany({}),
  ]);
  console.log('Cleaned existing data');

  // --- User ---
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await UserModel.create({
    email: 'lucia@example.com',
    passwordHash,
    name: 'Lucía García',
  });
  console.log('User created:', user.email);

  // --- Wedding ---
  const wedding = await WeddingModel.create({
    userId: user._id,
    slug: 'lucia-y-pablo',
    partner1Name: 'Lucía',
    partner2Name: 'Pablo',
    date: new Date('2026-09-12'),
    venue: 'Finca Tagamanent',
    location: 'Barcelona',
    estimatedGuests: 300,
    estimatedBudget: 60000,
  });
  console.log('Wedding created:', wedding.slug);

  // --- Guests (22 from mock) ---
  const guestsData = [
    { firstName: 'María', lastName: 'García', email: 'maria@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Carne', allergies: '', transport: true, plusOne: false },
    { firstName: 'Carlos', lastName: 'López', email: 'carlos@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Pescado', allergies: 'Gluten', transport: false, plusOne: true },
    { firstName: 'Ana', lastName: 'Martínez', email: 'ana@mail.com', rsvpStatus: 'pending', mealChoice: '', allergies: '', transport: true, plusOne: false },
    { firstName: 'Javier', lastName: 'Ruiz', email: 'javier@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Vegetariano', allergies: 'Frutos secos', transport: false, plusOne: true },
    { firstName: 'Laura', lastName: 'Fernández', email: 'laura@mail.com', rsvpStatus: 'rejected', mealChoice: '', allergies: '', transport: false, plusOne: false },
    { firstName: 'Pedro', lastName: 'Sánchez', email: 'pedro@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Carne', allergies: '', transport: true, plusOne: true },
    { firstName: 'Isabel', lastName: 'Torres', email: 'isabel@mail.com', rsvpStatus: 'pending', mealChoice: '', allergies: '', transport: false, plusOne: false },
    { firstName: 'Miguel Ángel', lastName: 'Díaz', email: 'miguel@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Pescado', allergies: '', transport: true, plusOne: false },
    { firstName: 'Carmen', lastName: 'Ortega', email: 'carmen@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Carne', allergies: 'Lactosa', transport: false, plusOne: true },
    { firstName: 'Raúl', lastName: 'Jiménez', email: 'raul@mail.com', rsvpStatus: 'pending', mealChoice: '', allergies: '', transport: true, plusOne: false },
    { firstName: 'Elena', lastName: 'Moreno', email: 'elena@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Vegetariano', allergies: '', transport: false, plusOne: false },
    { firstName: 'David', lastName: 'Álvarez', email: 'david@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Carne', allergies: '', transport: true, plusOne: true },
    { firstName: 'Sofía', lastName: 'Romero', email: 'sofia@mail.com', rsvpStatus: 'rejected', mealChoice: '', allergies: '', transport: false, plusOne: false },
    { firstName: 'Pablo', lastName: 'Navarro', email: 'pablo@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Pescado', allergies: '', transport: false, plusOne: false },
    { firstName: 'Lucía', lastName: 'Domínguez', email: 'lucia.d@mail.com', rsvpStatus: 'pending', mealChoice: '', allergies: '', transport: true, plusOne: true },
    { firstName: 'Andrés', lastName: 'Gil', email: 'andres@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Carne', allergies: '', transport: false, plusOne: false },
    { firstName: 'Patricia', lastName: 'Herrera', email: 'patricia@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Vegetariano', allergies: 'Mariscos', transport: true, plusOne: false },
    { firstName: 'Fernando', lastName: 'Campos', email: 'fernando@mail.com', rsvpStatus: 'pending', mealChoice: '', allergies: '', transport: false, plusOne: true },
    { firstName: 'Rosa', lastName: 'Mendoza', email: 'rosa@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Carne', allergies: '', transport: true, plusOne: false },
    { firstName: 'Jorge', lastName: 'Castro', email: 'jorge@mail.com', rsvpStatus: 'rejected', mealChoice: '', allergies: '', transport: false, plusOne: false },
    { firstName: 'Marta', lastName: 'Vega', email: 'marta@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Pescado', allergies: '', transport: false, plusOne: true },
    { firstName: 'Álvaro', lastName: 'Reyes', email: 'alvaro@mail.com', rsvpStatus: 'confirmed', mealChoice: 'Carne', allergies: '', transport: true, plusOne: false },
  ];

  await GuestModel.insertMany(
    guestsData.map((g) => ({ ...g, weddingId: wedding._id })),
  );
  console.log(`${guestsData.length} guests created`);

  // --- Budget categories with embedded items ---
  const categoriesData = [
    {
      name: 'Finca y Espacios', order: 0,
      items: [
        { concept: 'Alquiler finca', estimated: 8000, actual: 8500, paid: 4000 },
        { concept: 'Ceremonia exterior', estimated: 1200, actual: 1200, paid: 1200 },
        { concept: 'Zona cocktail', estimated: 800, actual: 750, paid: 750 },
      ],
    },
    {
      name: 'Catering', order: 1,
      items: [
        { concept: 'Menú adultos (x250)', estimated: 22500, actual: 23000, paid: 11500 },
        { concept: 'Menú infantil (x20)', estimated: 1200, actual: 1100, paid: 0 },
        { concept: 'Barra libre', estimated: 3500, actual: 3500, paid: 1750 },
        { concept: 'Cocktail bienvenida', estimated: 2800, actual: 3000, paid: 1500 },
      ],
    },
    {
      name: 'Fotografía y Vídeo', order: 2,
      items: [
        { concept: 'Fotógrafo', estimated: 2500, actual: 2500, paid: 1250 },
        { concept: 'Videógrafo', estimated: 2000, actual: 2200, paid: 1000 },
        { concept: 'Photocall', estimated: 600, actual: 550, paid: 550 },
      ],
    },
    {
      name: 'Decoración y Flores', order: 3,
      items: [
        { concept: 'Centros de mesa', estimated: 2000, actual: 1800, paid: 900 },
        { concept: 'Arco ceremonial', estimated: 1500, actual: 1600, paid: 800 },
        { concept: 'Ramos novia', estimated: 400, actual: 450, paid: 450 },
        { concept: 'Iluminación', estimated: 1200, actual: 1200, paid: 600 },
      ],
    },
    {
      name: 'Música y Entretenimiento', order: 4,
      items: [
        { concept: 'DJ', estimated: 1500, actual: 1500, paid: 750 },
        { concept: 'Grupo en directo', estimated: 2500, actual: 2800, paid: 1400 },
      ],
    },
    {
      name: 'Vestuario y Belleza', order: 5,
      items: [
        { concept: 'Vestido novia', estimated: 3000, actual: 3200, paid: 3200 },
        { concept: 'Traje novio', estimated: 800, actual: 750, paid: 750 },
        { concept: 'Peluquería y maquillaje', estimated: 500, actual: 500, paid: 250 },
      ],
    },
  ];

  await ExpenseCategoryModel.insertMany(
    categoriesData.map((c) => ({ ...c, weddingId: wedding._id })),
  );
  console.log(`${categoriesData.length} budget categories created`);

  // --- Payments ---
  const paymentsData = [
    { vendorName: 'Finca Tagamanent', concept: '2º pago finca', amount: 2500, dueDate: new Date('2026-03-01') },
    { vendorName: 'Catering Deluxe', concept: 'Adelanto catering', amount: 5000, dueDate: new Date('2026-03-15') },
    { vendorName: 'Foto Moments', concept: '50% fotógrafo', amount: 1250, dueDate: new Date('2026-04-01') },
    { vendorName: 'Sound & Music', concept: 'Señal grupo', amount: 700, dueDate: new Date('2026-04-15') },
    { vendorName: 'Flora Bella', concept: 'Anticipo flores', amount: 900, dueDate: new Date('2026-05-01') },
  ];

  await PaymentScheduleModel.insertMany(
    paymentsData.map((p) => ({ ...p, weddingId: wedding._id })),
  );
  console.log(`${paymentsData.length} payments created`);

  // --- Tasks (10 from mock) ---
  const tasksData = [
    { title: 'Confirmar menú con catering', status: 'pending', dueDate: new Date('2026-03-15'), category: 'Catering', order: 1 },
    { title: 'Enviar invitaciones digitales', status: 'pending', dueDate: new Date('2026-03-20'), category: 'Invitados', order: 2 },
    { title: 'Prueba de vestido final', status: 'pending', dueDate: new Date('2026-04-10'), category: 'Vestuario', order: 3 },
    { title: 'Reunión con fotógrafo', status: 'done', dueDate: new Date('2026-02-10'), category: 'Foto', completedAt: new Date('2026-02-10'), order: 4 },
    { title: 'Reservar autobús invitados', status: 'pending', dueDate: new Date('2026-05-01'), category: 'Transporte', order: 5 },
    { title: 'Elegir música ceremonia', status: 'done', dueDate: new Date('2026-01-20'), category: 'Música', completedAt: new Date('2026-01-20'), order: 6 },
    { title: 'Contratar DJ', status: 'done', dueDate: new Date('2025-12-15'), category: 'Música', completedAt: new Date('2025-12-15'), order: 7 },
    { title: 'Decidir distribución mesas', status: 'pending', dueDate: new Date('2026-06-01'), category: 'Organización', order: 8 },
    { title: 'Seleccionar tarta nupcial', status: 'pending', dueDate: new Date('2026-04-15'), category: 'Catering', order: 9 },
    { title: 'Firmar contrato finca', status: 'done', dueDate: new Date('2025-11-01'), category: 'Finca', completedAt: new Date('2025-11-01'), order: 10 },
  ];

  await TaskModel.insertMany(
    tasksData.map((t) => ({ ...t, weddingId: wedding._id, isCustom: false })),
  );
  console.log(`${tasksData.length} tasks created`);

  console.log('\nSeed completed successfully!');
  console.log('Login: lucia@example.com / password123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
