import type { Recipe } from '../types';

export const sampleRecipes: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: 'Classic Spaghetti Bolognese',
    description: 'A hearty Italian pasta dish with rich meat sauce',
    ingredients: [
      { name: 'ground beef', quantity: 1, unit: 'lb', category: 'meat' },
      { name: 'onion', quantity: 1, unit: 'medium', category: 'produce' },
      { name: 'garlic', quantity: 3, unit: 'cloves', category: 'produce' },
      { name: 'carrot', quantity: 2, unit: 'medium', category: 'produce' },
      { name: 'celery', quantity: 2, unit: 'stalks', category: 'produce' },
      { name: 'canned tomatoes', quantity: 28, unit: 'oz', category: 'canned' },
      { name: 'tomato paste', quantity: 2, unit: 'tbsp', category: 'canned' },
      { name: 'red wine', quantity: 0.5, unit: 'cup', category: 'beverages' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp', category: 'oils' },
      { name: 'spaghetti', quantity: 1, unit: 'lb', category: 'pasta' },
      { name: 'Parmesan cheese', quantity: 0.5, unit: 'cup', category: 'dairy' },
    ],
    instructions: [
      'Finely chop onion, garlic, carrot, and celery',
      'Heat olive oil in large pot over medium heat',
      'Add chopped vegetables and cook for 5-7 minutes until softened',
      'Add ground beef and cook until browned, breaking up with spoon',
      'Stir in tomato paste and cook for 2 minutes',
      'Add red wine and cook until mostly evaporated',
      'Add canned tomatoes and simmer for 30-45 minutes',
      'Season with salt and pepper to taste',
      'Cook spaghetti according to package instructions',
      'Serve sauce over pasta with grated Parmesan'
    ],
    prepTime: 15,
    cookTime: 60,
    servings: 6,
    cuisine: 'Italian',
    dietaryRestrictions: [],
    nutritionalInfo: {
      calories: 450,
      protein: 25,
      carbs: 45,
      fat: 18,
      fiber: 4
    },
    tags: ['pasta', 'italian', 'comfort-food', 'dinner', 'family-favorite'],
    createdBy: '',
    rating: 4.5
  },
  {
    name: 'Chicken Stir-Fry',
    description: 'Quick and healthy Asian-inspired stir-fry with vegetables',
    ingredients: [
      { name: 'chicken breast', quantity: 1.5, unit: 'lb', category: 'meat' },
      { name: 'bell peppers', quantity: 2, unit: 'medium', category: 'produce' },
      { name: 'broccoli', quantity: 2, unit: 'cups', category: 'produce' },
      { name: 'carrots', quantity: 2, unit: 'medium', category: 'produce' },
      { name: 'onion', quantity: 1, unit: 'medium', category: 'produce' },
      { name: 'garlic', quantity: 3, unit: 'cloves', category: 'produce' },
      { name: 'ginger', quantity: 1, unit: 'tbsp', category: 'produce' },
      { name: 'soy sauce', quantity: 0.25, unit: 'cup', category: 'condiments' },
      { name: 'oyster sauce', quantity: 2, unit: 'tbsp', category: 'condiments' },
      { name: 'sesame oil', quantity: 1, unit: 'tbsp', category: 'oils' },
      { name: 'cornstarch', quantity: 1, unit: 'tbsp', category: 'baking' },
      { name: 'rice', quantity: 2, unit: 'cups', category: 'grains' }
    ],
    instructions: [
      'Cut chicken into thin slices and marinate in soy sauce and cornstarch for 15 minutes',
      'Prepare vegetables by slicing bell peppers, carrots, and onion, cutting broccoli into florets',
      'Heat sesame oil in wok or large skillet over high heat',
      'Add chicken and stir-fry until cooked through, then remove from wok',
      'Add garlic and ginger, stir-fry for 30 seconds',
      'Add vegetables and stir-fry until crisp-tender',
      'Return chicken to wok and add oyster sauce',
      'Cook rice according to package instructions',
      'Serve stir-fry over rice'
    ],
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    cuisine: 'Asian',
    dietaryRestrictions: ['gluten-free'],
    nutritionalInfo: {
      calories: 380,
      protein: 32,
      carbs: 35,
      fat: 12,
      fiber: 6
    },
    tags: ['healthy', 'quick', 'asian', 'chicken', 'vegetables', 'weeknight'],
    createdBy: '',
    rating: 4.2
  },
  {
    name: 'Chocolate Chip Cookies',
    description: 'Classic homemade cookies that everyone loves',
    ingredients: [
      { name: 'butter', quantity: 1, unit: 'cup', category: 'dairy' },
      { name: 'brown sugar', quantity: 0.75, unit: 'cup', category: 'baking' },
      { name: 'white sugar', quantity: 0.25, unit: 'cup', category: 'baking' },
      { name: 'eggs', quantity: 2, unit: 'large', category: 'dairy' },
      { name: 'vanilla extract', quantity: 2, unit: 'tsp', category: 'baking' },
      { name: 'all-purpose flour', quantity: 2.25, unit: 'cups', category: 'baking' },
      { name: 'baking soda', quantity: 1, unit: 'tsp', category: 'baking' },
      { name: 'salt', quantity: 0.5, unit: 'tsp', category: 'baking' },
      { name: 'chocolate chips', quantity: 2, unit: 'cups', category: 'baking' },
      { name: 'chopped nuts', quantity: 1, unit: 'cup', category: 'baking' }
    ],
    instructions: [
      'Preheat oven to 375°F (190°C)',
      'Cream together butter, brown sugar, and white sugar until smooth',
      'Beat in eggs one at a time, then stir in vanilla',
      'Combine flour, baking soda, and salt in separate bowl',
      'Gradually add dry ingredients to wet ingredients',
      'Stir in chocolate chips and nuts',
      'Drop rounded tablespoons onto ungreased cookie sheets',
      'Bake for 8-10 minutes or until golden brown',
      'Cool on wire rack'
    ],
    prepTime: 15,
    cookTime: 10,
    servings: 24,
    cuisine: 'American',
    dietaryRestrictions: [],
    nutritionalInfo: {
      calories: 180,
      protein: 2,
      carbs: 22,
      fat: 10,
      fiber: 1
    },
    tags: ['dessert', 'cookies', 'baking', 'kids-favorite', 'party'],
    createdBy: '',
    rating: 4.8
  },
  {
    name: 'Vegetable Lasagna',
    description: 'Healthy vegetarian lasagna with layers of pasta, vegetables, and cheese',
    ingredients: [
      { name: 'lasagna noodles', quantity: 12, unit: 'sheets', category: 'pasta' },
      { name: 'ricotta cheese', quantity: 15, unit: 'oz', category: 'dairy' },
      { name: 'mozzarella cheese', quantity: 2, unit: 'cups', category: 'dairy' },
      { name: 'Parmesan cheese', quantity: 0.5, unit: 'cup', category: 'dairy' },
      { name: 'egg', quantity: 1, unit: 'large', category: 'dairy' },
      { name: 'zucchini', quantity: 2, unit: 'medium', category: 'produce' },
      { name: 'mushrooms', quantity: 8, unit: 'oz', category: 'produce' },
      { name: 'spinach', quantity: 10, unit: 'oz', category: 'produce' },
      { name: 'onion', quantity: 1, unit: 'medium', category: 'produce' },
      { name: 'garlic', quantity: 3, unit: 'cloves', category: 'produce' },
      { name: 'marinara sauce', quantity: 24, unit: 'oz', category: 'canned' },
      { name: 'olive oil', quantity: 2, unit: 'tbsp', category: 'oils' }
    ],
    instructions: [
      'Preheat oven to 375°F (190°C)',
      'Cook lasagna noodles according to package instructions',
      'Sauté onion and garlic in olive oil until softened',
      'Add sliced zucchini and mushrooms, cook until tender',
      'Add spinach and cook until wilted',
      'Mix ricotta cheese with egg and seasonings',
      'Spread thin layer of marinara sauce in 9x13 baking dish',
      'Layer: noodles, ricotta mixture, vegetables, mozzarella, sauce',
      'Repeat layers, ending with sauce and mozzarella on top',
      'Sprinkle Parmesan cheese on top',
      'Cover with foil and bake for 25 minutes',
      'Remove foil and bake additional 25 minutes until bubbly and golden',
      'Let rest for 10 minutes before serving'
    ],
    prepTime: 30,
    cookTime: 50,
    servings: 8,
    cuisine: 'Italian',
    dietaryRestrictions: ['vegetarian'],
    nutritionalInfo: {
      calories: 320,
      protein: 18,
      carbs: 35,
      fat: 14,
      fiber: 4
    },
    tags: ['vegetarian', 'italian', 'comfort-food', 'baking', 'healthy'],
    createdBy: '',
    rating: 4.3
  }
];