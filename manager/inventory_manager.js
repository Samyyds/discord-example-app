import { ItemType } from '../data/enums.js';
import { updateInventoryToDB } from "../db/mysql.js";

class InventoryManager {
    constructor() {
        if (InventoryManager.instance) {
            return InventoryManager.instance;
        }
        this.inventories = new Map(); // userID -> （characterId -> Inventory)
        InventoryManager.instance = this;
    }

    static getInstance() {
        if (!InventoryManager.instance) {
            InventoryManager.instance = new InventoryManager();
        }
        return InventoryManager.instance;
    }

    getInventory(userId, characterId) {
        if (!this.inventories.has(userId)) {
            this.inventories.set(userId, new Map());
        }
        const characterInventories = this.inventories.get(userId);
        if (!characterInventories.has(characterId)) {
            characterInventories.set(characterId, new Inventory());
        }

        return characterInventories.get(characterId);
    }

    hasItem(userId, characterId, type, itemId) {
        const inventory = this.getInventory(userId, characterId);
        return inventory.hasItem(type, itemId);
    }

    getItem(userId, characterId, type, itemId) {
        const inventory = this.getInventory(userId, characterId);
        return inventory.getItem(type, itemId);
    }

    addItem(userId, characterId, item, quantity) {
        const inventory = this.getInventory(userId, characterId);
        inventory.addItem(item, quantity);
        updateInventoryToDB(userId, characterId, item, quantity, 'add');
    }

    removeItem(userId, characterId, item, quantity) {
        const inventory = this.getInventory(userId, characterId);
        inventory.removeItem(item, quantity);
        updateInventoryToDB(userId, characterId, item, quantity, 'remove');
    }

    useItem(userId, characterId, item) {
        const inventory = this.getInventory(userId, characterId);
        inventory.useItem(item);
    }

    equipItem(userId, characterId, item) {
        const inventory = this.getInventory(userId, characterId);
        inventory.equipItem(item);
    }
}

class Inventory {
    constructor() {
        this.itemsByType = {}; 
    }

    addItem(item, quantity = 1) {
        const type = item.type;
        if (!this.itemsByType[type]) {
            this.itemsByType[type] = {};
        }

        if (this.itemsByType[type][item.id]) {
            this.itemsByType[type][item.id].quantity += quantity;
        } else {
            this.itemsByType[type][item.id] = { item, quantity };
        }
    }

    removeItem(item, quantity = 1) {
        const type = item.type;
        const itemsOfType = this.itemsByType[type];
        if (itemsOfType && itemsOfType[item.id] && itemsOfType[item.id].quantity >= quantity) {
            itemsOfType[item.id].quantity -= quantity;
            if (itemsOfType[item.id].quantity <= 0) {
                delete itemsOfType[item.id];
            }
        } else {
            console.log('Not enough item quantity or item does not exist in inventory.');
        }
    }

    getItem(type, itemId) {
        if (this.itemsByType[type] && this.itemsByType[type][itemId]) {
            return this.itemsByType[type][itemId].item;
        }
        return null;
    }

    hasItem(type, itemId) {
        return this.itemsByType[type] && this.itemsByType[type][itemId] && this.itemsByType[type][itemId].quantity > 0;
    }

    loadItem(item, quantity) {
        const type = item.type;
        if (!this.itemsByType[type]) {
            this.itemsByType[type] = {};
        }
        this.itemsByType[type][item.id] = { item, quantity };
    }

    useItem(item) {
        if (this.hasItem(item.type, item.id)) {
            console.log(`Using ${item.name}`);
            this.removeItem(item, 1);
        } else {
            console.log(`${item.name} cannot be used directly.`);
        }
    }

    getItemsGroupedByType() {
        const result = {};
        for (const type in this.itemsByType) {
            result[type] = Object.values(this.itemsByType[type]); 
        }
        return result;
    }
}

export { InventoryManager };

