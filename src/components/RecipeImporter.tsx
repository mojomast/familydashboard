import React, { useState } from 'react';
import type { Recipe, UserProfile } from '../types';
import { createDAL } from '../lib/dal';

interface RecipeImporterProps {
  onRecipeImported: (recipe: Recipe) => void;
  onCancel: () => void;
  familyMembers: UserProfile[];
}

export const RecipeImporter: React.FC<RecipeImporterProps> = ({
  onRecipeImported,
  onCancel,
  familyMembers
}) => {
  const [importMethod, setImportMethod] = useState<'url' | 'text' | 'json'>('url');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Partial<Recipe> | null>(null);

  const dal = createDAL();

  const parseRecipeFromText = (text: string): Partial<Recipe> => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const recipe: Partial<Recipe> = {
      name: '',
      description: '',
      ingredients: [],
      instructions: [],
      prepTime: 0,
      cookTime: 0,
      servings: 4,
      tags: [],
      createdBy: familyMembers[0]?.id || ''
    };

    let currentSection = '';
    for (const line of lines) {
      if (line.toLowerCase().includes('recipe') && !recipe.name) {
        recipe.name = line.replace(/recipe/i, '').trim();
      } else if (line.toLowerCase().includes('ingredients')) {
        currentSection = 'ingredients';
      } else if (line.toLowerCase().includes('instructions')) {
        currentSection = 'instructions';
      } else if (line.toLowerCase().includes('prep time')) {
        const timeMatch = line.match(/(\d+)/);
        if (timeMatch) recipe.prepTime = parseInt(timeMatch[1]);
      } else if (line.toLowerCase().includes('cook time')) {
        const timeMatch = line.match(/(\d+)/);
        if (timeMatch) recipe.cookTime = parseInt(timeMatch[1]);
      } else if (line.toLowerCase().includes('servings')) {
        const servingMatch = line.match(/(\d+)/);
        if (servingMatch) recipe.servings = parseInt(servingMatch[1]);
      } else if (currentSection === 'ingredients' && line.match(/^[-•*]/)) {
        const ingredientText = line.replace(/^[-•*]\s*/, '');
        recipe.ingredients!.push({
          name: ingredientText,
          quantity: 1,
          unit: '',
          category: 'other'
        });
      } else if (currentSection === 'instructions' && line.match(/^\d+\./)) {
        const instructionText = line.replace(/^\d+\.\s*/, '');
        recipe.instructions!.push(instructionText);
      } else if (!recipe.description && line.length > 20) {
        recipe.description = line;
      }
    }
    return recipe;
  };

  const parseRecipeFromJSON = (jsonText: string): Partial<Recipe> => {
    try {
      const parsed = JSON.parse(jsonText);
      return {
        name: parsed.name || parsed.title || '',
        description: parsed.description || '',
        ingredients: Array.isArray(parsed.ingredients)
          ? parsed.ingredients.map((ing: any) => ({
              name: typeof ing === 'string' ? ing : ing.name || '',
              quantity: typeof ing === 'object' ? ing.quantity || 1 : 1,
              unit: typeof ing === 'object' ? ing.unit || '' : '',
              category: typeof ing === 'object' ? ing.category || 'other' : 'other'
            }))
          : [],
        instructions: Array.isArray(parsed.instructions)
          ? parsed.instructions.map((inst: any) => typeof inst === 'string' ? inst : inst.text || '')
          : [],
        prepTime: parsed.prepTime || parsed.prep_time || 0,
        cookTime: parsed.cookTime || parsed.cook_time || 0,
        servings: parsed.servings || parsed.yield || 4,
        cuisine: parsed.cuisine || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        nutritionalInfo: parsed.nutritionalInfo || parsed.nutrition || undefined,
        createdBy: familyMembers[0]?.id || ''
      };
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  };

  const importRecipe = async () => {
    if (!inputValue.trim()) {
      setError('Please enter content to import');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let recipeData: Partial<Recipe>;

      if (importMethod === 'url') {
        // Simulate URL import
        recipeData = {
          name: 'Imported Recipe from URL',
          description: 'Recipe imported from external source',
          ingredients: [],
          instructions: [],
          createdBy: familyMembers[0]?.id || ''
        };
      } else if (importMethod === 'text') {
        recipeData = parseRecipeFromText(inputValue);
      } else if (importMethod === 'json') {
        recipeData = parseRecipeFromJSON(inputValue);
      } else {
        throw new Error('Unsupported import method');
      }

      if (!recipeData.name) {
        throw new Error('Could not extract recipe name from input');
      }

      setPreviewRecipe(recipeData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to import recipe');
      setPreviewRecipe(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (!previewRecipe) return;

    try {
      const recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
        ...previewRecipe as any,
        tags: previewRecipe.tags || [],
        ingredients: previewRecipe.ingredients || [],
        instructions: previewRecipe.instructions || []
      };

      const savedRecipe = await dal.createRecipe(recipeData);
      onRecipeImported(savedRecipe);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save recipe');
    }
  };

  return (
    <div className="recipe-importer">
      <div className="recipe-importer-header">
        <h2>Import Recipe</h2>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>

      <div className="import-method-selector">
        <label>
          <input
            type="radio"
            value="url"
            checked={importMethod === 'url'}
            onChange={(e) => setImportMethod(e.target.value as any)}
          />
          From URL
        </label>
        <label>
          <input
            type="radio"
            value="text"
            checked={importMethod === 'text'}
            onChange={(e) => setImportMethod(e.target.value as any)}
          />
          From Text
        </label>
        <label>
          <input
            type="radio"
            value="json"
            checked={importMethod === 'json'}
            onChange={(e) => setImportMethod(e.target.value as any)}
          />
          From JSON
        </label>
      </div>

      <div className="import-input-section">
        {importMethod === 'url' && (
          <div className="form-group">
            <label htmlFor="url-input">Recipe URL</label>
            <input
              type="url"
              id="url-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="https://example.com/recipe"
              className="form-input"
            />
          </div>
        )}

        {importMethod === 'text' && (
          <div className="form-group">
            <label htmlFor="text-input">Recipe Text</label>
            <textarea
              id="text-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste recipe text here..."
              rows={10}
              className="form-input"
            />
          </div>
        )}

        {importMethod === 'json' && (
          <div className="form-group">
            <label htmlFor="json-input">Recipe JSON</label>
            <textarea
              id="json-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder='{"name": "Recipe Name", "ingredients": [...], "instructions": [...]}'
              rows={10}
              className="form-input"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="import-actions">
        <button
          className="btn-primary"
          onClick={importRecipe}
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? 'Importing...' : 'Import Recipe'}
        </button>
      </div>

      {previewRecipe && (
        <div className="recipe-preview">
          <h3>Preview</h3>
          <div className="preview-content">
            <h4>{previewRecipe.name}</h4>
            {previewRecipe.description && <p>{previewRecipe.description}</p>}
            <p><strong>Prep Time:</strong> {previewRecipe.prepTime} min</p>
            <p><strong>Cook Time:</strong> {previewRecipe.cookTime} min</p>
            <p><strong>Servings:</strong> {previewRecipe.servings}</p>

            {previewRecipe.ingredients && previewRecipe.ingredients.length > 0 && (
              <div>
                <h5>Ingredients:</h5>
                <ul>
                  {previewRecipe.ingredients.map((ing, index) => (
                    <li key={index}>
                      {ing.quantity} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {previewRecipe.instructions && previewRecipe.instructions.length > 0 && (
              <div>
                <h5>Instructions:</h5>
                <ol>
                  {previewRecipe.instructions.map((inst, index) => (
                    <li key={index}>{inst}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="preview-actions">
            <button className="btn-primary" onClick={saveRecipe}>
              Save Recipe
            </button>
            <button className="btn-secondary" onClick={() => setPreviewRecipe(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeImporter;