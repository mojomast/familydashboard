import React, { useState, useEffect } from 'react';
import type { Recipe, UserProfile } from '../types';
import { createDAL } from '../lib/dal';

interface RecipeEditorProps {
  recipe?: Recipe;
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
  familyMembers: UserProfile[];
}

export const RecipeEditor: React.FC<RecipeEditorProps> = ({
  recipe,
  onSave,
  onCancel,
  familyMembers
}) => {
  const [formData, setFormData] = useState<Partial<Recipe>>({
    name: '',
    description: '',
    ingredients: [{ name: '', quantity: 0, unit: '', category: '' }],
    instructions: [''],
    prepTime: 0,
    cookTime: 0,
    servings: 4,
    cuisine: '',
    dietaryRestrictions: [],
    nutritionalInfo: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    },
    tags: [],
    createdBy: familyMembers[0]?.id || '',
    rating: 0
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (recipe) {
      setFormData(recipe);
    }
    // Set current user
    if (familyMembers.length > 0) {
      setCurrentUser(familyMembers[0]);
    }
  }, [recipe, familyMembers]);

  const handleChange = (field: keyof Recipe, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const newIngredients = [...formData.ingredients!];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients!, { name: '', quantity: 0, unit: '', category: '' }]
    }));
  };

  const removeIngredient = (index: number) => {
    const newIngredients = formData.ingredients!.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...formData.instructions!];
    newInstructions[index] = value;
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions!, '']
    }));
  };

  const removeInstruction = (index: number) => {
    const newInstructions = formData.instructions!.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const handleNutritionChange = (field: keyof NonNullable<Recipe['nutritionalInfo']>, value: number) => {
    setFormData(prev => ({
      ...prev,
      nutritionalInfo: { ...prev.nutritionalInfo!, [field]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recipeData: Recipe = {
      ...formData as Recipe,
      id: recipe?.id || `recipe_${Date.now()}`,
      createdAt: recipe?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.id || '',
      usageCount: recipe?.usageCount || 0
    };

    onSave(recipeData);
  };

  return (
    <div className="recipe-editor">
      <div className="recipe-editor-header">
        <h2>{recipe ? 'Edit Recipe' : 'Create New Recipe'}</h2>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="recipe-form">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="name">Recipe Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prepTime">Prep Time (min)</label>
              <input
                type="number"
                id="prepTime"
                value={formData.prepTime}
                onChange={(e) => handleChange('prepTime', parseInt(e.target.value) || 0)}
                min="0"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cookTime">Cook Time (min)</label>
              <input
                type="number"
                id="cookTime"
                value={formData.cookTime}
                onChange={(e) => handleChange('cookTime', parseInt(e.target.value) || 0)}
                min="0"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="servings">Servings</label>
              <input
                type="number"
                id="servings"
                value={formData.servings}
                onChange={(e) => handleChange('servings', parseInt(e.target.value) || 1)}
                min="1"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cuisine">Cuisine</label>
              <input
                type="text"
                id="cuisine"
                value={formData.cuisine}
                onChange={(e) => handleChange('cuisine', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rating">Rating (1-5)</label>
              <input
                type="number"
                id="rating"
                value={formData.rating}
                onChange={(e) => handleChange('rating', parseFloat(e.target.value) || 0)}
                min="0"
                max="5"
                step="0.5"
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Ingredients</h3>
          {formData.ingredients?.map((ingredient, index) => (
            <div key={index} className="ingredient-row">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                className="form-input ingredient-name"
                required
              />
              <input
                type="number"
                placeholder="Qty"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                className="form-input ingredient-qty"
                min="0"
                step="0.1"
              />
              <input
                type="text"
                placeholder="Unit"
                value={ingredient.unit}
                onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                className="form-input ingredient-unit"
              />
              <input
                type="text"
                placeholder="Category"
                value={ingredient.category}
                onChange={(e) => handleIngredientChange(index, 'category', e.target.value)}
                className="form-input ingredient-category"
              />
              {formData.ingredients!.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="btn-danger btn-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addIngredient} className="btn-secondary">
            Add Ingredient
          </button>
        </div>

        <div className="form-section">
          <h3>Instructions</h3>
          {formData.instructions?.map((instruction, index) => (
            <div key={index} className="instruction-row">
              <span className="instruction-number">{index + 1}.</span>
              <textarea
                placeholder="Instruction step"
                value={instruction}
                onChange={(e) => handleInstructionChange(index, e.target.value)}
                className="form-input instruction-text"
                rows={2}
              />
              {formData.instructions!.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="btn-danger btn-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addInstruction} className="btn-secondary">
            Add Instruction
          </button>
        </div>

        <div className="form-section">
          <h3>Nutrition Information (per serving)</h3>
          <div className="nutrition-grid">
            <div className="form-group">
              <label htmlFor="calories">Calories</label>
              <input
                type="number"
                id="calories"
                value={formData.nutritionalInfo?.calories || 0}
                onChange={(e) => handleNutritionChange('calories', parseInt(e.target.value) || 0)}
                min="0"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="protein">Protein (g)</label>
              <input
                type="number"
                id="protein"
                value={formData.nutritionalInfo?.protein || 0}
                onChange={(e) => handleNutritionChange('protein', parseInt(e.target.value) || 0)}
                min="0"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="carbs">Carbs (g)</label>
              <input
                type="number"
                id="carbs"
                value={formData.nutritionalInfo?.carbs || 0}
                onChange={(e) => handleNutritionChange('carbs', parseInt(e.target.value) || 0)}
                min="0"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fat">Fat (g)</label>
              <input
                type="number"
                id="fat"
                value={formData.nutritionalInfo?.fat || 0}
                onChange={(e) => handleNutritionChange('fat', parseInt(e.target.value) || 0)}
                min="0"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fiber">Fiber (g)</label>
              <input
                type="number"
                id="fiber"
                value={formData.nutritionalInfo?.fiber || 0}
                onChange={(e) => handleNutritionChange('fiber', parseInt(e.target.value) || 0)}
                min="0"
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="tags">Tags (comma separated)</label>
            <input
              type="text"
              id="tags"
              value={formData.tags?.join(', ') || ''}
              onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
              className="form-input"
              placeholder="quick, healthy, vegetarian, etc."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {recipe ? 'Update Recipe' : 'Create Recipe'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeEditor;