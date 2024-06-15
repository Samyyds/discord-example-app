import { Character, StatContainer } from '../manager/character_manager.js';
import Database from "better-sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

class Enemy extends Character {
    constructor(enemyType) {
        super(
            enemyType.id,
            enemyType.name,
            enemyType.level,
            null, null, null, // Assuming Class, Race, Personality are null for enemies
            0, [], 0 // XP, Battle Bar, Loot Quality set to defaults
        );
        this.stats = new StatContainer(
            enemyType.hp, enemyType.mp, enemyType.hp, enemyType.mp,
            enemyType.spd, enemyType.physicalATK, enemyType.physicalDEF,
            enemyType.magicATK, enemyType.magicDEF
        );
        this.dropItem = enemyType.dropItem;
        this.dropChance = enemyType.dropChance;
        this.behaviourPreset = enemyType.behaviourPreset;
        this.description = enemyType.description;
        this.weight = enemyType.weight;
        this.attenuation = enemyType.attenuation;
        this.fixedRooms = Array.isArray(enemyType.fixedRooms) ?
            enemyType.fixedRooms :
            (enemyType.fixedRooms ? enemyType.fixedRooms.split(',').map(Number) : null);
        this.isUnique = enemyType.isUnique;
        this.isPriority = enemyType.isPriority;
    }
}

class EnemyManager {
    constructor() {
        if (EnemyManager.instance) {
            return EnemyManager.instance;
        }
        this.enemyTemplates = []; // Holds templates only
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
                dropItem: row.DROP_ITEM,
                dropChance: row.DROP_CHANCE,
                behaviourPreset: row.BEHAVIOUR_PRESET,
                description: row.DESCRIPTION,
                weight: row.WEIGHT,
                attenuation: row.ATTENUATION,
                fixedRooms: row.FIXED_ROOMS ? row.FIXED_ROOMS.split(',').map(Number) : [],
                isUnique: row.IS_UNIQUE,
                isPriority: row.IS_PRIORITY
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