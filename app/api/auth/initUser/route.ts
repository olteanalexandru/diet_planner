import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../../lib/db';

export async function POST() {
  try {
    // Ensure database connection
    await prisma.$connect();

    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to find existing user with error handling
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.sub }
      });
    } catch (findError) {
      console.error('Error finding user:', findError);
      throw new Error('Database query failed');
    }

    // If user doesn't exist, create them with error handling
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            id: session.user.sub,
            email: session.user.email || '',
            name: session.user.name || '',
          }
        });
        console.log('Created new user:', user.id);
      } catch (createError) {
        console.error('Error creating user:', createError);
        throw new Error('Failed to create user');
      }
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in initUser route:', error);
    return NextResponse.json(
      { 
        error: 'Error initializing user',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  } finally {
    // Ensure connection is properly closed
    await prisma.$disconnect();
  }
}
