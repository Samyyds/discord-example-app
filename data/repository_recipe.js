class RecipeRepository {
    constructor() {
        if (RecipeRepository.instance) {
            return RecipeRepository.instance;
        }

        this.recipes = new Map();//userID -> （characterId -> recipes)
        RecipeRepository.instance = this;
    }

    static getInstance() {
        if (!RecipeRepository.instance) {
            RecipeRepository.instance = new RecipeRepository();
        }
        return RecipeRepository.instance;
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
export { RecipeRepository };