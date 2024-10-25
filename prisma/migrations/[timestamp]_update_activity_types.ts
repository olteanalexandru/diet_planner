
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Update existing activities with appropriate types
  await prisma.activity.updateMany({
    where: {
      action: 'created',
      type: 'legacy_activity'
    },
    data: {
      type: 'recipe_created'
    }
  });

  await prisma.activity.updateMany({
    where: {
      action: 'commented',
      type: 'legacy_activity'
    },
    data: {
      type: 'comment_added'
    }
  });

  await prisma.activity.updateMany({
    where: {
      action: 'followed',
      type: 'legacy_activity'
    },
    data: {
      type: 'started_following'
    }
  });

  await prisma.activity.updateMany({
    where: {
      action: 'generated',
      type: 'legacy_activity'
    },
    data: {
      type: 'recipe_generated'
    }
  });
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })