/**
 * seed-admin.ts
 * Crea el usuario administrador de KissthePlan.
 * Run: pnpm seed:admin
 * Idempotente — no duplica si el email ya existe.
 */

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserSchema } from './user/schemas/user.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kisstheplan';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kisstheplan.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminKtp2026!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin KissthePlan';

async function seedAdmin() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserModel = mongoose.model('User', UserSchema);

  const existing = await UserModel.findOne({ email: ADMIN_EMAIL }).lean();
  if (existing) {
    console.log(`Admin ya existe: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await UserModel.create({
    email: ADMIN_EMAIL,
    passwordHash,
    name: ADMIN_NAME,
    role: 'admin',
    onboardingComplete: true,
  });

  console.log(`Admin creado: ${ADMIN_EMAIL}`);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => { console.error(err); process.exit(1); });
