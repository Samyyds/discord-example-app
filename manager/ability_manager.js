import Database from "better-sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

class AbilityManager {
    constructor() {
        if (AbilityManager.instance) {
            return AbilityManager.instance;
        }

        this.abilities = {};
    }

    static getInstance() {
        if (!AbilityManager.instance) {
            AbilityManager.instance = new AbilityManager();
        }
        return AbilityManager.instance;
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
                    intensity: row.INTENSITY,
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

    getAbilityById(abilityId) {
        return this.abilities[abilityId] || null;
    }

    getAbilityByName(name) {
        const normalized = name.toLowerCase().replace(/_/g, ' '); 
        return Object.values(this.abilities).find(ability => ability.name.toLowerCase() === normalized);
    }
}

export { AbilityManager };