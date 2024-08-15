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
    
    hasItem(userId, characterId, itemId) {
        const inventory = this.getInventory(userId, characterId);
        return inventory.hasItem(itemId);
    }

    getItem(userId, characterId, itemId) {
        const inventory = this.getInventory(userId, characterId);
        return inventory.getItem(itemId);
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

    loadItem(item, quantity){// used only during the initial loading from database
        const inventory = this.getInventory(userId, characterId);
        inventory.loadItem(item, quantity);
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
        this.items = {}; // itemID -> { item, quantity }
    }

    hasItem(itemId) {
        return this.items[itemId] && this.items[itemId].quantity > 0;
    }

    getItem(itemId) {
        if (this.items[itemId]) {
            return this.items[itemId];
        } else {
            return null;
        }
    }

    addItem(item, quantity = 1) {
        if (this.items[item.id]) {
            this.items[item.id].quantity += quantity;
        } else {
            this.items[item.id] = { item, quantity };
        }
    }

    removeItem(item, quantity = 1) {
        if (this.items[item.id] && this.items[item.id].quantity >= quantity) {
            this.items[item.id].quantity -= quantity;
            if (this.items[item.id].quantity <= 0) {
                delete this.items[item.id];
            }
        } else {
            console.log('Not enough item quantity or item does not exist in inventory.');
        }
    }

    loadItem(item, quantity) {
        // used only during the initial loading from database
        this.items[item.id] = { item, quantity };
    }


    useItem(item) {
        if (item instanceof Potion && this.items[item.id] && this.items[item.id].quantity > 0) {
            console.log(`Using ${item.name}`);
            this.removeItem(item, 1);
        } else {
            console.log(`${item.name} cannot be used directly.`);
        }
    }

    getItemsGroupedByType() {
        const groupedItems = {
            [ItemType.MATERIAL]: [],
            [ItemType.EQUIPMENT]: [],
            [ItemType.CONSUMABLE]: [],
            [ItemType.QUEST]: [],
        };

        for (const { item, quantity } of Object.values(this.items)) {
            if (groupedItems.hasOwnProperty(item.type)) {
                groupedItems[item.type].push({ ...item, quantity });
            }
        }

        return groupedItems;
    }
}

export { InventoryManager };

