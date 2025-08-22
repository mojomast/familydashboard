import React, { useState, useMemo } from 'react';
import type { Recipe, MealHistory, UserProfile } from '../types';

interface RecipeAnalyticsProps {
  recipes: Recipe[];
  mealHistory: MealHistory[];
  familyMembers: UserProfile[];
  dateRange?: { start: string; end: string };
}

interface RecipeUsageStats {
  recipeId: string;
  recipeName: string;
  totalUses: number;
  averageRating: number;
  familyMemberUses: Record<string, number>;
  mealTypeDistribution: Record<string, number>;
  seasonalUsage: Record<string, number>;
  lastUsed?: string;
  firstUsed?: string;
  averageServings: number;
}

interface UsageTrend {
  period: string;
  recipeUsage: Record<string, number>;
  totalMeals: number;
}

export const RecipeAnalytics: React.FC<RecipeAnalyticsProps> = ({
  recipes,
  mealHistory,
  familyMembers,
  dateRange
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'preferences' | 'performance'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);

  // Filter meal history by date range
  const filteredMealHistory = useMemo(() => {
    if (!dateRange) return mealHistory;
    return mealHistory.filter(meal =>
      meal.date >= dateRange.start && meal.date <= dateRange.end && meal.recipeId
    );
  }, [mealHistory, dateRange]);

  // Calculate comprehensive recipe usage statistics
  const recipeStats = useMemo(() => {
    const stats: Record<string, RecipeUsageStats> = {};

    // Initialize stats for all recipes
    recipes.forEach(recipe => {
      stats[recipe.id] = {
        recipeId: recipe.id,
        recipeName: recipe.name,
        totalUses: 0,
        averageRating: recipe.rating || 0,
        familyMemberUses: {},
        mealTypeDistribution: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
        seasonalUsage: { winter: 0, spring: 0, summer: 0, fall: 0 },
        averageServings: 0
      };
    });

    // Process meal history
    filteredMealHistory.forEach(meal => {
      if (!meal.recipeId || !stats[meal.recipeId]) return;

      const stat = stats[meal.recipeId];
      const mealDate = new Date(meal.date);
      const month = mealDate.getMonth();

      // Basic usage tracking
      stat.totalUses++;
      stat.averageServings = ((stat.averageServings * (stat.totalUses - 1)) + (meal.actualServings || meal.servings)) / stat.totalUses;

      // Family member usage
      meal.familyMembers.forEach(memberId => {
        stat.familyMemberUses[memberId] = (stat.familyMemberUses[memberId] || 0) + 1;
      });

      // Meal type distribution
      stat.mealTypeDistribution[meal.mealType]++;

      // Seasonal usage
      if (month >= 0 && month <= 2) stat.seasonalUsage.winter++;
      else if (month >= 3 && month <= 5) stat.seasonalUsage.spring++;
      else if (month >= 6 && month <= 8) stat.seasonalUsage.summer++;
      else stat.seasonalUsage.fall++;

      // Track first and last usage
      if (!stat.firstUsed || meal.date < stat.firstUsed) {
        stat.firstUsed = meal.date;
      }
      if (!stat.lastUsed || meal.date > stat.lastUsed) {
        stat.lastUsed = meal.date;
      }
    });

    return Object.values(stats).filter(stat => stat.totalUses > 0);
  }, [recipes, filteredMealHistory]);

  // Calculate usage trends over time
  const usageTrends = useMemo(() => {
    const trends: UsageTrend[] = [];
    const periodMap = new Map<string, MealHistory[]>();

    filteredMealHistory.forEach(meal => {
      if (!meal.recipeId) return;

      const mealDate = new Date(meal.date);
      let periodKey: string;

      switch (selectedPeriod) {
        case 'week':
          const weekStart = new Date(mealDate);
          weekStart.setDate(mealDate.getDate() - mealDate.getDay());
          periodKey = weekStart.toISOString().slice(0, 10);
          break;
        case 'month':
          periodKey = `${mealDate.getFullYear()}-${String(mealDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(mealDate.getMonth() / 3) + 1;
          periodKey = `${mealDate.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          periodKey = String(mealDate.getFullYear());
          break;
      }

      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, []);
      }
      periodMap.get(periodKey)!.push(meal);
    });

    // Convert to trends
    periodMap.forEach((meals, period) => {
      const recipeUsage: Record<string, number> = {};
      meals.forEach(meal => {
        if (meal.recipeId) {
          recipeUsage[meal.recipeId] = (recipeUsage[meal.recipeId] || 0) + 1;
        }
      });

      trends.push({
        period,
        recipeUsage,
        totalMeals: meals.length
      });
    });

    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredMealHistory, selectedPeriod]);

  // Calculate family member preferences
  const familyPreferences = useMemo(() => {
    const preferences: Record<string, {
      memberName: string;
      favoriteRecipes: Array<{ recipeId: string; recipeName: string; uses: number; rating?: number }>;
      mealTypePreferences: Record<string, number>;
      totalMeals: number;
    }> = {};

    familyMembers.forEach(member => {
      preferences[member.id] = {
        memberName: member.name,
        favoriteRecipes: [],
        mealTypePreferences: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
        totalMeals: 0
      };
    });

    filteredMealHistory.forEach(meal => {
      meal.familyMembers.forEach(memberId => {
        if (preferences[memberId]) {
          preferences[memberId].totalMeals++;
          preferences[memberId].mealTypePreferences[meal.mealType]++;
        }
      });
    });

    // Calculate favorite recipes for each member
    Object.keys(preferences).forEach(memberId => {
      const memberMeals = filteredMealHistory.filter(meal =>
        meal.familyMembers.includes(memberId) && meal.recipeId
      );

      const recipeCounts: Record<string, number> = {};
      memberMeals.forEach(meal => {
        if (meal.recipeId) {
          recipeCounts[meal.recipeId] = (recipeCounts[meal.recipeId] || 0) + 1;
        }
      });

      preferences[memberId].favoriteRecipes = Object.entries(recipeCounts)
        .map(([recipeId, uses]) => {
          const recipe = recipes.find(r => r.id === recipeId);
          return {
            recipeId,
            recipeName: recipe?.name || 'Unknown Recipe',
            uses,
            rating: recipe?.rating
          };
        })
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 5);
    });

    return Object.values(preferences);
  }, [familyMembers, filteredMealHistory, recipes]);

  const renderOverview = () => (
    <div className="analytics-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Recipes Used</h3>
          <div className="stat-value">{recipeStats.length}</div>
        </div>
        <div className="stat-card">
          <h3>Total Meals</h3>
          <div className="stat-value">{filteredMealHistory.length}</div>
        </div>
        <div className="stat-card">
          <h3>Average Meals per Recipe</h3>
          <div className="stat-value">
            {recipeStats.length > 0 ? Math.round((filteredMealHistory.length / recipeStats.length) * 10) / 10 : 0}
          </div>
        </div>
        <div className="stat-card">
          <h3>Most Popular Recipe</h3>
          <div className="stat-value">
            {recipeStats.length > 0 ? recipeStats.reduce((prev, current) =>
              prev.totalUses > current.totalUses ? prev : current
            ).recipeName : 'None'}
          </div>
        </div>
      </div>

      <div className="top-recipes-section">
        <h3>Most Used Recipes</h3>
        <div className="recipes-list">
          {recipeStats
            .sort((a, b) => b.totalUses - a.totalUses)
            .slice(0, 10)
            .map((stat, index) => (
              <div
                key={stat.recipeId}
                className="recipe-stat-item"
                onClick={() => setSelectedRecipe(stat.recipeId)}
              >
                <div className="rank">#{index + 1}</div>
                <div className="recipe-info">
                  <h4>{stat.recipeName}</h4>
                  <div className="recipe-metrics">
                    <span>Used {stat.totalUses} times</span>
                    {stat.averageRating > 0 && (
                      <span> • ⭐ {stat.averageRating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
                <div className="usage-bar">
                  <div
                    className="usage-fill"
                    style={{
                      width: `${(stat.totalUses / Math.max(...recipeStats.map(s => s.totalUses))) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="analytics-trends">
      <div className="trends-controls">
        <h3>Usage Trends</h3>
        <div className="period-selector">
          <label>Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="form-select"
            title="Select time period for usage trends"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
            <option value="year">Yearly</option>
          </select>
        </div>
      </div>

      <div className="trends-chart">
        {usageTrends.map((trend, index) => (
          <div key={trend.period} className="trend-item">
            <div className="trend-period">{trend.period}</div>
            <div className="trend-bar">
              <div
                className="trend-fill"
                style={{
                  width: `${(trend.totalMeals / Math.max(...usageTrends.map(t => t.totalMeals))) * 100}%`
                }}
              >
                <span className="trend-count">{trend.totalMeals}</span>
              </div>
            </div>
            <div className="trend-top-recipes">
              {Object.entries(trend.recipeUsage)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([recipeId, count]) => {
                  const recipe = recipes.find(r => r.id === recipeId);
                  return (
                    <span key={recipeId} className="trend-recipe">
                      {recipe?.name}: {count}
                    </span>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="analytics-preferences">
      <h3>Family Member Preferences</h3>
      <div className="preferences-grid">
        {familyPreferences.map(preference => (
          <div key={preference.memberName} className="preference-card">
            <h4>{preference.memberName}</h4>
            <div className="preference-stats">
              <div className="stat">Total meals: {preference.totalMeals}</div>
              <div className="meal-preferences">
                <h5>Favorite Meal Types:</h5>
                {Object.entries(preference.mealTypePreferences)
                  .sort(([,a], [,b]) => b - a)
                  .map(([mealType, count]) => (
                    <div key={mealType} className="meal-pref">
                      {mealType}: {count}
                    </div>
                  ))}
              </div>
              <div className="favorite-recipes">
                <h5>Favorite Recipes:</h5>
                {preference.favoriteRecipes.map(recipe => (
                  <div key={recipe.recipeId} className="fav-recipe">
                    {recipe.recipeName} ({recipe.uses} times)
                    {recipe.rating && <span> ⭐ {recipe.rating}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformance = () => {
    const selectedStat = selectedRecipe ? recipeStats.find(s => s.recipeId === selectedRecipe) : null;

    return (
      <div className="analytics-performance">
        <div className="performance-header">
          <h3>Recipe Performance</h3>
          <select
            value={selectedRecipe || ''}
            onChange={(e) => setSelectedRecipe(e.target.value || null)}
            className="form-select"
            title="Select recipe for performance analysis"
          >
            <option value="">Select a recipe...</option>
            {recipeStats
              .sort((a, b) => b.totalUses - a.totalUses)
              .map(stat => (
                <option key={stat.recipeId} value={stat.recipeId}>
                  {stat.recipeName}
                </option>
              ))}
          </select>
        </div>

        {selectedStat ? (
          <div className="performance-details">
            <h4>{selectedStat.recipeName}</h4>

            <div className="performance-metrics">
              <div className="metric-group">
                <h5>Usage Statistics</h5>
                <div className="metrics">
                  <div>Total Uses: {selectedStat.totalUses}</div>
                  <div>Average Servings: {selectedStat.averageServings.toFixed(1)}</div>
                  <div>First Used: {selectedStat.firstUsed ? new Date(selectedStat.firstUsed).toLocaleDateString() : 'Never'}</div>
                  <div>Last Used: {selectedStat.lastUsed ? new Date(selectedStat.lastUsed).toLocaleDateString() : 'Never'}</div>
                </div>
              </div>

              <div className="metric-group">
                <h5>Meal Type Distribution</h5>
                <div className="distribution-bars">
                  {Object.entries(selectedStat.mealTypeDistribution).map(([mealType, count]) => (
                    <div key={mealType} className="dist-bar">
                      <span className="dist-label">{mealType}</span>
                      <div className="dist-fill">
                        <div
                          className="dist-fill-inner"
                          style={{
                            width: `${(count / selectedStat.totalUses) * 100}%`
                          }}
                        />
                        <span className="dist-count">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="metric-group">
                <h5>Seasonal Usage</h5>
                <div className="seasonal-bars">
                  {Object.entries(selectedStat.seasonalUsage).map(([season, count]) => (
                    <div key={season} className="season-bar">
                      <span className="season-label">{season}</span>
                      <div className="season-fill">
                        <div
                          className="season-fill-inner"
                          style={{
                            width: `${(count / selectedStat.totalUses) * 100}%`
                          }}
                        />
                        <span className="season-count">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="metric-group">
                <h5>Family Member Usage</h5>
                <div className="member-usage">
                  {Object.entries(selectedStat.familyMemberUses)
                    .sort(([,a], [,b]) => b - a)
                    .map(([memberId, uses]) => {
                      const member = familyMembers.find(m => m.id === memberId);
                      return (
                        <div key={memberId} className="member-usage-item">
                          <span className="member-name">{member?.name || 'Unknown'}</span>
                          <span className="member-uses">{uses} uses</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-selection">Select a recipe to view detailed performance metrics.</div>
        )}
      </div>
    );
  };

  return (
    <div className="recipe-analytics">
      <div className="analytics-header">
        <h2>Recipe Usage Analytics</h2>
        <div className="view-tabs">
          <button
            className={`tab-button ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-button ${activeView === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveView('trends')}
          >
            Trends
          </button>
          <button
            className={`tab-button ${activeView === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveView('preferences')}
          >
            Preferences
          </button>
          <button
            className={`tab-button ${activeView === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveView('performance')}
          >
            Performance
          </button>
        </div>
      </div>

      <div className="analytics-content">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'trends' && renderTrends()}
        {activeView === 'preferences' && renderPreferences()}
        {activeView === 'performance' && renderPerformance()}
      </div>
    </div>
  );
};

export default RecipeAnalytics;