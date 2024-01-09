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
     * @param {number} level - The level of the character.
     * @param {number} xp - The experience points of the character.
     * @param {StatContainer} stats - The stats container for the character.
     * @param {SkillContainer} skills - The skills container for the character.
     * @param {number[]} battleBar - The battle bar array.
     * @param {number} lootQuality - The loot quality value.
     */
    constructor(id, name, level, xp, stats, skills, battleBar, lootQuality) {
        this.id = id;
        this.name = name;
        this.level = level;
        this.xp = xp;
        this.stats = stats; //instance of StatContainer
        this.skills = skills; //instance of SkillContainer
        this.battleBar = battleBar;
        this.lootQuality = lootQuality;
    }
}

const characters = new Map();

function addCharacter(character) {
    if (!this.character.has(userId)) {
        characters.set(userId, character);
    }
}

function getCharacterByUserId(userId) {
    return characters.get(userId);
}

export { Character, characters, addCharacter, getCharacterByUserId };
