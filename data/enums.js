export const Class = {
    "NO_CLASS": 0,
    "WARRIOR": 1,
    "ROGUE": 2,
    "MAGE": 3
};

export const Race = {
    "HUMAN": 0,
    "OGRE": 1,
    "DRACONID": 2,
    "ELF": 3
};

export const Personality = {
    "NO_PERSONALITY": 0,
    "BRAWNY": 1,
    "WISE": 2
};

export const ItemType = {
    "NONE": 0,
    "ORE": 1,
    "INGREDIENT": 2,
    "POTION": 3,
    "GEM": 4,
    "EQUIPMENT": 5,
    "FISH": 6
}

export const Items = {
    "COPPER ORE": "ore_001_cop",
    "COPPER": "ing_001_cop",
    "MUSHROOM": "ing_100_mushroom",
    "SHORTSWORD": "weap_001_shortsword"
}

export const LocationType = {
    MARA: {
        name: "Mara",
        index: 0,
        rooms: {
            OUTSIDE: { name: "outside", index: 0 },
            BLACKSMITH: { name: "blacksmith", index: 1 },
            ALCHEMIST: { name: "alchemist", index: 2 },
            MAGETOWER: { name: "magetower", index: 3 },
            TOWNHALL: { name: "townhall", index: 4 },
            MARKETPLACE: { name: "marketplace", index: 5 },
            CLINIC: { name: "clinic", index: 6 }
        }
    },
    STONESIDE_DUNGEON: {
        name: "stoneside dungeon",
        index: 1,
        rooms: {
            BASE: { name: "base", index: 0 }
        }
    },
    MOUNTAIN: {
        name: "Mountain",
        index: 2,
        rooms: {
            BASE: { name: "base", index: 0 },
            B1: { name: "b1", index: 1 },
            B2: { name: "b2", index: 2 },
            B3: { name: "b3", index: 3 }
        }
    },
    FOREST: {
        name: "Forest",
        index: 3,
        rooms: {
            BASE: { name: "base", index: 0 }
        }
    },
    GRAVEYARD: {
        name: "Graveyard",
        index: 4,
        rooms: {
            BASE: { name: "base", index: 0 }
        }
    },
    BEACH: {
        name: "Beach",
        index: 5,
        rooms: {
            BASE: { name: "base", index: 0 }
        }
    }
};

export function getLocationFromInput(regionNameInput, roomNameInput) {
    const regionName = regionNameInput.trim().toUpperCase();
    const roomName = roomNameInput.trim().toUpperCase();

    const region = Object.values(LocationType).find(r => r.name.toUpperCase() === regionName);
    if (!region) {
        throw new Error(`Region '${regionNameInput}' not found.`);
    }

    let roomId = -1;
    if (roomName) {
        const roomEntry = Object.entries(region.rooms).find(([key, value]) => value.name.toUpperCase() === roomName);
        if (!roomEntry) {
            throw new Error(`Room '${roomNameInput}' in region '${regionNameInput}' not found.`);
        }
        roomId = roomEntry[1].index;
    }

    return { regionId: region.index, roomId };
}

export function getRegionNameFromId(regionId) {
    for (const key in LocationType) {
        if (LocationType[key].index === regionId) {
            return LocationType[key].name;
        }
    }
    throw new Error(`Region with ID '${regionId}' not found.`);
}



