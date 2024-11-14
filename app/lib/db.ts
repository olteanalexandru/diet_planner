import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
    // Log queries only in development
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends({
    query: {
      $allOperations({ 
        operation,
        model,
        args,
        query
      }: {
        operation: string;
        model: string | null;
        args: any;
        query: (args: any) => Promise<any>;
      }) {
        // Add retry logic for connection errors
        const maxRetries = 3;
        let retries = 0;
        
        const runQuery = async () => {
          try {
            return await query(args);
          } catch (error: any) {
            if (
              retries < maxRetries &&
              (error?.message?.includes('Connection pool timeout') ||
                error?.message?.includes('Connection lost') ||
                error?.message?.includes('Connection refused'))
            ) {
              retries++;
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
              return runQuery();
            }
            throw error;
          }
        };

        return runQuery();
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
