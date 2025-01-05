import { calculateLevelFromXp } from '../util/util.js';
import { Slots } from "../data/enums.js";
import { Class, Race, Personality, ConsumableEffect } from '../data/enums.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";

export const CLASS_BASE_STATS = {
    'NO_CLASS': { hp: 100, mp: 100, spd: 10, physicalATK: 10, physicalDEF: 10, magicATK: 10, magicDEF: 10 },
    'WARRIOR': { hp: 100, mp: 100, spd: 10, physicalATK: 10, physicalDEF: 10, magicATK: 10, magicDEF: 10 },
    'ROGUE': { hp: 100, mp: 100, spd: 10, physicalATK: 10, physicalDEF: 10, magicATK: 10, magicDEF: 10 },
    'MAGE': { hp: 100, mp: 100, spd: 10, physicalATK: 10, physicalDEF: 10, magicATK: 10, magicDEF: 10 },
};

export const CLASS_BASE_STAT_MODIFIERS = {
    'NO_CLASS': { hp: 1, mp: 1, spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'WARRIOR': { hp: 1.16, mp: 1, spd: 0.8, physicalATK: 1.2, physicalDEF: 1.2, magicATK: 1.1, magicDEF: 0.8 },
    'MAGE': { hp: 0.8, mp: 1.5, spd: 1.1, physicalATK: 0.7, physicalDEF: 0.6, magicATK: 2, magicDEF: 1.2 },
    'ROGUE': { hp: 1.3, mp: 1, spd: 1.8, physicalATK: 1.5, physicalDEF: 1.2, magicATK: 1.1, magicDEF: 0.5 },
};

export const RACE_BASE_STAT_MODIFIERS = {
    'AHONU': { hp: 1, mp: 1, spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'MANUMANU': { hp: 0.9, mp: 1.3, spd: 0.9, physicalATK: 0.9, physicalDEF: 0.9, magicATK: 1.1, magicDEF: 1 },
    'KUI': { hp: 1.2, mp: 0.9, spd: 0.7, physicalATK: 0.9, physicalDEF: 1.2, magicATK: 1, magicDEF: 1.1 },
    'MINOTAUR': { hp: 1.15, mp: 0.9, spd: 1, physicalATK: 1.1, physicalDEF: 1.1, magicATK: 0.6, magicDEF: 1 },
    'ULFUR': { hp: 1, mp: 0.8, spd: 1.1, physicalATK: 1.2, physicalDEF: 1, magicATK: 1.1, magicDEF: 0.8 },
};

export const PERSONALITY_BASE_STAT_MODIFIERS = {
    'NO_PERSONALITY': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'STOIC': { spd: 0.9, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'GREEDY': { spd: 1, physicalATK: 0.9, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'NERDY': { spd: 1, physicalATK: 1, physicalDEF: 0.9, magicATK: 1, magicDEF: 1 },
    'PASSIONATE': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 0.9, magicDEF: 1 },
    'HORNY': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 0.9 },
    'BRAWNY': { spd: 1.1, physicalATK: 1.1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'CHEEKY': { spd: 1, physicalATK: 1.1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'FEISTY': { spd: 1, physicalATK: 1, physicalDEF: 1.1, magicATK: 1, magicDEF: 1 },
    'CUNNING': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1.1, magicDEF: 1 },
    'THOUGHTFUL': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1.1 },
    'THICC': { spd: 1, physicalATK: 1, physicalDEF: 1.1, magicATK: 1, magicDEF: 1 },
    'PEACEFUL': { spd: 1, physicalATK: 1, physicalDEF: 1.1, magicATK: 1, magicDEF: 1 },
    'ADAPTABLE': { spd: 1, physicalATK: 1, physicalDEF: 1.1, magicATK: 1, magicDEF: 1 },
    'BOUGIE': { spd: 1, physicalATK: 1, physicalDEF: 1.1, magicATK: 1, magicDEF: 1 },
    'STOUT': { spd: 1, physicalATK: 1, physicalDEF: 1.1, magicATK: 1, magicDEF: 1 },
    'HILARIOUS': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1.1, magicDEF: 1 },
    'VINdictive': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1.1, magicDEF: 1 },
    'ERRATIC': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1.1, magicDEF: 1 },
    'AMBITIOUS': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1.1, magicDEF: 1 },
    'MYSTERIOUS': { spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1.1 },
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
    constructor(hpMax, mpMax, hp, mp, spd, physicalATK, physicalDEF, magicATK, magicDEF, fireATK, fireDEF, lightATK, lightDEF, darkATK, darkDEF, status) {
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
        this.darkATK = Math.max(0, Math.round(darkDEF));
        this.status = status;
    }

    applyDamage(damageAmount) {
        this.hp = Math.max(0, Math.round(this.hp - damageAmount));
    }

    applyBoost() {
        this.physicalATK += this.status.physicalATKBoost || 0;
        this.physicalDEF += this.status.physicalDEFBoost || 0;
        this.magicATK += this.status.magicATKBoost || 0;
        this.magicDEF += this.status.magicDEFBoost || 0;
        this.fireATK += this.status.fireATKBoost || 0;
        this.fireDEF += this.status.fireDEFBoost || 0;
        this.lightATK += this.status.lightATKBoost || 0;
        this.lightDEF += this.status.lightDEFBoost || 0;
        this.darkATK += this.status.darkATKBoost || 0;
        this.darkDEF += this.status.darkDEFBoost || 0;
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
    constructor(poison, bleed, physicalATKBoost, physicalDEFBoost, magicATKBoost, magicDEFBoost, fireATKBoost, fireDEFBoost, lightATKBoost, lightDEFBoost, darkATKBoost, darkDEFBoost) {
        this.poison = Math.max(0, Math.round(poison));
        this.bleed = Math.max(0, Math.round(bleed));
        this.physicalATKBoost = Math.max(0, Math.round(physicalATKBoost));
        this.physicalDEFBoost = Math.max(0, Math.round(physicalDEFBoost));
        this.magicATKBoost = Math.max(0, Math.round(magicATKBoost));
        this.magicDEFBoost = Math.max(0, Math.round(magicDEFBoost));
        this.fireATKBoost = Math.max(0, Math.round(fireATKBoost));
        this.fireDEFBoost = Math.max(0, Math.round(fireDEFBoost));
        this.lightATKBoost = Math.max(0, Math.round(lightATKBoost));
        this.lightDEFBoost = Math.max(0, Math.round(lightDEFBoost));
        this.darkATKBoost = Math.max(0, Math.round(darkATKBoost));
        this.darkDEFBoost = Math.max(0, Math.round(darkDEFBoost));
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
    constructor(id, name, level, classId, raceId, personalityId, xp, battleBar, lootQuality, abilities, gold) {
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
        this.gold = gold;

        if (classId !== null && raceId !== null && personalityId !== null) {
            const className = Object.keys(Class).find(key => Class[key] === classId);
            // const raceName = Object.keys(Race).find(key => Race[key] === raceId);
            // const personalityName = Object.keys(Personality).find(key => Personality[key] === personalityId);

            this.skills = new SkillContainer();
            this.status = new StatusContainer(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            this.equippedItems = {
                [Slots.MAIN_HAND]: null,
                [Slots.OFF_HAND]: null,
                [Slots.ARMS]: null,
                [Slots.BODY]: null,
                [Slots.HEAD]: null,
                [Slots.LEGS]: null,
            };
            this.buffs = [];
            this.debuffs = [];

            this.stats = new StatContainer(
                CLASS_BASE_STATS[className].hp,
                CLASS_BASE_STATS[className].mp,
                CLASS_BASE_STATS[className].hp,
                CLASS_BASE_STATS[className].mp,
                CLASS_BASE_STATS[className].spd,
                CLASS_BASE_STATS[className].physicalATK,
                CLASS_BASE_STATS[className].physicalDEF,
                CLASS_BASE_STATS[className].magicATK,
                0, // fireATK
                0, // fireDEF
                0, // lightATK
                0, // lightDEF
                0, // darkATK
                0, // darkDEF
                this.status
            );
        } else {
            this.stats = new StatContainer();
        }
    }

    applyBuff(buff) {
        const existingBuffIndex = this.buffs.findIndex(b => b.type === buff.type);
        if (existingBuffIndex !== -1) {
            this.buffs[existingBuffIndex].duration = Math.max(this.buffs[existingBuffIndex].duration, buff.duration);
        } else {
            this.buffs.push(buff);
            this.updateStatus(buff, 'add');
        }
    }

    removeBuff(buff) {
        this.buffs = this.buffs.filter(b => b.type !== buff.type);
        this.updateStatus(buff, 'subtract');
    }

    clearAllDebuffs() {
        this.debuffs.forEach(debuff => {
            this.updateStatus(debuff, 'subtract');
        });
        this.debuffs = [];
    }

    updateStatus(buff, operation) {
        if (!buff) {
            console.error('No buff provided for updateStatus.');
            return;
        }
        const { type, value } = buff;

        if (this.status.hasOwnProperty(type)) {
            if (operation === 'add') {
                this.status[type] += value;
            } else if (operation === 'subtract') {
                this.status[type] -= value;
            }
        } else {
            console.error(`Invalid status key: ${type}`);
        }

        this.stats.applyBoost();
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
        this.charEnemyEncounters = new Map(); // { characterId -> { enemyId -> encounterCount } }

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

    trackEnemy(characterId, enemyId) {
        if (!this.charEnemyEncounters.has(characterId)) {
            this.charEnemyEncounters.set(characterId, new Map());
        }
        const encounterCounts = this.charEnemyEncounters.get(characterId);
        encounterCounts.set(enemyId, (encounterCounts.get(enemyId) || 0) + 1);
    }

    getEnemyEncounterCount(characterId, enemyId) {
        const encounterCounts = this.charEnemyEncounters.get(characterId);
        return encounterCounts ? encounterCounts.get(enemyId) || 0 : 0;
    }

    isFirstEncounterWithBoss(characterId, enemyId) {
        const currentCount = this.getEnemyEncounterCount(characterId, enemyId);
        return currentCount === 0;
    }
}

class CombatSession {
    constructor(characters) {
        this.characters = characters;
        this.currentRound = 1;
        this.active = true;
    }

    nextRound() {
        this.currentRound++;
        this.updateEffects();
    }

    endCombat() {
        this.active = false;
        this.clearAllEffects();
    }

    updateEffects() {
        this.characters.forEach(character => {
            character.buffs.forEach(buff => {
                if (--buff.duration <= 0) {
                    character.removeBuff(buff);
                }
            });
            character.debuffs.forEach(debuff => {
                if (--debuff.duration <= 0) {
                    character.removeDebuff(debuff);
                }
            });
        });
    }

    clearAllEffects() {
        this.characters.forEach(character => {
            character.buffs = [];
            character.debuffs = [];
            character.updateStatus();
        });
    }
}

export { Character, StatContainer, SkillContainer, CharacterManager, StatusContainer, Combatant, CombatSession };
