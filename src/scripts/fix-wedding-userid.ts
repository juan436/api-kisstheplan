/**
 * fix-wedding-userid.ts
 *
 * Migración: convierte userId String → ObjectId en la colección weddings,
 * y elimina bodas duplicadas (misma userId), conservando la más reciente.
 *
 * Causa: Mongoose 8 no garantiza auto-casting en Model.create() cuando el
 * valor llega como string, causando que el campo userId se persista como
 * String en lugar de ObjectId. Esto rompe todas las queries posteriores.
 *
 * SEGURO de ejecutar varias veces (idempotente).
 * Run: pnpm migrate:userid
 */

import * as mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/kisstheplan';

const RELATED_COLLECTIONS = [
  'guests',
  'expensecategories',
  'paymentschedules',
  'tasks',
  'vendors',
  'webpages',
  'seatingplans',
  'notes',
  'scriptentries',
  'scriptareas',
];

async function run() {
  console.log('Conectando a MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  const weddings = db.collection('weddings');

  // ── PASO 1: Convertir string userId → ObjectId ───────────────────────────
  console.log('\n[Paso 1] Buscando weddings con userId tipo String...');
  const allWeddings = await weddings.find({}).toArray();

  let converted = 0;
  for (const w of allWeddings) {
    if (typeof w.userId === 'string' && mongoose.Types.ObjectId.isValid(w.userId)) {
      await weddings.updateOne(
        { _id: w._id },
        { $set: { userId: new mongoose.Types.ObjectId(w.userId) } },
      );
      converted++;
      console.log(`  ✓ Convertido: wedding ${w._id}  userId "${w.userId}" → ObjectId`);
    }
  }
  console.log(`  → ${converted} convertidos, ${allWeddings.length - converted} ya eran ObjectId`);

  // ── PASO 2: Detectar y eliminar duplicados ───────────────────────────────
  console.log('\n[Paso 2] Buscando bodas duplicadas por userId...');

  const duplicateGroups = await weddings
    .aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          latestId: { $first: '$_id' },
          allIds: { $push: '$_id' },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  if (duplicateGroups.length === 0) {
    console.log('  → Sin duplicados.');
  }

  for (const group of duplicateGroups) {
    const toDelete = group.allIds.filter(
      (id: mongoose.Types.ObjectId) => id.toString() !== group.latestId.toString(),
    );

    console.log(
      `  userId ${group._id}: ${group.count} bodas → conservando ${group.latestId}, eliminando ${toDelete.length}`,
    );

    for (const weddingId of toDelete) {
      // Limpiar datos relacionados antes de eliminar la boda
      for (const col of RELATED_COLLECTIONS) {
        const coll = db.collection(col);
        const res = await coll.deleteMany({ weddingId });
        if (res.deletedCount > 0) {
          console.log(`    - Eliminados ${res.deletedCount} docs de '${col}' (weddingId: ${weddingId})`);
        }
      }
      await weddings.deleteOne({ _id: weddingId });
      console.log(`    - Boda duplicada ${weddingId} eliminada`);
    }
  }

  console.log('\n✅ Migración completada.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ Error en migración:', err);
  process.exit(1);
});
