class Item {
    constructor(id, name, type, source = [], details = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.source = source;
        this.details = details;
    }
}
//source ["harvest","battle","purchase"]
//details {和source的index对应}
class Ore extends Item {
    constructor(id, name, source, details, transformed) {
        super(id, name, 'Ore', source, details);
        this.transformed = transformed;
    }
}

class RawIngredient extends Item {
    constructor(id, name, source, details) {
        super(id, name, 'Raw Ingredient', source, details);
    }
}

class Potion extends Item {
    constructor(id, name, source, details) {
        super(id, name, 'Potion', source, details);
    }
}

class Fish extends Item {
    constructor(id, name, source, details) {
        super(id, name, 'Fish', source, details);
    }
}

class Gem extends Item {
    constructor(id, name, source, details) {
        super(id, name, 'Gem', source, details);
    }
}

class Equipment extends Item {
    constructor(id, name, source, details, slot, twoHanded, attributes) {
        super(id, name, 'Equipment', source, details);
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

class ItemRepository {
    constructor() {
        if (ItemRepository.Instance) {
            return ItemRepository.Instance = new ItemRepository();
        }

        this.itemsByLocations = new Map();//location -> (item -> quantity)
        ItemRepository.Instance = this;
    }

    static getInstance() {
        if (!ItemRepository.instance) {
            ItemRepository.instance = new ItemRepository();
        }
        return ItemRepository.instance;
    }

    createItem(type, itemData) {
        switch (type) {
            case 'Raw Ingredient':
                return new RawIngredient(itemData.name, itemData.source, itemData.details);
            case 'Potion':
                return new Potion(itemData.name, itemData.source, itemData.details);
            case 'Fish':
                return new Fish(itemData.name, itemData.source, itemData.details);
            case 'Gem':
                return new Gem(itemData.name, itemData.source, itemData.details);
            case 'Equipment':
                return new Equipment(itemData.name, itemData.source, itemData.details, itemData.slot, itemData.twoHanded, itemData.attributes);
            default:
                console.error(`Unknown item type: ${type}`);
                return null;
        }
    }

    addItemToLocation(regionId, roomId, item, quantity) {
        const locationKey = `${regionId}_${roomId}`;
        if (!this.itemsByLocations.has(locationKey)) {
            this.itemsByLocations.set(locationKey, new Map());
        }
        const itemsMap = this.itemsByLocations.get(locationKey);
        if (itemsMap.has(item)) {
            itemsMap.set(item, itemsMap.get(item) + quantity);
        } else {
            itemsMap.set(item, quantity);
        }
    }

    removeItemFromLocation(regionId, roomId, item) {
        const locationKey = `${regionId}_${roomId}`;
        if (this.itemsByLocations.has(locationKey)) {
            const itemsMap = this.itemsByLocations.get(locationKey);
            if (itemsMap.has(item) && itemsMap.get(item) > 0) {
                itemsMap.set(item, itemsMap.get(item) - 1);
            }
        }
    }

    getItemByName(regionId, roomId, itemName) {
        const locationKey = `${regionId}_${roomId}`;
        if (this.itemsByLocations.has(locationKey)) {
            const itemsMap = this.itemsByLocations.get(locationKey);
            for (let [item,] of itemsMap.entries()) {
                if (item.name.toLowerCase() === itemName.toLowerCase()) {
                    return item;
                }
            }
        }
        return null;
    }

    getItemCountByName(regionId, roomId, itemName) {
        const locationKey = `${regionId}_${roomId}`;
        if (this.itemsByLocations.has(locationKey)) {
            const itemsMap = this.itemsByLocations.get(locationKey);
            for (let [item, quantity] of itemsMap.entries()) {
                if (item.name.toLowerCase() === itemName.toLowerCase()) {
                    return quantity;
                }
            }
        }
        return 0;
    }

    getItemsInLocation(regionId, roomId) {
        const locationKey = `${regionId}_${roomId}`;
        if (this.itemsByLocations.has(locationKey)) {
            const itemsMap = this.itemsByLocations.get(locationKey);
            return Array.from(itemsMap).map(([item, quantity]) => ({ item, quantity }));
        }
        return [];
    }
}

export { Item, Ore, RawIngredient, Potion, Fish, Gem, Equipment, ItemRepository };

