import { increaseXp } from '../util/util.js';
import { Class, Race, Personality } from '../data/enums.js';
import Database from "better-sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

const CLASS_BASE_STATS = {
    'NO_CLASS': { hp: 100, mp: 100, spd: 100, physicalATK: 100, physicalDEF: 100, magicATK: 100, magicDEF: 100 },
    'WARRIOR': { hp: 300, mp: 100, spd: 100, physicalATK: 150, physicalDEF: 120, magicATK: 60, magicDEF: 60 },
    'ROGUE': { hp: 100, mp: 100, spd: 200, physicalATK: 150, physicalDEF: 120, magicATK: 60, magicDEF: 60 },
    'MAGE': { hp: 100, mp: 200, spd: 100, physicalATK: 60, physicalDEF: 60, magicATK: 150, magicDEF: 120 },
};

const CLASS_BASE_STAT_MODIFIERS = {
    'NO_CLASS': { hp: 1, mp: 1, spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'WARRIOR': { hp: 1.3, mp: 1, spd: 0.8, physicalATK: 1.5, physicalDEF: 1.2, magicATK: 1.1, magicDEF: 0.5 },
    'ROGUE': { hp: 1.3, mp: 1, spd: 1.8, physicalATK: 1.5, physicalDEF: 1.2, magicATK: 1.1, magicDEF: 0.5 },
    'MAGE': { hp: 1.3, mp: 2, spd: 1, physicalATK: 0.6, physicalDEF: 0.6, magicATK: 1.5, magicDEF: 1.2 },
};

const RACE_BASE_STAT_MODIFIERS = {
    'HUMAN': { hp: 1.1, mp: 1, spd: 1, physicalATK: 1.1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'ELF': { hp: 0.9, mp: 1.2, spd: 1.2, physicalATK: 0.9, physicalDEF: 0.9, magicATK: 1.2, magicDEF: 1.2 },
    'DWARF': { hp: 1.2, mp: 0.8, spd: 0.8, physicalATK: 1.2, physicalDEF: 1.3, magicATK: 0.8, magicDEF: 1 },
};

const PERSONALITY_BASE_STAT_MODIFIERS = {
    'NO_PERSONALITY': { hp: 1, mp: 1, spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'BRAWNY': { hp: 1.1, mp: 0.9, spd: 0.9, physicalATK: 1.2, physicalDEF: 1.1, magicATK: 0.9, magicDEF: 0.9 },
    'WISE': { hp: 0.9, mp: 1.1, spd: 1, physicalATK: 0.9, physicalDEF: 0.9, magicATK: 1.2, magicDEF: 1.2 },

};

const attributeMapping = {
    hpBonus: 'hpMax',
    mpBonus: 'mpMax',
    spdBonus: 'spd',
    physicalATKBonus: 'physicalATK',
    physicalDEFBonus: 'physicalDEF',
    magicATKBonus: 'magicATK',
    magicDEFBonus: 'magicDEF',
    fireATKBonus: 'fireATK',
    fireDEFBonus: 'fireDEF',
    lightATKBonus: 'lightATK',
    lightDEFBonus: 'lightDEF',
    darkATKBonus: 'darkATK',
    darkDEFBonus: 'darkDEF',
    bleedResistBonus: 'bleedMag',
    poisonResistBonus: 'poisonMag'
};

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

    addAttributes(attributes) {
        for (const key in attributes) {
            if (this.hasOwnProperty(key) && attributes[key] !== undefined) {
                this[key] += attributes[key];
            }
        }
    }

    subtractAttributes(attributes) {
        for (const key in attributes) {
            if (this.hasOwnProperty(key) && attributes[key] !== undefined) {
                this[key] -= attributes[key];
            }
        }
    }
}

class SkillContainer {
    constructor(mining = { level: 0, xp: 0 }, smithing = { level: 0, xp: 0 }, crafting = { level: 0, xp: 0 }, fishing = { level: 0, xp: 0 }, gathering = { level: 0, xp: 0 }, farming = { level: 0, xp: 0 }, cooking = { level: 0, xp: 0 }, brewing = { level: 0, xp: 0 }) {
        this.mining = mining;
        this.smithing = smithing;
        this.crafting = crafting;
        this.fishing = fishing;
        this.gathering = gathering;
        this.farming = farming;
        this.cooking = cooking;
        this.brewing = brewing;
    }

    increaseSkillXp(skillName, amount) {
        if (!this[skillName]) return;

        const { newLevel, newXp, xpForNextLevel } = increaseXp(this[skillName].xp, this[skillName].level, amount);

        this[skillName].level = newLevel;
        this[skillName].xp = newXp;
    }
}

class StatusContainer {
    constructor(spdMult, phyDefBuffMag, phyDefBuffTimer, bleedMag, bleedTimer, poisonMag, poisonTimer) {
        this.spdMult = spdMult;
        this.phyDefBuffMag = phyDefBuffMag;
        this.phyDefBuffTimer = phyDefBuffTimer;
        this.bleedMag = bleedMag;
        this.bleedTimer = bleedTimer;
        this.poisonMag = poisonMag;
        this.poisonTimer = poisonTimer;
    }

    addAttributes(attributes) {
        for (const key in attributes) {
            if (this.hasOwnProperty(key) && attributes[key] !== undefined) {
                this[key] += attributes[key];
            }
        }
    }

    subtractAttributes(attributes) {
        for (const key in attributes) {
            if (this.hasOwnProperty(key) && attributes[key] !== undefined) {
                this[key] -= attributes[key];
            }
        }
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
     * @param {number[]} abilities - The available abilities that character has.
     */
     constructor(id, name, level, classId, raceId, personalityId, xp, battleBar, lootQuality, abilities) {
        this.id = id;
        this.name = name;
        this.level = level;
        this.classId = classId;
        this.raceId = raceId;
        this.personalityId = personalityId;
        this.xp = xp;
        this.battleBar = battleBar;
        this.lootQuality = lootQuality;
        this.abilities = abilities;

        if (classId !== null && raceId !== null && personalityId !== null) {
            const className = Object.keys(Class).find(key => Class[key] === classId);
            const raceName = Object.keys(Race).find(key => Race[key] === raceId);
            const personalityName = Object.keys(Personality).find(key => Personality[key] === personalityId);

            const classStats = CLASS_BASE_STATS[className];
            const classModifiers = CLASS_BASE_STAT_MODIFIERS[className];
            const raceModifiers = RACE_BASE_STAT_MODIFIERS[raceName];
            const personalityModifiers = PERSONALITY_BASE_STAT_MODIFIERS[personalityName];

            this.stats = new StatContainer(
                Math.round(classStats.hp * classModifiers.hp * raceModifiers.hp * personalityModifiers.hp),
                Math.round(classStats.mp * classModifiers.mp * raceModifiers.mp * personalityModifiers.mp),
                Math.round(classStats.hp * classModifiers.hp * raceModifiers.hp * personalityModifiers.hp),
                Math.round(classStats.mp * classModifiers.mp * raceModifiers.mp * personalityModifiers.mp),
                Math.round(classStats.spd * classModifiers.spd * raceModifiers.spd * personalityModifiers.spd),
                Math.round(classStats.physicalATK * classModifiers.physicalATK * raceModifiers.physicalATK * personalityModifiers.physicalATK),
                Math.round(classStats.physicalDEF * classModifiers.physicalDEF * raceModifiers.physicalDEF * personalityModifiers.physicalDEF),
                Math.round(classStats.magicATK * classModifiers.magicATK * raceModifiers.magicATK * personalityModifiers.magicATK),
                Math.round(classStats.magicDEF * classModifiers.magicDEF * raceModifiers.magicDEF * personalityModifiers.magicDEF),
                0, // TODO fireATK
                0, // TODO fireDEF
                0, // lTODO ightATK
                0, // TODO lightDEF
                0, // TODO darkATK
                0, // TODO darkDEF
            );
        } else {
            this.stats = new StatContainer(); 
        }
        this.skills = new SkillContainer(); 
        this.status = new StatusContainer(); 
        this.equippedItems = {};
    }

    equipItem(item) {
        if (item && item.slot && item.attributes) {
            if (this.equippedItems[item.slot]) {
                this.unequipItem(item.slot);
            }
            this.equippedItems[item.slot] = item;
            this.updateAttributes(item.attributes, 'add');
        }
    }

    unequipItem(slot) {
        const item = this.equippedItems[slot];
        if (item) {
            this.updateAttributes(item.attributes, 'subtract');
            delete this.equippedItems[slot];
            return item;
        }
        return null;
    }

    updateAttributes(attributes, operation = 'add') {
        const statAttributes = {};
        const statusAttributes = {};

        for (const key in attributes) {
            if (key in attributeMapping) {
                const mappedKey = attributeMapping[key];
                if (mappedKey in this.stats) {
                    statAttributes[mappedKey] = attributes[key];
                } else if (mappedKey in this.status) {
                    statusAttributes[mappedKey] = attributes[key];
                }
            }
        }

        if (Object.keys(statAttributes).length > 0) {
            if (operation === 'add') {
                this.stats.addAttributes(statAttributes);
            } else {
                this.stats.subtractAttributes(statAttributes);
            }
        }
        if (Object.keys(statusAttributes).length > 0) {
            if (operation === 'add') {
                this.status.addAttributes(statusAttributes);
            } else {
                this.status.subtractAttributes(statusAttributes);
            }
        }
    }

    isEquipped(itemId) {
        for (const slot in this.equippedItems) {
            const item = this.equippedItems[slot];
            if (item.id === itemId) {
                return true;
            }
        }
        return false;
    }


    increaseCharacterXp(amount) {
        const { newLevel, newXp, xpForNextLevel } = increaseXp(this.xp, this.level, amount);

        this.level = newLevel;
        this.xp = newXp;
    }
}

class Combatant {
    constructor(character, status, barIndex) {
        this.character = character;
        this.status = status;
        this.barIndex = barIndex;
    }
}

class CharacterManager {
    constructor() {
        if (CharacterManager.instance) {
            return CharacterManager.instance;
        }

        this.characters = new Map();
        this.activeCharacters = new Map();
        this.abilities = {};
        CharacterManager.instance = this;
    }

    static getInstance() {
        if (!CharacterManager.instance) {
            CharacterManager.instance = new CharacterManager();
        }
        return CharacterManager.instance;
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
        console.log(`the active char id is: ` + characterId);
        this.activeCharacters.set(userId, characterId);
    }

    getActiveCharacter(userId) {
        const activeCharacterId = this.activeCharacters.get(userId);
        const characters = this.getCharactersByUserId(userId);
        return characters.find(character => character.id === Number(activeCharacterId));
    }

    loadFromDB() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        console.log('Current Directory:', __dirname); 
        const dbPath = path.join(__dirname, '../db/merfolk_and_magic_db.db');
        console.log('Database Path:', dbPath); 
        const db = new Database(dbPath, { verbose: console.log });

        try {
            const stmt = db.prepare('SELECT * FROM Abilities');
            const rows = stmt.all();

            this.abilities = rows.reduce((acc, row) => {
                acc[row.ID] = {
                    id: row.ID,
                    name: row.NAME,
                    mp_cost: row.MP_COST,
                    is_passive: row.IS_PASSIVE,
                    item_restriction: row.ITEM_RESTRICTION,
                    class_restriction: row.CLASS_RESTRICTION,
                    level_restriction: row.LEVEL_RESTRICTION,
                    override: row.OVERRIDE
                };
                return acc;
            }, {});

        } catch (error) {
            console.error('Error loading abilities from database:', error);
        } finally {
            db.close();
        }
    }

    assignAbilitiesToCharacter(character) {
        character.abilities = Object.values(this.abilities).filter(ability => {
            return this.isAbilityAvailable(character, ability);
        }).map(ability => ability.id);
    }

    isAbilityAvailable(character, ability) {
        if (ability.level_restriction && character.level < ability.level_restriction) {
            return false;
        }
        if (ability.class_restriction && character.classId !== ability.class_restriction) {
            return false;
        }
        if (ability.item_restriction && !character.isEquipped(ability.item_restriction)) {
            return false;
        }
        return true;
    }
}

export { Character, StatContainer, SkillContainer, CharacterManager, StatusContainer, Combatant };