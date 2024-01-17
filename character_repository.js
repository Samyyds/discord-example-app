class StatContainer {
    constructor(hpMax, mpMax, hp, mp, spd, physicalATK, physicalDEF, magicATK, magicDEF, fireATK, fireDEF, lightATK, lightDEF, darkATK, darkDEF) {
        this.hpMax = hpMax;
        this.mpMax = mpMax;
        this.hp = hp;
        this.mp = mp;
        this.spd = spd;
        this.physicalATK = physicalATK;
        this.physicalDEF = physicalDEF;
        this.magicATK = magicATK;
        this.magicDEF = magicDEF;
        this.fireATK = fireATK;
        this.fireDEF = fireDEF;
        this.lightATK = lightATK;
        this.lightDEF = lightDEF;
        this.darkATK = darkATK;
        this.darkDEF = darkDEF;
    }
}

class SkillContainer {
    constructor(mining, smithing, crafting, fishing, gathering, farming, cooking, brewing) {
        this.mining = mining;
        this.smithing = smithing;
        this.crafting = crafting;
        this.fishing = fishing;
        this.gathering = gathering;
        this.farming = farming;
        this.cooking = cooking;
        this.brewing = brewing;
    }
}

class Character {
    /**
     * Creates a new Character instance.
     * @param {number} id - The id of the character.
     * @param {string} name - The name of the character.
     * @param {number} classType - The class of the character.
     * @param {number} raceId - The race of the character.
     * @param {number} personalityId - The personality of the character.
     * @param {number} level - The level of the character.
     * @param {number} xp - The experience points of the character.
     * @param {StatContainer} stats - The stats container for the character.
     * @param {SkillContainer} skills - The skills container for the character.
     * @param {number[]} battleBar - The battle bar array.
     * @param {number} lootQuality - The loot quality value.
     */
    constructor(id, name, level, classId, raceId, personalityId, xp, stats, skills, battleBar, lootQuality) {
        this.id = id;
        this.name = name;
        this.classId = classId;
        this.raceId = raceId;
        this.personalityId = personalityId;
        this.level = level;
        this.xp = xp;
        this.stats = stats; //instance of StatContainer
        this.skills = skills; //instance of SkillContainer
        this.battleBar = battleBar;
        this.lootQuality = lootQuality;
    }
}

class CharacterRepository {
    constructor() {
        if (CharacterRepository.instance) {
            return CharacterRepository.instance;
        }

        this.characters = new Map();
        this.activeCharacters = new Map();
        CharacterRepository.instance = this;
    }

    static getInstance() {
        if (!CharacterRepository.instance) {
            CharacterRepository.instance = new CharacterRepository();
        }
        return CharacterRepository.instance;
    }

    addCharacter(userId, character) {
        if (!this.characters.has(userId)) {
            this.characters.set(userId, []);
        }
        this.characters.get(userId).push(character);
    }

    getCharactersByUserId(userId) {
        return this.characters.get(userId) || [];
    }

    setActiveCharacter(userId, characterId) {
        this.activeCharacters.set(userId, BigInt(characterId));
    }

    getActiveCharacter(userId) {
        console.log(`User ID for user ${userId}:`, typeof userId);
        const activeCharacterId = this.activeCharacters.get(userId); 
        console.log(`Active character ID for user ${activeCharacterId}:`, typeof activeCharacterId);
        const characters = this.getCharactersByUserId(userId);       
        return characters.find(character => character.id === activeCharacterId);
    }    
}

export { Character, StatContainer, SkillContainer, CharacterRepository };
