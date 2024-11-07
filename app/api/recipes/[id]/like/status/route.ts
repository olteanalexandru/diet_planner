import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ isLiked: false, likes: 0 });
    }

    const [like, likesCount] = await Promise.all([
      prisma.recipeLike.findUnique({
        where: {
          userId_recipeId: {
            userId: session.user.sub,
            recipeId: params.id,
          },
        },
      }),
      prisma.recipeLike.count({
        where: {
          recipeId: params.id,
        },
      }),
    ]);

    return NextResponse.json({ 
      isLiked: !!like,
      likes: likesCount
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
}
