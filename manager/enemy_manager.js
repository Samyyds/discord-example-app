import { Character, StatContainer } from '../manager/character_manager.js';
import Database from "better-sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

class Enemy extends Character {
    constructor(id, name, level, hp, mp, spd, physicalATK, physicalDEF, magicATK, magicDEF, dropItem, dropChance, behaviourPreset, description, weight, attenuation, fixedRooms, isUnique, isPriority) {
        super(id, name, level, null, null, null, 0, [], 0);
        this.stats = new StatContainer(hp, mp, hp, mp, spd, physicalATK, physicalDEF, magicATK, magicDEF);
        this.dropItem = dropItem;
        this.dropChance = dropChance;
        this.behaviourPreset = behaviourPreset;
        this.description = description;
        this.weight = weight;
        this.attenuation = attenuation;
        this.fixedRooms = fixedRooms ? fixedRooms.split(',').map(Number) : null;
        this.isUnique = isUnique;
        this.isPriority = isPriority;
    }
}

class EnemyManager {
    constructor() {
        if (EnemyManager.instance) {
            return EnemyManager.instance;
        }

        this.enemies = [];
        this.locationEnemies = new Map();
        this.uniqueEnemies = new Set();
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
        console.log('Current Directory:', __dirname);
        const dbPath = path.join(__dirname, '../db/merfolk_and_magic_db.db');
        console.log('Database Path:', dbPath);
        const db = new Database(dbPath, { verbose: console.log });

        try {
            const stmt = db.prepare('SELECT * FROM Enemies');
            const rows = stmt.all();
            this.enemies = rows.map(row => new Enemy(
                row.ID,
                row.NAME,
                row.LEVEL,
                row.HP,
                row.MP,
                row.SPD,
                row.PHY_ATK,
                row.PHY_DEF,
                row.MAG_ATK,
                row.MAG_DEF,
                row.DROP_ITEM,
                row.DROP_CHANCE,
                row.BEHAVIOUR_PRESET,
                row.DESCRIPTION,
                row.WEIGHT,
                row.ATTENUATION,
                row.FIXED_ROOMS,
                row.IS_UNIQUE,
                row.IS_PRIORITY
            ));

            const locationStmt = db.prepare('SELECT * FROM LocationEnemies');
            const locationRows = locationStmt.all();
            locationRows.forEach(row => {
                const key = `${row.REGION_ID}_${row.LOCATION_ID}`;
                if (!this.locationEnemies.has(key)) {
                    this.locationEnemies.set(key, []);
                }
                const enemy = this.enemies.find(e => e.id === row.ENEMY_ID);
                if (enemy) {
                    this.locationEnemies.get(key).push(enemy);
                }
            });

        } catch (error) {
            console.error('Error loading enemies from database:', error);
        } finally {
            db.close();
        }
    }

    getEnemiesForLocation(regionId, locationId) {
        const key = `${regionId}_${locationId}`;
        const result = this.locationEnemies.get(key) || [];
        if (result.length > 0) {
            console.log(`Enemies found for regionId ${regionId} and locationId ${locationId}`);
        }
        return result;
    }
}

export { EnemyManager };