import React, { useEffect, useState } from 'react';
import type { MealHistory, Recipe, UserProfile } from '../types';
import { createDAL } from '../lib/dal';

interface MealHistoryProps {
  familyMembers: UserProfile[];
  recipes: Recipe[];
  onAddToMealPlan?: (recipeId: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

export const MealHistoryView: React.FC<MealHistoryProps> = ({
  familyMembers,
  recipes,
  onAddToMealPlan
}) => {
  const [mealHistory, setMealHistory] = useState<MealHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // days
  const dal = createDAL();

  useEffect(() => {
    loadMealHistory();
  }, [dateRange]);

  const loadMealHistory = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      const startDateStr = startDate.toISOString().slice(0, 10);

      const history = await dal.getMealHistory({ start: startDateStr, end: endDate });
      // Sort by date descending (most recent first)
      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMealHistory(history);
    } catch (err) {
      console.error('Failed to load meal history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRecipeName = (recipeId?: string, customMeal?: string) => {
    if (customMeal) return customMeal;
    if (recipeId) {
      const recipe = recipes.find(r => r.id === recipeId);
      return recipe?.name || 'Unknown Recipe';
    }
    return 'Unknown Meal';
  };

  const getFamilyMemberNames = (memberIds: string[]) => {
    return memberIds
      .map(id => familyMembers.find(m => m.id === id)?.name || 'Unknown')
      .join(', ');
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌙';
      case 'snack': return '🍪';
      default: return '🍽️';
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '⭐' : '');
  };

  const groupMealsByDate = (meals: MealHistory[]) => {
    const grouped: Record<string, MealHistory[]> = {};
    meals.forEach(meal => {
      if (!grouped[meal.date]) {
        grouped[meal.date] = [];
      }
      grouped[meal.date].push(meal);
    });
    return grouped;
  };

  const getRecentRecipes = () => {
    const recipeCounts: Record<string, number> = {};
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Last 7 days

    mealHistory
      .filter(meal => new Date(meal.date) >= cutoffDate && meal.recipeId)
      .forEach(meal => {
        if (meal.recipeId) {
          recipeCounts[meal.recipeId] = (recipeCounts[meal.recipeId] || 0) + 1;
        }
      });

    return Object.entries(recipeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5); // Top 5 most used recipes
  };

  const groupedMeals = groupMealsByDate(mealHistory);
  const recentRecipes = getRecentRecipes();

  return (
    <div className="meal-history">
      <div className="section-header">
        <h2>Meal History</h2>
        <div className="date-range-selector">
          <label>Show last:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="form-select"
            title="Select time range for meal history"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading meal history...</div>
      ) : (
        <>
          {/* Recent Recipe Usage Summary */}
          {recentRecipes.length > 0 && (
            <div className="recent-recipes-summary">
              <h3>Most Used Recipes (Last 7 Days)</h3>
              <div className="recipe-usage-list">
                {recentRecipes.map(([recipeId, count]) => {
                  const recipe = recipes.find(r => r.id === recipeId);
                  if (!recipe) return null;
                  return (
                    <div key={recipeId} className="recipe-usage-item">
                      <div className="recipe-info">
                        <span className="recipe-name">{recipe.name}</span>
                        <span className="usage-count">Used {count} time{count > 1 ? 's' : ''}</span>
                      </div>
                      {onAddToMealPlan && (
                        <div className="quick-add-buttons">
                          {['breakfast', 'lunch', 'dinner'].map(mealType => (
                            <button
                              key={mealType}
                              onClick={() => onAddToMealPlan(recipeId, mealType as any)}
                              className="btn-sm btn-secondary"
                              title={`Add ${recipe.name} to ${mealType}`}
                            >
                              {mealType.charAt(0).toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meal History by Date */}
          <div className="meal-history-list">
            {Object.keys(groupedMeals).length === 0 ? (
              <div className="empty-state">
                <p>No meals recorded in the selected time period.</p>
                <p>Start planning meals to build your history!</p>
              </div>
            ) : (
              Object.entries(groupedMeals)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, meals]) => (
                  <div key={date} className="meal-history-date-group">
                    <h3 className="date-header">
                      {new Date(date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <div className="meals-for-date">
                      {meals.map(meal => (
                        <div key={meal.id} className="meal-history-item">
                          <div className="meal-header">
                            <span className="meal-type-icon">
                              {getMealTypeIcon(meal.mealType)}
                            </span>
                            <span className="meal-name">
                              {getRecipeName(meal.recipeId, meal.customMeal)}
                            </span>
                            {meal.rating && (
                              <span className="meal-rating">
                                {renderStars(meal.rating)}
                              </span>
                            )}
                          </div>

                          <div className="meal-details">
                            <div className="meal-servings">
                              {meal.actualServings || meal.servings} serving{(meal.actualServings || meal.servings) > 1 ? 's' : ''}
                              {meal.familyMembers.length > 0 && (
                                <span className="family-members">
                                  • {getFamilyMemberNames(meal.familyMembers)}
                                </span>
                              )}
                            </div>

                            {meal.notes && (
                              <div className="meal-notes">{meal.notes}</div>
                            )}

                            {meal.leftovers && (
                              <div className="meal-leftovers">
                                <strong>Leftovers:</strong> {meal.leftovers}
                              </div>
                            )}
                          </div>

                          {onAddToMealPlan && meal.recipeId && (
                            <div className="meal-actions">
                              <button
                                onClick={() => onAddToMealPlan(meal.recipeId!, meal.mealType)}
                                className="btn-sm btn-primary"
                                title="Add to meal plan"
                              >
                                Plan Again
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MealHistoryView;