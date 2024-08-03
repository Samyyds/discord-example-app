import Database from "better-sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

class Item {
    constructor(itemType) {
        this.id = itemType.id;
        this.name = itemType.name;
        this.type = itemType.type;
        this.rarity = itemType.rarity;
        this.value = itemType.value;
        this.isQuest = itemType.isQuest;
        this.description = itemType.description;
    }
}

class Equipment extends Item {
    constructor(equipmentType) {
        super(equipmentType.id, equipmentType.name, equipmentType.type, equipmentType.rarity, equipmentType.value, equipmentType.isQuest, equipmentType.description);
    }
}

class Consumable extends Item {
    constructor(consumableType) {
        super(consumableType.id, consumableType.name, consumableType.type, consumableType.rarity, consumableType.value, consumableType.isQuest, consumableType.description);
    }
}

class ItemManager {
    constructor() {
        if (ItemManager.instance) {
            return ItemManager.instance;
        }

        this.itemTemplates = [];
        this.equipmentTemplates = [];
        this.consumableTemplates = [];

        ItemManager.instance = this;
    }

    static getInstance() {
        if (!ItemManager.instance) {
            ItemManager.instance = new ItemManager();
        }
        return ItemManager.instance;
    }

    loadFromDB() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const dbPath = path.join(__dirname, '../db/merfolk_and_magic_db.db');
        const db = new Database(dbPath, { verbose: console.log });

        try {
            const itemStmt = db.prepare('SELECT * FROM Items');
            const itemRows = itemStmt.all();
            this.itemTemplates = itemRows.map(row => ({
                id: row.ID,
                name: row.NAME,
                type: row.TYPE,
                rarity: row.RARITY,
                value: row.VALUE,
                isQuest: row.ISQUEST,
                description: row.DESCRIPTION
            }));

            const equipmentStmt = db.prepare('SELECT * FROM Equipments');
            const equipmentRows = equipmentStmt.all();
            this.equipmentTemplates = equipmentRows.map(row => ({
                id: row.ID,
                name: row.NAME,
                type: row.TYPE,
                rarity: row.RARITY,
                value: row.VALUE,
                isQuest: row.ISQUEST,
                description: row.DESCRIPTION
            }));

            const consumableStmt = db.prepare('SELECT * FROM Consumables');
            const consumableRows = consumableStmt.all();
            this.consumableTemplates = consumableRows.map(row => ({
                id: row.ID,
                name: row.NAME,
                type: row.TYPE,
                rarity: row.RARITY,
                value: row.VALUE,
                isQuest: row.ISQUEST,
                description: row.DESCRIPTION
            }));

        } catch (error) {
            console.error('Error loading nodes from database:', error);
        } finally {
            db.close();
        }
    }

    getItemDataById(itemId) {
        return this.itemTemplates.find(item => item.id === itemId);        
    }
}

export { Item, Equipment, Consumable, ItemManager };