
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get all tables in the database
    const tables = await prisma.$queryRaw`
      SELECT 
        table_name,
        (
          SELECT json_agg(json_build_object(
            'column_name', column_name,
            'data_type', data_type,
            'is_nullable', is_nullable
          ))
          FROM information_schema.columns AS c
          WHERE c.table_name = t.table_name
        ) as columns
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `;

    // Get all foreign key relationships
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `;

    return NextResponse.json({ 
      tables,
      foreignKeys,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error inspecting schema:', error);
    return NextResponse.json(
      { 
        error: 'Failed to inspect schema', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}