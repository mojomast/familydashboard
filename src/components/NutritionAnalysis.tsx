import React, { useState, useMemo } from 'react';
import type { MealHistory, Recipe, UserProfile } from '../types';

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  potassium?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
}

interface NutritionAnalysisProps {
  mealHistory: MealHistory[];
  recipes: Recipe[];
  familyMembers: UserProfile[];
  dateRange?: { start: string; end: string };
}

interface DailyNutrition {
  date: string;
  totalNutrition: NutritionInfo;
  meals: Array<{
    mealHistory: MealHistory;
    recipe?: Recipe;
    nutrition: NutritionInfo;
  }>;
}

interface FamilyMemberNutrition {
  memberId: string;
  memberName: string;
  totalNutrition: NutritionInfo;
  mealCount: number;
  averageRating?: number;
}

export const NutritionAnalysis: React.FC<NutritionAnalysisProps> = ({
  mealHistory,
  recipes,
  familyMembers,
  dateRange
}) => {
  const [activeView, setActiveView] = useState<'daily' | 'family' | 'summary'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Filter meal history by date range
  const filteredMealHistory = useMemo(() => {
    if (!dateRange) return mealHistory;
    return mealHistory.filter(meal =>
      meal.date >= dateRange.start && meal.date <= dateRange.end
    );
  }, [mealHistory, dateRange]);

  // Calculate nutrition for a meal
  const calculateMealNutrition = (meal: MealHistory): NutritionInfo => {
    if (meal.customMeal) {
      // For custom meals, use basic estimates
      return {
        calories: 400, // rough estimate
        protein: 20,
        carbs: 45,
        fat: 15,
        fiber: 5
      };
    }

    if (meal.recipeId) {
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (recipe?.nutritionalInfo) {
        const multiplier = meal.servings / (recipe.servings || 1);
        return {
          calories: Math.round((recipe.nutritionalInfo.calories || 0) * multiplier),
          protein: Math.round((recipe.nutritionalInfo.protein || 0) * multiplier),
          carbs: Math.round((recipe.nutritionalInfo.carbs || 0) * multiplier),
          fat: Math.round((recipe.nutritionalInfo.fat || 0) * multiplier),
          fiber: Math.round((recipe.nutritionalInfo.fiber || 0) * multiplier),
          sugar: Math.round((recipe.nutritionalInfo.sugar || 0) * multiplier),
          sodium: Math.round((recipe.nutritionalInfo.sodium || 0) * multiplier),
          cholesterol: Math.round((recipe.nutritionalInfo.cholesterol || 0) * multiplier),
          potassium: Math.round((recipe.nutritionalInfo.potassium || 0) * multiplier),
          vitaminA: Math.round((recipe.nutritionalInfo.vitaminA || 0) * multiplier),
          vitaminC: Math.round((recipe.nutritionalInfo.vitaminC || 0) * multiplier),
          calcium: Math.round((recipe.nutritionalInfo.calcium || 0) * multiplier),
          iron: Math.round((recipe.nutritionalInfo.iron || 0) * multiplier)
        };
      }
    }

    // Default fallback
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };
  };

  // Calculate daily nutrition summaries
  const dailyNutrition = useMemo(() => {
    const dailyMap = new Map<string, DailyNutrition>();

    filteredMealHistory.forEach(meal => {
      if (!dailyMap.has(meal.date)) {
        dailyMap.set(meal.date, {
          date: meal.date,
          totalNutrition: {
            calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
            sugar: 0, sodium: 0, cholesterol: 0, potassium: 0,
            vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0
          },
          meals: []
        });
      }

      const daily = dailyMap.get(meal.date)!;
      const mealNutrition = calculateMealNutrition(meal);

      // Add to daily total
      Object.keys(mealNutrition).forEach(key => {
        const nutritionKey = key as keyof NutritionInfo;
        if (mealNutrition[nutritionKey] !== undefined) {
          daily.totalNutrition[nutritionKey] = (daily.totalNutrition[nutritionKey] || 0) + (mealNutrition[nutritionKey] || 0);
        }
      });

      // Add meal to daily meals
      const recipe = meal.recipeId ? recipes.find(r => r.id === meal.recipeId) : undefined;
      daily.meals.push({
        mealHistory: meal,
        recipe,
        nutrition: mealNutrition
      });
    });

    return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredMealHistory, recipes]);

  // Calculate family member nutrition
  const familyNutrition = useMemo(() => {
    const memberMap = new Map<string, FamilyMemberNutrition>();

    filteredMealHistory.forEach(meal => {
      meal.familyMembers.forEach(memberId => {
        if (!memberMap.has(memberId)) {
          const member = familyMembers.find(m => m.id === memberId);
          memberMap.set(memberId, {
            memberId,
            memberName: member?.name || 'Unknown',
            totalNutrition: {
              calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
              sugar: 0, sodium: 0, cholesterol: 0, potassium: 0,
              vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0
            },
            mealCount: 0,
            averageRating: 0
          });
        }

        const member = memberMap.get(memberId)!;
        const mealNutrition = calculateMealNutrition(meal);

        // Add to member total
        Object.keys(mealNutrition).forEach(key => {
          const nutritionKey = key as keyof NutritionInfo;
          if (mealNutrition[nutritionKey] !== undefined) {
            member.totalNutrition[nutritionKey] = (member.totalNutrition[nutritionKey] || 0) + (mealNutrition[nutritionKey] || 0);
          }
        });
        member.mealCount += 1;

        // Update average rating
        if (meal.rating) {
          const totalRating = (member.averageRating || 0) * (member.mealCount - 1) + meal.rating;
          member.averageRating = totalRating / member.mealCount;
        }
      });
    });

    return Array.from(memberMap.values()).sort((a, b) => b.mealCount - a.mealCount);
  }, [filteredMealHistory, familyMembers, recipes]);

  // Calculate overall nutrition summary
  const nutritionSummary = useMemo(() => {
    const totals: NutritionInfo = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      sugar: 0, sodium: 0, cholesterol: 0, potassium: 0,
      vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0
    };
    const dailyAverages: NutritionInfo = {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
      sugar: 0, sodium: 0, cholesterol: 0, potassium: 0,
      vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0
    };

    dailyNutrition.forEach(day => {
      Object.keys(totals).forEach(key => {
        const nutritionKey = key as keyof NutritionInfo;
        totals[nutritionKey] = (totals[nutritionKey] || 0) + (day.totalNutrition[nutritionKey] || 0);
      });
    });

    if (dailyNutrition.length > 0) {
      Object.keys(dailyAverages).forEach(key => {
        const nutritionKey = key as keyof NutritionInfo;
        dailyAverages[nutritionKey] = Math.round((totals[nutritionKey] || 0) / dailyNutrition.length);
      });
    }

    return { totals, dailyAverages, totalDays: dailyNutrition.length };
  }, [dailyNutrition]);

  const renderNutritionBar = (value: number, maxValue: number, color: string, label: string) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    return (
      <div className="nutrition-bar">
        <div className="bar-label">{label}</div>
        <div className="bar-container">
          <div
            className="bar-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: color
            }}
          />
          <span className="bar-value">{value}g</span>
        </div>
      </div>
    );
  };

  const renderDailyView = () => {
    const selectedDay = dailyNutrition.find(day => day.date === selectedDate) || dailyNutrition[0];

    if (!selectedDay) {
      return <div className="no-data">No meals recorded for the selected period.</div>;
    }

    return (
      <div className="daily-nutrition-view">
        <div className="date-selector">
          <label>Select Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-select"
            title="Select date for nutrition analysis"
          >
            {dailyNutrition.map(day => (
              <option key={day.date} value={day.date}>
                {new Date(day.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </option>
            ))}
          </select>
        </div>

        <div className="daily-summary">
          <h3>Daily Nutrition Summary</h3>
          <div className="nutrition-metrics">
            <div className="metric-card">
              <div className="metric-value">{selectedDay.totalNutrition.calories}</div>
              <div className="metric-label">Calories</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{selectedDay.totalNutrition.protein}g</div>
              <div className="metric-label">Protein</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{selectedDay.totalNutrition.carbs}g</div>
              <div className="metric-label">Carbs</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{selectedDay.totalNutrition.fat}g</div>
              <div className="metric-label">Fat</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{selectedDay.totalNutrition.fiber}g</div>
              <div className="metric-label">Fiber</div>
            </div>
          </div>
        </div>

        <div className="meal-breakdown">
          <h3>Meal Breakdown</h3>
          {selectedDay.meals.map((meal, index) => (
            <div key={index} className="meal-nutrition-item">
              <div className="meal-header">
                <span className="meal-type">{meal.mealHistory.mealType}</span>
                <span className="meal-name">
                  {meal.recipe?.name || meal.mealHistory.customMeal || 'Unknown Meal'}
                </span>
                <span className="servings">{meal.mealHistory.servings} serving{meal.mealHistory.servings > 1 ? 's' : ''}</span>
              </div>
              <div className="meal-nutrition">
                <span>{meal.nutrition.calories} cal</span>
                <span>{meal.nutrition.protein}g protein</span>
                <span>{meal.nutrition.carbs}g carbs</span>
                <span>{meal.nutrition.fat}g fat</span>
                <span>{meal.nutrition.fiber}g fiber</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFamilyView = () => (
    <div className="family-nutrition-view">
      <h3>Family Member Nutrition</h3>
      <div className="family-nutrition-grid">
        {familyNutrition.map(member => (
          <div key={member.memberId} className="family-member-card">
            <div className="member-header">
              <div className="member-avatar">
                {familyMembers.find(m => m.id === member.memberId)?.avatar || '👤'}
              </div>
              <div className="member-info">
                <h4>{member.memberName}</h4>
                <div className="member-stats">
                  <span>{member.mealCount} meals</span>
                  {member.averageRating && (
                    <span>⭐ {member.averageRating.toFixed(1)}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="member-nutrition">
              <div className="nutrition-summary">
                <div className="summary-item">
                  <span className="label">Total Calories:</span>
                  <span className="value">{member.totalNutrition.calories}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Protein:</span>
                  <span className="value">{member.totalNutrition.protein}g</span>
                </div>
                <div className="summary-item">
                  <span className="label">Carbs:</span>
                  <span className="value">{member.totalNutrition.carbs}g</span>
                </div>
                <div className="summary-item">
                  <span className="label">Fat:</span>
                  <span className="value">{member.totalNutrition.fat}g</span>
                </div>
                <div className="summary-item">
                  <span className="label">Fiber:</span>
                  <span className="value">{member.totalNutrition.fiber}g</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSummaryView = () => (
    <div className="nutrition-summary-view">
      <h3>Nutrition Summary</h3>

      <div className="summary-cards">
        <div className="summary-card">
          <h4>Total Period Nutrition</h4>
          <div className="nutrition-totals">
            <div className="total-item">
              <span className="label">Total Calories:</span>
              <span className="value large">{nutritionSummary.totals.calories.toLocaleString()}</span>
            </div>
            <div className="total-item">
              <span className="label">Total Protein:</span>
              <span className="value">{nutritionSummary.totals.protein.toLocaleString()}g</span>
            </div>
            <div className="total-item">
              <span className="label">Total Carbs:</span>
              <span className="value">{nutritionSummary.totals.carbs.toLocaleString()}g</span>
            </div>
            <div className="total-item">
              <span className="label">Total Fat:</span>
              <span className="value">{nutritionSummary.totals.fat.toLocaleString()}g</span>
            </div>
            <div className="total-item">
              <span className="label">Total Fiber:</span>
              <span className="value">{nutritionSummary.totals.fiber.toLocaleString()}g</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <h4>Daily Averages</h4>
          <div className="nutrition-averages">
            <div className="average-item">
              <span className="label">Daily Calories:</span>
              <span className="value large">{nutritionSummary.dailyAverages.calories.toLocaleString()}</span>
            </div>
            <div className="average-item">
              <span className="label">Daily Protein:</span>
              <span className="value">{nutritionSummary.dailyAverages.protein}g</span>
            </div>
            <div className="average-item">
              <span className="label">Daily Carbs:</span>
              <span className="value">{nutritionSummary.dailyAverages.carbs}g</span>
            </div>
            <div className="average-item">
              <span className="label">Daily Fat:</span>
              <span className="value">{nutritionSummary.dailyAverages.fat}g</span>
            </div>
            <div className="average-item">
              <span className="label">Daily Fiber:</span>
              <span className="value">{nutritionSummary.dailyAverages.fiber}g</span>
            </div>
          </div>
        </div>
      </div>

      <div className="nutrition-period-info">
        <p>Analysis based on {nutritionSummary.totalDays} day{nutritionSummary.totalDays !== 1 ? 's' : ''} of meal data</p>
        {dateRange && (
          <p>Period: {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="nutrition-analysis">
      <div className="analysis-header">
        <h2>Nutrition Analysis</h2>
        <div className="view-tabs">
          <button
            className={`tab-button ${activeView === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveView('daily')}
          >
            Daily View
          </button>
          <button
            className={`tab-button ${activeView === 'family' ? 'active' : ''}`}
            onClick={() => setActiveView('family')}
          >
            Family View
          </button>
          <button
            className={`tab-button ${activeView === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveView('summary')}
          >
            Summary
          </button>
        </div>
      </div>

      <div className="analysis-content">
        {activeView === 'daily' && renderDailyView()}
        {activeView === 'family' && renderFamilyView()}
        {activeView === 'summary' && renderSummaryView()}
      </div>
    </div>
  );
};

export default NutritionAnalysis;