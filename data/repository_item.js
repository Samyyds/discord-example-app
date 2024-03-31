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

        this.itemsByLocations = new Map();//location -> (item.id -> [item,quantity])
        ItemRepository.Instance = this;
    }

    static getInstance() {
        if (!ItemRepository.instance) {
            ItemRepository.instance = new ItemRepository();
        }
        return ItemRepository.instance;
    }

    createItem(itemData) {
        switch (itemData.type) {
            case 'Ingredient':
                return new Ingredient(itemData);
            case 'Potion':
                return new Potion(itemData);
            case 'Fish':
                return new Fish(itemData);
            case 'Gem':
                return new Gem(itemData);
            case 'Equipment':
                return new Equipment(itemData);
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
        if (itemsMap.has(item.id)) {
            const currentItemInfo = itemsMap.get(item.id);
            currentItemInfo.quantity += quantity;
        } else {
            itemsMap.set(item.id, { item, quantity });
        }
    }
    

    removeItemFromLocation(regionId, roomId, itemId, quantity) {
        const locationKey = `${regionId}_${roomId}`;
        if (this.itemsByLocations.has(locationKey)) {
            const itemsMap = this.itemsByLocations.get(locationKey);
            if (itemsMap.has(itemId)) {
                const itemInfo = itemsMap.get(itemId);
                itemInfo.quantity -= quantity;
                if (itemInfo.quantity <= 0) {
                    itemsMap.delete(itemId);
                }
            }
        }
    }

    getItemByName(regionId, roomId, itemName) {
        const locationKey = `${regionId}_${roomId}`;
        if (this.itemsByLocations.has(locationKey)) {
            const itemsMap = this.itemsByLocations.get(locationKey);

            let itemId = null;
            for (let [id, { item }] of itemsMap.entries()) {
                if (item.name.toLowerCase() === itemName.toLowerCase()) {
                    itemId = id;
                    break;
                }
            }
            if (itemId) {
                return itemsMap.get(itemId).item;
            }
        }
        return null;
    }

    getItemCountByName(regionId, roomId, itemName) {
        const locationKey = `${regionId}_${roomId}`;
        if (this.itemsByLocations.has(locationKey)) {
            const itemsMap = this.itemsByLocations.get(locationKey);

            const itemId = itemsData.find(item => item.name.toLowerCase() === itemName.toLowerCase())?.id;
            if (itemId && itemsMap.has(itemId)) {
                return itemsMap.get(itemId).quantity;
            }
        }
        return 0;
    }

    getItemsInLocation(regionId, roomId) {
        const locationKey = `${regionId}_${roomId}`;
        const itemsList = [];
        if (this.itemsByLocations.has(locationKey)) {
            const itemsMap = this.itemsByLocations.get(locationKey);
            itemsMap.forEach((value, key) => {
                itemsList.push({
                    id: key,
                    item: value.item,
                    quantity: value.quantity
                });
            });
        }
        return itemsList;
    }
}

export { Item, Ore, Ingredient, Potion, Fish, Gem, Equipment, ItemRepository };

