class Item {
    constructor(id, name, type, source = [], detail = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.source = source;
        this.detail = detail;
    }
}
//source ["harvest","battle","purchase"]
//details {和source的index对应}

class RawIngredient extends Item {
    constructor(id, name, source, detail) {
        super(id, name, 'Raw Ingredient', source, detail);
    }
}

class Potion extends Item {
    constructor(id, name, source, detail) {
        super(id, name, 'Potion', source, detail);
    }
}

class Fish extends Item {
    constructor(id, name, source, detail) {
        super(id, name, 'Fish', source, detail);
    }
}

class Gem extends Item {
    constructor(id, name, source, detail) {
        super(id, name, 'Gem', source, detail);
    }
}

class Equipment extends Item {
    constructor(id, name, source, detail, slot, twoHanded, attributes) {
        super(id, name, 'Equipment', source, detail);
        this.slot = slot;
        this.twoHanded = twoHanded;
        this.attributes = createEquipmentAttributes(attributes);
    }

    static createEquipmentAttributes(attributes) {
        const validAttributes = {
            hpBonus: 0, mpBonus: 0, spdBonus: 0,
            physicalATKBonus: 0, physicalDEFBonus: 0,
            magicATKBonus: 0, magicDEFBonus: 0,
            fireATKBonus: 0, fireDEFBonus: 0,
            lightATKBonus: 0, lightDEFBonus: 0,
            darkATKBonus: 0, darkDEFBonus: 0,
            bleedResistBonus: 0, poisonResistBonus: 0
        };

        for (const key in attributes) {
            if (key in validAttributes) {
                validAttributes[key] = attributes[key];
            } else {
                console.error(`Invalid attribute: ${key}`);
            }
        }

        return validAttributes;
    }

    static combineEquipmentAttributes(...attributes) {
        const combinedAttributes = Equipment.createEquipmentAttributes({});
        for (const attribute of attributes) {
            for (const key in attribute) {
                combinedAttributes[key] += attribute[key];
            }
        }
        return combinedAttributes;
    }
}

class InventoryRepository {
    constructor() {
        if (InventoryRepository.instance) {
            return InventoryRepository.instance;
        }
        this.inventories = new Map(); // userID -> Inventory
        InventoryRepository.instance = this;
    }

    static getInstance() {
        if (!InventoryRepository.instance) {
            InventoryRepository.instance = new InventoryRepository();
        }
        return InventoryRepository.instance;
    }

    getInventory(userId) {
        if (!this.inventories.has(userId)) {
            this.inventories.set(userId, new Inventory());
        }
        return this.inventories.get(userId);
    }

    addItem(userId, item, quantity) {
        const inventory = this.getInventory(userId);
        inventory.addItem(item, quantity);
    }

    removeItem(userId, item, quantity) {
        const inventory = this.getInventory(userId);
        inventory.removeItem(item, quantity);
    }

    useItem(userId, item) {
        const inventory = this.getInventory(userId);
        inventory.useItem(ueserId, item);
    }

    equipItem(userId, item) {
        const inventory = this.getInventory(userId);
        inventory.equipItem(userId, item);
    }
}

class Inventory {
    constructor() {
        this.items = {}; // itemID -> { item, quantity }
        this.equipped = {
            weapon: null,
            shield: null,
        };
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

}

export { RawIngredient, Potion, Gem, InventoryRepository };

