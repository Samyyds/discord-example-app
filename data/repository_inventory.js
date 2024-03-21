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
        this.equipped = {}; // slot -> item
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

    equipItem(item) {
        if ((item.type === 'Weapon' || item.type === 'Shield') && this.items[item.id] && this.items[item.id].quantity > 0) {
            const currentEquipped = this.equipped[item.type.toLowerCase()];
            if (currentEquipped) {
                this.addItem(currentEquipped, 1);
            }

            this.equipped[item.type.toLowerCase()] = item;
            this.removeItem(item, 1);

            const equippedItemsAttributes = Object.values(this.equipped).filter(i => i).map(i => i.attributes);
            const totalAttributes = combineEquipmentAttributes(...equippedItemsAttributes);
            console.log('Equipped', item.name, 'New total attributes:', totalAttributes);
        } else {
            console.log('This item cannot be equipped.');
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

