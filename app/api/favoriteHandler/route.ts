import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, ingredients, instructions, cookingTime, imageUrl } = req.body;

  try {
    const recipe = await prisma.recipe.create({
      data: {
        title,
        ingredients,
        instructions,
        cookingTime,
        imageUrl,
        author: { connect: { email: session.user.email } },
      },
    });

    res.status(201).json({ recipe });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Error creating recipe' });
  }
}