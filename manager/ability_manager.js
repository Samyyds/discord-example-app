import Database from "better-sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

class Ability {
    constructor(id, name, mpCost, intensity, isPassive, itemRestriction, classRestriction, levelRestriction, override, description) {
        this.id = id;
        this.name = name;
        this.mpCost = mpCost;
        this.intensity = intensity;
        this.isPassive = isPassive;
        this.itemRestriction = itemRestriction;
        this.classRestriction = classRestriction;
        this.levelRestriction = levelRestriction;
        this.override = override;
        this.description = description;
    }
}

class AbilityManager {
    constructor() {
        if (AbilityManager.instance) {
            return AbilityManager.instance;
        }

        this.abilityTemplates = [];
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
        const dbPath = path.join(__dirname, '../db/merfolk_and_magic_db.db');
        const db = new Database(dbPath, { verbose: console.log });

        try {
            const abilityStmt = db.prepare('SELECT * FROM Abilities');
            const abilityRows = abilityStmt.all();
            this.abilityTemplates = abilityRows.map(row => ({
                id: row.ID,
                name: row.NAME,
                mpCost: row.MP_COST,
                intensity: row.INTENSITY,
                isPassive: row.IS_PASSIVE,
                itemRestriction: row.ITEM_RESTRICTION,
                classRestriction: row.CLASS_RESTRICTION,
                levelRestriction: row.LEVEL_RESTRICTION,
                override: row.OVERRIDE,
                description: row.DESCRIPTION
            }));

        } catch (error) {
            console.error('Error loading abilities from database:', error);
        } finally {
            db.close();
        }
    }

    assignAbilitiesToCharacter(character) {
        character.abilities = Object.values(this.abilityTemplates)
            .filter(abilityData => this.isAbilityAvailable(character, abilityData))
            .map(abilityData => new Ability(
                abilityData.id,
                abilityData.name,
                abilityData.mpCost,
                abilityData.intensity,
                abilityData.isPassive,
                abilityData.itemRestriction,
                abilityData.classRestriction,
                abilityData.levelRestriction,
                abilityData.override,
                abilityData.description
            ));
    }

    isAbilityAvailable(character, ability) {
        if (ability.levelRestriction && character.level < ability.levelRestriction) {
            return false;
        }
        if (ability.classRestriction && character.classId !== ability.classRestriction) {
            return false;
        }
        if (ability.itemRestriction && !character.isEquipped(ability.itemRestriction)) {
            return false;
        }
        return true;
    }

    getAbilityById(abilityId) {
        return this.abilityTemplates.find(ability => ability.id === abilityId);
    }    
    
    getAbilityByName(name) {
        const normalized = name.toLowerCase().replace(/_/g, ' ');
        return Object.values(this.abilityTemplates).find(ability => ability.name.toLowerCase() === normalized);
    }    
}

export { Ability, AbilityManager };