import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';

interface MealPlan {
  id: string;
  date: string;
  recipe: Recipe;
}

export const MealPlanner: React.FC = () => {
  const { user } = useUser();
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

  const onDragEnd = async (result: any) => {
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
    <div className="container mt-5">
      <h2>Meal Planner</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="mealPlan">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {mealPlan.map((meal, index) => (
                <Draggable key={meal.id} draggableId={meal.id} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="mb-3 p-3 bg-light rounded"
                    >
                      <strong>{meal.date}</strong>: {meal.recipe.title}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <h3 className="mt-4">Available Recipes</h3>
      <ul>
        {recipes.map((recipe) => (
          <li key={recipe.id}>{recipe.title}</li>
        ))}
      </ul>
    </div>
  );
};
