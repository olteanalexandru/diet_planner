import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.sub },
      include: { recipe: true },
    });

    return NextResponse.json({ favorites: favorites.map(f => f.recipe) });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Error fetching favorites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId } = await req.json();
    const favorite = await prisma.favorite.create({
      data: {
        user: { connect: { id: session.user.sub } },
        recipe: { connect: { id: recipeId } },
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Error adding favorite' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId } = await req.json();
    await prisma.favorite.delete({
      where: {
        userId_recipeId: {
          userId: session.user.sub,
          recipeId: recipeId,
        },
      },
    });

    return NextResponse.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Error removing favorite' }, { status: 500 });
  }
}