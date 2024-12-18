import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getSession } from '@auth0/nextjs-auth0';

// Get a specific collection with its recipes
export async function GET(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
      include: {
        recipes: {
          include: {
            recipe: true,
          },
        },
        _count: {
          select: { recipes: true },
        },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (!collection.isPublic) {
      const session = await getSession();
      if (!session?.user || session.user.sub !== collection.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

// Update a collection
export async function PUT(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, coverImage, isPublic, category } = data;

    const updatedCollection = await prisma.collection.update({
      where: { id: params.collectionId },
      data: {
        name,
        description,
        coverImage,
        isPublic,
        category,
      },
    });

    return NextResponse.json(updatedCollection);
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

// Delete a collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== session.user.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.collection.delete({
      where: { id: params.collectionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
