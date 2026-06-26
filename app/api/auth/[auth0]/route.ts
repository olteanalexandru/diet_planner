// app/api/auth/[auth0]/route.ts

import { handleAuth, handleCallback, getSession } from "@auth0/nextjs-auth0";
import type { NextApiRequest, NextApiResponse } from 'next';

import prisma from '../../../lib/db';

export const GET = handleAuth({
  callback: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Handle the Auth0 callback
      const response = await handleCallback(req, res);
      
      // Then get the session after Auth0 has processed everything
      const session = await getSession(req, res);

      if (session?.user) {
        await prisma.user.upsert({
          where: { id: session.user.sub },
          update: {
            name: session.user.name || '',
            email: session.user.email || null,
          },
          create: {
            id: session.user.sub,
            name: session.user.name || '',
            email: session.user.email || null,
          },
        });

        console.log('User upserted:', session.user.sub);
      }

      // Return the response from handleCallback
      return response;

    } catch (error) {
      console.error('Error in Auth0 callback:', error);
      return Response.redirect(
        new URL('/api/auth/login', new URL(process.env.AUTH0_BASE_URL || 'http://localhost:3000'))
      );
    }
  }
});
