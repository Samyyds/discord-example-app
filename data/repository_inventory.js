class InventoryRepository {
    constructor() {
        if (InventoryRepository.instance) {
            return InventoryRepository.instance;
        }
        this.inventories = new Map(); // userID -> （characterId -> Inventory)
        InventoryRepository.instance = this;
    }

    static getInstance() {
        if (!InventoryRepository.instance) {
            InventoryRepository.instance = new InventoryRepository();
        }
        return InventoryRepository.instance;
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
    }

    removeItem(userId, characterId, item, quantity) {
        const inventory = this.getInventory(userId, characterId);
        inventory.removeItem(item, quantity);
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
            'Equipment': [],
            'Gem': [],
            'Potion': [],
            'Ingredient': [],
        };

        Object.values(this.items).forEach(({item, quantity}) => {
            if (groupedItems.hasOwnProperty(item.type)) {
                groupedItems[item.type].push({ ...item, quantity });
            }
        });

        return groupedItems;
    }

}

export { InventoryRepository };

