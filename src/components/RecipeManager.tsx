import React, { useState, useEffect } from 'react';
import type { Recipe, MealPlan, UserProfile, MealHistory, RecipeReview } from '../types';
import { createDAL } from '../lib/dal';
import RecipeEditor from './RecipeEditor';
import RecipeImporter from './RecipeImporter';
import RecipeReviews from './RecipeReviews';
import { sampleRecipes } from '../data/sampleRecipes';

interface RecipeManagerProps {
  onRecipeSelect?: (recipe: Recipe) => void;
  selectedRecipeId?: string;
  familyMembers?: UserProfile[];
}

export const RecipeManager: React.FC<RecipeManagerProps> = ({
  onRecipeSelect,
  selectedRecipeId,
  familyMembers = []
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [mealHistory, setMealHistory] = useState<MealHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [isEditingRecipe, setIsEditingRecipe] = useState(false);
  const [isImportingRecipe, setIsImportingRecipe] = useState(false);
  const [isCreatingMealPlan, setIsCreatingMealPlan] = useState(false);
  const [activeTab, setActiveTab] = useState<'recipes' | 'meal-plans'>('recipes');

  const dal = createDAL();

  useEffect(() => {
    loadRecipes();
    loadMealPlans();
    loadMealHistory();
  }, []);

  const loadRecipes = async () => {
    try {
      const recipeList = await dal.getRecipes();

      // If no recipes exist, add sample recipes
      if (recipeList.length === 0) {
        for (const sampleRecipe of sampleRecipes) {
          try {
            const createdRecipe = await dal.createRecipe({
              ...sampleRecipe,
              createdBy: familyMembers.length > 0 ? familyMembers[0].id : 'sample-user'
            });
            recipeList.push(createdRecipe);
          } catch (error) {
            console.error('Failed to create sample recipe:', error);
          }
        }
      }

      setRecipes(recipeList);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  };

  const loadMealPlans = async () => {
    try {
      const planList = await dal.getMealPlans();
      setMealPlans(planList);
    } catch (error) {
      console.error('Failed to load meal plans:', error);
    }
  };

  const loadMealHistory = async () => {
    try {
      const historyList = await dal.getMealHistory();
      setMealHistory(historyList);
    } catch (error) {
      console.error('Failed to load meal history:', error);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    if (onRecipeSelect) {
      onRecipeSelect(recipe);
    }
  };

  const handleCreateRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    try {
      const newRecipe = await dal.createRecipe(recipeData);
      setRecipes(prev => [...prev, newRecipe]);
      setIsCreatingRecipe(false);
    } catch (error) {
      console.error('Failed to create recipe:', error);
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsEditingRecipe(true);
  };

  const handleUpdateRecipe = async (recipeData: Recipe) => {
    try {
      const updatedRecipe = await dal.updateRecipe(recipeData.id, recipeData);
      setRecipes(prev => prev.map(r => r.id === recipeData.id ? updatedRecipe : r));
      setIsEditingRecipe(false);
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Failed to update recipe:', error);
    }
  };

  const handleImportRecipe = (importedRecipe: Recipe) => {
    setRecipes(prev => [...prev, importedRecipe]);
    setIsImportingRecipe(false);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await dal.deleteRecipe(recipeId);
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    }
  };

  return (
    <div className="recipe-manager">
      <div className="recipe-header">
        <h2>Recipe & Meal Planning</h2>
        <div className="recipe-tabs">
          <button
            className={`tab-button ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            Recipes
          </button>
          <button
            className={`tab-button ${activeTab === 'meal-plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('meal-plans')}
          >
            Meal Plans
          </button>
        </div>
      </div>

      {activeTab === 'recipes' && (
        <div className="recipes-section">
          <div className="recipes-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="recipe-action-buttons">
              <button
                className="btn-secondary"
                onClick={() => setIsImportingRecipe(true)}
              >
                Import Recipe
              </button>
              <button
                className="btn-primary"
                onClick={() => setIsCreatingRecipe(true)}
              >
                Add Recipe
              </button>
            </div>
          </div>

          <div className="recipes-grid">
            {filteredRecipes.map(recipe => (
              <div
                key={recipe.id}
                className={`recipe-card ${selectedRecipeId === recipe.id ? 'selected' : ''}`}
                onClick={() => handleRecipeSelect(recipe)}
              >
                {recipe.imageUrl && (
                  <img src={recipe.imageUrl} alt={recipe.name} className="recipe-image" />
                )}
                <div className="recipe-content">
                  <h3 className="recipe-title">{recipe.name}</h3>
                  {recipe.description && (
                    <p className="recipe-description">{recipe.description}</p>
                  )}
                  <div className="recipe-meta">
                    <span className="recipe-time">⏱️ {(recipe.prepTime || 0) + (recipe.cookTime || 0)}min</span>
                    <span className="recipe-servings">👥 {recipe.servings}</span>
                    {recipe.rating && (
                      <span className="recipe-rating">⭐ {recipe.rating}</span>
                    )}
                  </div>
                  <div className="recipe-tags">
                    {recipe.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="recipe-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="recipe-actions">
                  <button
                    className="btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRecipeSelect(recipe);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="btn-sm btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditRecipe(recipe);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRecipe(recipe.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedRecipe && (
            <div className="recipe-detail">
              <h3>{selectedRecipe.name}</h3>
              <div className="recipe-detail-grid">
                <div className="recipe-info">
                  <p><strong>Description:</strong> {selectedRecipe.description}</p>
                  <p><strong>Prep Time:</strong> {selectedRecipe.prepTime} minutes</p>
                  <p><strong>Cook Time:</strong> {selectedRecipe.cookTime} minutes</p>
                  <p><strong>Servings:</strong> {selectedRecipe.servings}</p>
                  <p><strong>Cuisine:</strong> {selectedRecipe.cuisine || 'Not specified'}</p>
                </div>
                <div className="recipe-ingredients">
                  <h4>Ingredients</h4>
                  <ul>
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index}>
                        {ingredient.quantity} {ingredient.unit} {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="recipe-instructions">
                  <h4>Instructions</h4>
                  <ol>
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Recipe Reviews Section */}
              <div className="recipe-reviews-section">
                <h3>Reviews & Ratings</h3>
                <RecipeReviews
                  recipe={selectedRecipe}
                  familyMembers={familyMembers}
                  mealHistory={mealHistory}
                  currentUserId={familyMembers.length > 0 ? familyMembers[0].id : undefined}
                  onReviewAdded={() => {
                    // Refresh recipe data to update average rating
                    loadRecipes();
                  }}
                  onReviewUpdated={() => {
                    // Refresh recipe data to update average rating
                    loadRecipes();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'meal-plans' && (
        <div className="meal-plans-section">
          <div className="meal-plans-controls">
            <button
              className="btn-primary"
              onClick={() => setIsCreatingMealPlan(true)}
            >
              Create Meal Plan
            </button>
          </div>

          <div className="meal-plans-list">
            {mealPlans.map(plan => (
              <div key={plan.id} className="meal-plan-card">
                <h3>{new Date(plan.date).toLocaleDateString()}</h3>
                <div className="meal-plan-meals">
                  {Object.entries(plan.meals).map(([mealType, meal]) => {
                    if (meal && 'recipeId' in meal && meal.recipeId) {
                      const recipe = recipes.find(r => r.id === meal.recipeId);
                      return (
                        <div key={mealType} className="meal-plan-item">
                          <strong>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}:</strong>
                          {recipe ? recipe.name : 'Unknown Recipe'}
                          <span className="meal-servings">({meal.servings} servings)</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                {plan.totalNutrition && (
                  <div className="meal-plan-nutrition">
                    <h4>Daily Nutrition</h4>
                    <div className="nutrition-grid">
                      <span>Calories: {plan.totalNutrition.calories}</span>
                      <span>Protein: {plan.totalNutrition.protein}g</span>
                      <span>Carbs: {plan.totalNutrition.carbs}g</span>
                      <span>Fat: {plan.totalNutrition.fat}g</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipe Editor Modals */}
      {(isCreatingRecipe || isEditingRecipe) && (
        <div className="modal-overlay" onClick={() => {
          setIsCreatingRecipe(false);
          setIsEditingRecipe(false);
          setSelectedRecipe(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <RecipeEditor
              recipe={isEditingRecipe && selectedRecipe ? selectedRecipe : undefined}
              onSave={(recipe) => {
                if (isEditingRecipe) {
                  handleUpdateRecipe(recipe);
                } else {
                  handleCreateRecipe(recipe);
                }
              }}
              onCancel={() => {
                setIsCreatingRecipe(false);
                setIsEditingRecipe(false);
                setSelectedRecipe(null);
              }}
              familyMembers={familyMembers}
            />
          </div>
        </div>
      )}

      {/* Recipe Importer Modal */}
      {isImportingRecipe && (
        <div className="modal-overlay" onClick={() => setIsImportingRecipe(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <RecipeImporter
              onRecipeImported={handleImportRecipe}
              onCancel={() => setIsImportingRecipe(false)}
              familyMembers={familyMembers}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManager;