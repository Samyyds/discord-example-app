import recipeData from '../json/recipes.json' assert { type: 'json' };

class Recipe {
    constructor(id, name, skill, minSkill, ingredients, result, subscriberOnly = false) {
        this.id = id;
        this.name = name;
        this.skill = skill;
        this.minSkill = minSkill;
        this.ingredients = ingredients;
        this.result = result;
        this.subscriberOnly = subscriberOnly;
    }
}

class RecipeManager {
    constructor() {
        if (RecipeManager.instance) {
            return RecipeManager.instance;
        }

        this.recipes = [];
        this.playerRecipes = new Map();// userID -> (characterID -> [recipes])
        RecipeManager.instance = this;
    }

    static getInstance() {
        if (!RecipeManager.instance) {
            RecipeManager.instance = new RecipeManager();
        }
        return RecipeManager.instance;
    }

    addRecipe(recipe) {
        this.recipes.push(recipe);
    }

    getAllRecipes() {
        return this.recipes;
    }

    getRecipeByName(name) {
        return this.recipes.find(recipe => recipe.name.toLowerCase() === name.toLowerCase());
    }

    getRecipeById(recipeId){
        return this.recipes.find(recipe => recipe.id === recipeId);
    }

    loadFromJson() {
        const recipeManager = RecipeManager.getInstance();
        recipeData.forEach(recipeData => {
            const recipe = new Recipe(
                recipeData.id,
                recipeData.name,
                recipeData.skill,
                recipeData.minSkill,
                recipeData.ingredients,
                recipeData.result,
                recipeData.subscriberOnly
            );
            recipeManager.addRecipe(recipe);
        });
    }

    getCharRecipes(userId, characterId) {
        if (!this.playerRecipes.has(userId)) {
            this.playerRecipes.set(userId, new Map());
        }
        const userRecipes = this.playerRecipes.get(userId);
        if (!userRecipes.has(characterId)) {
            userRecipes.set(characterId, []);
        }
        return userRecipes.get(characterId);
    }

    hasRecipe(userId, characterId, recipeId) {
        const charRecipes = this.getCharRecipes(userId, characterId);
        return charRecipes.includes(recipeId);
    }

    addCharRecipe(userId, characterId, recipe) {
        const charRecipes = this.getCharRecipes(userId, characterId);
        if (!this.hasRecipe(userId, characterId, recipe.id)) {
            charRecipes.push(recipe);
        } else {
            console.log('Already owned this recipe.');
        }
    }
}
export { Recipe, RecipeManager };