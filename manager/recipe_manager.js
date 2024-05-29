class RecipeManager {
    constructor() {
        if (RecipeManager.instance) {
            return RecipeManager.instance;
        }

        this.recipes = new Map();//userID -> （characterId -> recipes)
        RecipeManager.instance = this;
    }

    static getInstance() {
        if (!RecipeManager.instance) {
            RecipeManager.instance = new RecipeManager();
        }
        return RecipeManager.instance;
    }

    getCharRecipes(userId, characterId) {
        if (!this.recipes.has(userId)) {
            this.recipes.set(userId, new Map());
        }
        const userRecipes = this.recipes.get(userId);
        if (!userRecipes.has(characterId)) {
            userRecipes.set(characterId, []);
        }
        return userRecipes.get(characterId);
    }

    hasRecipe(userId, characterId, recipeId) {
        const charRecipes = this.getCharRecipes(userId, characterId);
        return charRecipes.includes(recipeId);
    }

    addRecipe(userId, characterId, recipeId) {
        const charRecipes = this.getCharRecipes(userId, characterId);
        if (!this.hasRecipe(userId, characterId, recipeId)) {
            charRecipes.push(recipeId);
        } else {
            console.log('Already owned this recipe.');
        }
    }
}
export { RecipeManager };