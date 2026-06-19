import { redirect } from 'next/navigation';
import prisma from '../../lib/db';

export default async function ActivityPage({ 
  params 
}: { 
  params: { activityId: string } 
}) {
  const activity = await prisma.activity.findUnique({
    where: { id: params.activityId },
    include: {
      recipe: true,
    },
  });

  // If activity not found, redirect to social feed
  if (!activity) {
    redirect('/social-feed');
  }

  // If activity has a recipe, redirect to recipe page
  if (activity.recipeId) {
    redirect(`/recipe/${activity.recipeId}`);
  }

  // For other types of activities, redirect to social feed
  redirect('/social-feed');
}
