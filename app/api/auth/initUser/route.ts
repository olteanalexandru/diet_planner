
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { id: session.user.sub }
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: session.user.sub,
          email: session.user.email || '',
          name: session.user.name || '',
        }
      });
      console.log('Created new user:', user.id);
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error initializing user:', error);
    return NextResponse.json(
      { 
        error: 'Error initializing user',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}