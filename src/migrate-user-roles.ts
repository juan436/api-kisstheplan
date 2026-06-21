/**
 * migrate-user-roles.ts
 *
 * Migración puntual: asigna campo `role` a usuarios existentes en BD.
 * - Si tiene boda propia → "owner"
 * - Si está en collaborators como accepted → "collaborator"
 * - Si no tiene nada → "owner" (completará onboarding)
 *
 * Run: pnpm migrate:roles
 * Seguro ejecutar más de una vez (idempotente).
 */

import * as mongoose from 'mongoose';
import { UserSchema } from './user/schemas/user.schema';
import { WeddingSchema } from './wedding/schemas/wedding.schema';
import { CollaboratorSchema } from './collaborator/schemas/collaborator.schema';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kisstheplan';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserModel = mongoose.model('User', UserSchema);
  const WeddingModel = mongoose.model('Wedding', WeddingSchema);
  const CollaboratorModel = mongoose.model('Collaborator', CollaboratorSchema);

  const users = await UserModel.find({}).lean();
  console.log(`Found ${users.length} users`);

  let owners = 0;
  let collaborators = 0;

  for (const user of users) {
    const userId = user._id;

    const hasWedding = await WeddingModel.exists({ userId });
    if (hasWedding) {
      await UserModel.findByIdAndUpdate(userId, { role: 'owner' });
      owners++;
      continue;
    }

    const isCollab = await CollaboratorModel.exists({ userId, status: 'accepted' });
    if (isCollab) {
      await UserModel.findByIdAndUpdate(userId, { role: 'collaborator' });
      collaborators++;
      continue;
    }

    await UserModel.findByIdAndUpdate(userId, { role: 'owner' });
    owners++;
  }

  console.log(`Migration complete: ${owners} owners, ${collaborators} collaborators`);
  await mongoose.disconnect();
}

migrate().catch((err) => { console.error(err); process.exit(1); });
