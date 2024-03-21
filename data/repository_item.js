import itemsData from '../json/items.json' assert { type: 'json' };

class Item {
    constructor(id, name, type, source, details, description, transformed = null, attributes = null) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.source = source;
        this.details = details;
        this.description = description;
        this.transformed = transformed;
        this.attributes = attributes;
    }
}

class Ore extends Item {
    constructor(itemData) {
        super(itemData.id, itemData.name, itemData.type, itemData.source, itemData.details, itemData.description, itemData.transformed, itemData.attributes);
    }
}

class Ingredient extends Item {
    constructor(itemData) {
        super(itemData.id, itemData.name, itemData.type, itemData.source, itemData.details, itemData.description, itemData.transformed, itemData.attributes);
    }
}

class Potion extends Item {
    constructor(itemData) {
        super(itemData.id, itemData.name, itemData.type, itemData.source, itemData.details, itemData.description, itemData.transformed, itemData.attributes);
    }
}

class Fish extends Item {
    constructor(itemData) {
        super(itemData.id, itemData.name, itemData.type, itemData.source, itemData.details, itemData.description, itemData.transformed, itemData.attributes);
    }
}

class Gem extends Item {
    constructor(itemData) {
        super(itemData.id, itemData.name, itemData.type, itemData.source, itemData.details, itemData.description, itemData.transformed, itemData.attributes);
    }
}

class Equipment extends Item {
    constructor(itemData) {
        super(itemData.id, itemData.name, itemData.type, itemData.source, itemData.details, itemData.description, itemData.transformed, itemData.attributes);
        this.slot = itemData.slot;
        this.twoHanded = itemData.twoHanded;
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
            case 'Ingredient':
                return new Ingredient(itemData.name, itemData.source, itemData.details);
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

    getItemDataById(itemId) {
        const itemData = itemsData.find(item => item.id === itemId);
        if (!itemData) return null;
        return itemData;
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

export { Item, Ore, Ingredient, Potion, Fish, Gem, Equipment, ItemRepository };

