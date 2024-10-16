import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { followingId } = req.body;

  try {
    const follow = await prisma.follow.create({
      data: {
        follower: { connect: { email: session.user.email } },
        following: { connect: { id: followingId } },
      },
    });

    res.status(201).json({ follow });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Error following user' });
  }
}