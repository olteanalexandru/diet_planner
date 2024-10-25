import { NextRequest, NextResponse } from 'next/server';

export const CATEGORIES = [
  { 
    id: 'all', 
    name: 'All Recipes', 
    icon: '🍽️',
    description: 'Browse all recipes'
  },
  { 
    id: 'quick', 
    name: 'Quick & Easy', 
    icon: '⚡',
    description: 'Ready in 30 minutes or less'
  },
  { 
    id: 'vegetarian', 
    name: 'Vegetarian', 
    icon: '🥗',
    description: 'Meat-free dishes'
  },
  { 
    id: 'desserts', 
    name: 'Desserts', 
    icon: '🍰',
    description: 'Sweet treats and baked goods'
  },
  { 
    id: 'healthy', 
    name: 'Healthy', 
    icon: '💪',
    description: 'Nutritious and balanced meals'
  },
  { 
    id: 'budget', 
    name: 'Budget', 
    icon: '💰',
    description: 'Affordable meal ideas'
  },
] as const;

export async function GET() {
  return NextResponse.json({ categories: CATEGORIES });
}