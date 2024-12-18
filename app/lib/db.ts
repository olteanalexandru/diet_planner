import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as { prismaDb?: PrismaClient };

if (!globalForPrisma.prismaDb) {
  globalForPrisma.prismaDb = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const prisma = globalForPrisma.prismaDb;

export default prisma;
