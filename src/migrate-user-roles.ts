/**
 * migrate-user-roles.ts
 *
 * Migración: normaliza campo `role` en usuarios.
 * - admin → se mantiene 'admin'
 * - owner / collaborator / cualquier otro → 'user'
 *
 * Run: pnpm migrate:roles
 * Seguro ejecutar más de una vez (idempotente).
 */

import * as mongoose from 'mongoose';
import { UserSchema } from './user/schemas/user.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kisstheplan';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserModel = mongoose.model('User', UserSchema);

  const result = await UserModel.updateMany(
    { role: { $nin: ['admin', 'user'] } },
    { $set: { role: 'user' } },
  );

  console.log(`Migration complete: ${result.modifiedCount} users updated to 'user'`);
  await mongoose.disconnect();
}

migrate().catch((err) => { console.error(err); process.exit(1); });
