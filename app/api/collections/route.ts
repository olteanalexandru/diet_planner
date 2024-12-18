import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getSession } from '@auth0/nextjs-auth0';

// Get all collections for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isPublicOnly = searchParams.get('public') === 'true';

    const where = {
      ...(userId ? { userId } : {}),
      ...(isPublicOnly ? { isPublic: true } : {}),
    };

    const collections = await prisma.collection.findMany({
      where,
      include: {
        _count: {
          select: { recipes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// Create a new collection
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, coverImage, isPublic = true, category = 'other' } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        coverImage,
        isPublic,
        category,
        userId: session.user.sub,
      },
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
