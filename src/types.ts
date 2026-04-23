export type IngredientGroup = 'staple' | 'sauce' | 'main' | 'special' | 'urgent';

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  icon: string;
  image?: string;
  category: string;
  group?: IngredientGroup;
  is_favorite?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  time: string;
  difficulty: 'Easy' | 'Intermediate' | 'Hard' | '초급' | '중급' | '고급';
  servings: number;
  calories: number;
  ingredients: { name: string; amount: string; isMissing?: boolean }[];
  instructions: string[];
  tags: string[];
  matchPercentage: number;
  isChefsPick?: boolean;
  healthPoint?: string;
  chefTip?: string;
  userNote?: string;
  userRating?: number;
  userPhotos?: string[];
  isModified?: boolean;
  videoUrl?: string;
  isAI?: boolean;
}

export interface PersonalRecipe extends Recipe {
  originalRecipeId: string;
  modifiedAt: string;
  note?: string;
}

export interface MealJournalLog {
  id: string;
  date: string; // ISO string
  title: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: string; // Link to either Recipe or PersonalRecipe
  customRecipeId?: string;
  photoUrl?: string;
  referenceUrl?: string; // YouTube or other link
  referenceContent?: string; // Long text from Gemini or direct recipe
  notes?: string;
  healthScore: number; // 1-100 based on persona adherence
}

export interface MealPlan {
  day: string;
  title: string;
  image: string;
}
