'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { MealPlanner } from '../Components/MealPlanner';

export default function MealPlanPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Meal Plan</h1>
        <Link href="/shopping-list" className="btn-cyber-outline flex items-center gap-2">
          <ShoppingCart size={18} />
          Shopping List
        </Link>
      </div>
      <MealPlanner />
    </div>
  );
}
