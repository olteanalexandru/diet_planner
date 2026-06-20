'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { MealPlanner } from '../Components/MealPlanner';
import { AiMealPlanGenerator } from '../Components/AiMealPlanGenerator';

export default function MealPlanPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Meal Plan</h1>
        <Link href="/shopping-list" className="btn-cyber-outline flex items-center gap-2">
          <ShoppingCart size={18} />
          Shopping List
        </Link>
      </div>
      <AiMealPlanGenerator onMealAdded={() => setRefreshKey(k => k + 1)} />
      <MealPlanner key={refreshKey} />
    </div>
  );
}
