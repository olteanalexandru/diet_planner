// app/api/auth/[auth0]/route.ts

import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

export const GET = handleAuth({
  callback: async () => {
    const res = await handleCallback();
    
    try {
      // Extract the user information from the session
      const session = await getSession();

      // If we have a session, ensure the user exists in our database
      if (session?.user) {
        await prisma.user.upsert({
          where: { id: session.user.sub },
          update: { 
            name: session.user.name || '',
            email: session.user.email || '',
          },
          create: {
            id: session.user.sub,
            name: session.user.name || '',
            email: session.user.email || '',
          },
        });
      }

      return res;
    } catch (error) {
      console.error('Error in Auth0 callback:', error);
      return Response.redirect(new URL('/api/auth/login', new URL(process.env.AUTH0_BASE_URL || 'http://localhost:3000')));
    }
  }
});

import { getSession } from "@auth0/nextjs-auth0";