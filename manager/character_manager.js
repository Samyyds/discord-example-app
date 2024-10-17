import { calculateLevelFromXp } from '../util/util.js';
import { Slots } from "../data/enums.js";
import { Class, Race, Personality, ConsumableEffect } from '../data/enums.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";

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
    'AHONU': { hp: 1, mp: 1, spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'MANUMANU': { hp: 0.9, mp: 1.3, spd: 0.9, physicalATK: 0.9, physicalDEF: 0.9, magicATK: 1.1, magicDEF: 1.1 },
    'KUI': { hp: 1.3, mp: 0.9, spd: 0.7, physicalATK: 0.9, physicalDEF: 1.2, magicATK: 1, magicDEF: 1 },
    'MINOTAUR': { hp: 1.2, mp: 0.9, spd: 1, physicalATK: 1.1, physicalDEF: 1.1, magicATK: 0.6, magicDEF: 1 },
    'ULFUR': { hp: 1.1, mp: 0.8, spd: 1.1, physicalATK: 1.2, physicalDEF: 0.9, magicATK: 1.1, magicDEF: 0.8 },
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
        this.hpMax = Math.max(0, Math.round(hpMax));
        this.mpMax = Math.max(0, Math.round(mpMax));
        this.hp = Math.max(0, Math.round(hp));
        this.mp = Math.max(0, Math.round(mp));
        this.spd = Math.max(0, Math.round(spd));
        this.physicalATK = Math.max(0, Math.round(physicalATK));
        this.physicalDEF = Math.max(0, Math.round(physicalDEF));
        this.magicATK = Math.max(0, Math.round(magicATK));
        this.magicDEF = Math.max(0, Math.round(magicDEF));
        this.fireATK = Math.max(0, Math.round(fireATK));
        this.fireDEF = Math.max(0, Math.round(fireDEF));
        this.lightATK = Math.max(0, Math.round(lightATK));
        this.lightDEF = Math.max(0, Math.round(lightDEF));
        this.darkATK = Math.max(0, Math.round(darkATK));
        this.darkDEF = Math.max(0, Math.round(darkDEF));
    }

    applyDamage(damageAmount) {
        this.hp = Math.max(0, Math.round(this.hp - damageAmount));
    }

    addAttributes(attributes) {
        for (const key in attributes) {
            if (this.hasOwnProperty(key) && attributes[key] !== undefined) {
                this[key] = Math.max(0, Math.round(this[key] + attributes[key]));
            }
        }
    }

    subtractAttributes(attributes) {
        for (const key in attributes) {
            if (this.hasOwnProperty(key) && attributes[key] !== undefined) {
                this[key] = Math.max(0, Math.round(this[key] - attributes[key]));
            }
        }
    }
}

class SkillContainer {
    // constructor(mining = { level: 0, xp: 0 }, smithing = { level: 0, xp: 0 }, crafting = { level: 0, xp: 0 }, fishing = { level: 0, xp: 0 }, gathering = { level: 0, xp: 0 }, farming = { level: 0, xp: 0 }, cooking = { level: 0, xp: 0 }, brewing = { level: 0, xp: 0 }) {
    //     this.mining = mining;
    //     this.smithing = smithing;
    //     this.crafting = crafting;
    //     this.fishing = fishing;
    //     this.gathering = gathering;
    //     this.farming = farming;
    //     this.cooking = cooking;
    //     this.brewing = brewing;
    // }
    constructor() {
        this.skills = {
            mining: { xp: 0, level: 0 },
            smithing: { xp: 0, level: 0 },
            fishing: { xp: 0, level: 0 },
            gathering: { xp: 0, level: 0 },
            farming: { xp: 0, level: 0 },
            cooking: { xp: 0, level: 0 },
            brewing: { xp: 0, level: 0 },
            waterbreathing: { xp: 0, level: 0 }
        };
    }


    increaseSkillXp(skillName, amount) {
        if (skillName in this.skills) {
            this.skills[skillName].xp += amount;
            this.skills[skillName].level = calculateLevelFromXp(this.skills[skillName].xp);
        }
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
        this.equippedItems = {
            [Slots.MAIN_HAND]: null,
            [Slots.OFF_HAND]: null,
            [Slots.ARMS]: null,
            [Slots.BODY]: null,
            [Slots.HEAD]: null,
            [Slots.LEGS]: null,
        };
    }

    applyStatBonus(effectType, value) {
        switch (effectType) {
            case ConsumableEffect.PHY_ATK_BONUS:
                this.stats.physicalATK *= (1 + value / 100);
                break;
            case ConsumableEffect.MAG_ATK_BONUS:
                this.stats.magicATK *= (1 + value / 100);
                break;
            case ConsumableEffect.PHY_DEF_BONUS:
                this.stats.physicalDEF += value;
                break;
            case ConsumableEffect.MAG_DEF_BONUS:
                this.stats.magicDEF += value;
                break;
            default:
                console.log('Effect not recognized');
                break;
        }
    }

    removeStatusEffect(effectType) {
        switch (effectType) {
            case 'CURE_BLEED':
                this.status.bleedMag = 0;
                break;
            case 'CURE_POISON':
                this.status.poisonMag = 0;
                break;
            case 'CURE_BURN':
                break;
            default:
                console.log('Status effect not recognized');
                break;
        }
    }

    equipItem(item) {
        if (this.equippedItems[item.slot]) {
            this.unequipItem(item.slot);
        }
        this.equippedItems[item.slot] = item;
        this.updateAttributes(item, 'add');
        console.log(`${item.name} equipped to ${item.slot}.`);
    }

    unequipItem(slot) {
        const item = this.equippedItems[slot];
        if (item) {
            this.updateAttributes(item, 'subtract');
            this.equippedItems[slot] = null;
            console.log(`${item.name} unequipped from ${slot}.`);
            return item;
        }
        return null;
    }

    updateAttributes(equipment, operation) {
        const attributes = {
            hp: equipment.hp,
            mp: equipment.mp,
            spd: equipment.spd,
            physicalATK: equipment.physicalATK,
            physicalDEF: equipment.physicalDEF,
            magicATK: equipment.magicATK,
            magicDEF: equipment.magicDEF
        };
        Object.entries(attributes).forEach(([key, value]) => {
            if (operation === 'add') {
                this.stats[key] += value;
            } else if (operation === 'subtract') {
                this.stats[key] -= value;
            }
        });
    }

    isEquipped(itemId) {
        for (const slot in this.equippedItems) {
            const item = this.equippedItems[slot];
            if (item && item.id === itemId) {
                return true;
            }
        }
        return false;
    }

    increaseCharacterXp(amount) {
        this.xp += amount;
        this.level = calculateLevelFromXp(this.xp);
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

    reviveCharacter(userId) {
        const character = this.getActiveCharacter(userId);
        if (character) {
            character.stats.hp = character.stats.hpMax / 2;
            character.stats.mp = character.stats.mpMax / 2;

            const reviveRegionId = 0;
            const reviveLocationId = 4;
            const reviveRoomId = 0;

            const playerMoveManager = PlayerMovementManager.getInstance();
            playerMoveManager.setLocation(userId, character.id, reviveRegionId, reviveLocationId, reviveRoomId);
        }
    }
}

export { Character, StatContainer, SkillContainer, CharacterManager, StatusContainer, Combatant };
