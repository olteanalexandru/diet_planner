'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface MealPlan {
  id: string;
  date: string;
  recipe: Recipe;
}

export const MealPlanner: React.FC = () => {
  const { user } = useUser();
  const { t } = useLanguage();
  const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (user) {
      fetchMealPlan();
      fetchUserRecipes();
    }
  }, [user]);

  const fetchMealPlan = async () => {
    const response = await fetch('/api/mealPlanning');
    const data = await response.json();
    setMealPlan(data.mealPlan);
  };

  const fetchUserRecipes = async () => {
    const response = await fetch('/api/recipes');
    const data = await response.json();
    setRecipes(data.recipes);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const newMealPlan = Array.from(mealPlan);
    const [reorderedItem] = newMealPlan.splice(result.source.index, 1);
    newMealPlan.splice(result.destination.index, 0, reorderedItem);

    setMealPlan(newMealPlan);

    // Update the meal plan on the server
    await fetch('/api/mealPlanning', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealPlan: newMealPlan }),
    });
  };

  return (
    <div className="card-cyber p-6">
      <h2 className="text-xl font-semibold text-space-50 mb-4">{t('mealPlan.plannerTitle')}</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="mealPlan">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {mealPlan.map((meal, index) => (
                <Draggable key={meal.id} draggableId={meal.id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="p-3 rounded-lg border border-space-700 bg-space-800/50 text-space-200"
                    >
                      <strong className="text-space-50">{meal.date}</strong>: {meal.recipe.title}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <h3 className="text-lg font-medium text-cyber-primary mt-6 mb-3">{t('mealPlan.availableRecipes')}</h3>
      {recipes.length === 0 ? (
        <p className="text-space-400">{t('mealPlan.noRecipes')}</p>
      ) : (
        <ul className="space-y-2">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="text-space-300">{recipe.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
