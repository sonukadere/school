import { prisma } from './src/config/database.js';

async function fixIndexes() {
  const collections = ['Student', 'Teacher', 'Parent', 'Staff'];
  for (const col of collections) {
    try {
      await prisma.$runCommandRaw({ dropIndexes: col, index: `${col}_userId_key` });
      console.log(`Dropped ${col}_userId_key`);
    } catch (e) {
      console.log(`Drop note on ${col}:`, e.message);
    }
    try {
      await prisma.$runCommandRaw({
        createIndexes: col,
        indexes: [
          {
            key: { userId: 1 },
            name: `${col}_userId_key`,
            unique: true,
            sparse: true,
          },
        ],
      });
      console.log(`Created sparse unique index on userId for ${col}`);
    } catch (e) {
      console.log(`Create error on ${col}:`, e.message);
    }
  }
}

fixIndexes()
  .then(() => {
    console.log('ALL SPARSE INDEXES READY!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
