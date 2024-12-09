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
        super(equipmentType);
        this.slot = equipmentType.slot;
        this.isTwoHanded = equipmentType.isTwoHanded;
        this.hp = equipmentType.hp;
        this.mp = equipmentType.mp;
        this.spd = equipmentType.spd;
        this.physicalATK = equipmentType.physicalATK;
        this.physicalDEF = equipmentType.physicalDEF;
        this.magicATK = equipmentType.magicATK;
        this.magicDEF = equipmentType.magicDEF;
        this.isSub = equipmentType.isSub;
        this.rarity = equipmentType.rarity;
    }
}

class Consumable extends Item {
    constructor(consumableType) {
        super(consumableType);
        this.effect = consumableType.effect;
        this.effectValue = consumableType.effectValue;
    }
}

class Fish {
    constructor(fishType) {
        this.id = fishType.id;
        this.name = fishType.name;
        this.type = fishType.type;
        this.tier = fishType.tier;
        this.description = fishType.description;
    }
}

class Key {
    constructor(keyType) {
        this.id = keyType.id;
        this.name = keyType.name;
        this.type = keyType.type;
        this.tier = keyType.rarity;
        this.description = keyType.description;
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
        this.fishTemplates = [];
        this.keyTemplates = [];

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
                description: row.DESCRIPTION,
                slot: row.SLOT,
                isTwoHanded: row.ISTWOHANDED,
                hp: row.HP,
                mp: row.MP,
                spd: row.SPD,
                physicalATK: row.PHY_ATK,
                physicalDEF: row.PHY_DEF,
                magicATK: row.MAG_ATK,
                magicDEF: row.MAG_DEF,
                isSub: row.ISSUB
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
                description: row.DESCRIPTION,
                effect: row.EFFECT,
                effectValue: row.EFFECT_VALUE
            }));

            const fishStmt = db.prepare('SELECT * FROM Fishes');
            const fishRows = fishStmt.all();
            this.fishTemplates = fishRows.map(row => ({
                id: row.ID,
                name: row.NAME,
                type: row.TYPE,
                tier: row.TIER,
                description: row.DESCRIPTION
            }));

            const keyStmt = db.prepare('SELECT * FROM Keys');
            const keyRows = keyStmt.all();
            this.keyTemplates = keyRows.map(row => ({
                id: row.ID,
                name: row.NAME,
                type: row.TYPE,
                tier: row.RARITY,
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

    getConsumableDataById(consumableId) {
        return this.consumableTemplates.find(item => item.id === consumableId);
    }

    getEquipmentDataById(equipmentId) {
        return this.equipmentTemplates.find(item => item.id === equipmentId);
    }

    getFishDataById(fishId) {
        return this.fishTemplates.find(item => item.id === fishId);
    }

    getKeyDataById(keyId) {
        return this.keyTemplates.find(item => item.id === keyId);
    }

    parseYieldQuantity(yieldQuantity) {
        const [min, max] = yieldQuantity.split('-').map(Number);
        return { min, max };
    }
}

export { Item, Equipment, Consumable, Fish, Key, ItemManager };