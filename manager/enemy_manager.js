import { Character, StatContainer, StatusContainer } from '../manager/character_manager.js';
import Database from "better-sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';
import { Status } from 'discord.js';

class Enemy extends Character {
    constructor(enemyType) {
        super(
            enemyType.id,
            enemyType.name,
            enemyType.level,
            null, null, null,
            0, [], 0, enemyType.abilities
        );
        this.stats = new StatContainer(
            enemyType.hp, enemyType.mp, enemyType.hp, enemyType.mp,
            enemyType.spd, enemyType.physicalATK, enemyType.physicalDEF,
            enemyType.magicATK, enemyType.magicDEF
        );
        this.status = new StatusContainer();
        this.xpReward = enemyType.xpReward;
        this.dropItem = enemyType.dropItem;
        this.dropItemType = enemyType.dropItemType;
        this.dropChance = enemyType.dropChance;
        this.behaviourPreset = enemyType.behaviourPreset;
        this.description = enemyType.description;
        this.weight = enemyType.weight;
        this.attenuation = enemyType.attenuation;
        this.fixedRooms = this.fixedRooms;
        this.isUnique = enemyType.isUnique;
        this.isPriority = enemyType.isPriority;
        this.encounterDialogue = enemyType.encounterDialogue;
        this.defeatDialogue = enemyType.defeatDialogue;
        this.defeatedDialogue = enemyType.defeatedDialogue;
        this.questId = enemyType.questId;
        this.buffs = [];
        this.debuffs = [];
    }

    applyDebuff(debuff) {
        this.debuffs.push(debuff);
        this.updateStatus(debuff.type, debuff.value);
    }

    updateStatus(key, value) {
        if (this.status.hasOwnProperty(key)) {
            this.status[key] += value;
        }
    }

    talk(dialogue) {
        if (dialogue) {
            return dialogue;
        }
        return '';
    }
}

class EnemyManager {
    constructor() {
        if (EnemyManager.instance) {
            return EnemyManager.instance;
        }
        this.enemyTemplates = [];
        this.locationEnemies = new Map(); // Maps region_location to enemy templates
        EnemyManager.instance = this;
    }

    static getInstance() {
        if (!EnemyManager.instance) {
            EnemyManager.instance = new EnemyManager();
        }
        return EnemyManager.instance;
    }

    loadFromDB() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const dbPath = path.join(__dirname, '../db/merfolk_and_magic_db.db');
        const db = new Database(dbPath, { verbose: console.log });

        try {
            const stmt = db.prepare('SELECT * FROM Enemies');
            const rows = stmt.all();
            this.enemyTemplates = rows.map(row => ({
                id: row.ID,
                name: row.NAME,
                level: row.LEVEL,
                hp: row.HP,
                mp: row.MP,
                spd: row.SPD,
                physicalATK: row.PHY_ATK,
                physicalDEF: row.PHY_DEF,
                magicATK: row.MAG_ATK,
                magicDEF: row.MAG_DEF,
                abilities: row.ABILITIES ? row.ABILITIES.split(',').map(Number) : [],
                dropItem: row.DROP_ITEM,
                dropItemType: row.DROP_ITEM_TYPE,
                dropChance: row.DROP_CHANCE,
                behaviourPreset: row.BEHAVIOUR_PRESET,
                description: row.DESCRIPTION,
                weight: row.WEIGHT,
                attenuation: row.ATTENUATION,
                fixedRooms: row.FIXED_ROOMS ? row.FIXED_ROOMS.split(',').map(Number) : [],
                isUnique: row.IS_UNIQUE,
                isPriority: row.IS_PRIORITY,
                xpReward: row.XP_REWARD,
                encounterDialogue: row.ENCOUNTER_DIALOGUE,
                defeatDialogue: row.DEFEAT_DIALOGUE,
                defeatedDialogue: row.DEFEATED_DIALOGUE,
                questId: row.QUEST_ID
            }));

            const locationStmt = db.prepare('SELECT * FROM LocationEnemies');
            const locationRows = locationStmt.all();
            locationRows.forEach(row => {
                const key = `${row.REGION_ID}_${row.LOCATION_ID}`;
                if (!this.locationEnemies.has(key)) {
                    this.locationEnemies.set(key, []);
                }
                this.locationEnemies.get(key).push(this.getTemplateById(row.ENEMY_ID));
            });

        } catch (error) {
            console.error('Error loading enemies from database:', error);
        } finally {
            db.close();
        }
    }

    getTemplateById(id) {
        return this.enemyTemplates.find(t => t.id === id);
    }

    getEnemiesForLocation(regionId, locationId) {
        const key = `${regionId}_${locationId}`;
        return this.locationEnemies.get(key) || [];
    }
}


export { Enemy, EnemyManager };