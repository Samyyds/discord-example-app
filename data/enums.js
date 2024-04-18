export const Worlds = {
    'MOKUAH': 0,
    'NYRA': 1,
    'ISFJALL': 2,
    'THE_TRENCH': 3
}

export const MokuahLocations = {
    'VILLAGE CENTER': 0,
    'BLACKSMITH': 1,
    'FARM': 2,
    'CLINIC': 3,
    'DOCK': 4,
    'JUNGLE': 5,
    'VOLCANO': 6
}

export const NyraLocations = {
    'TOWN': 0,
    'CRAFTHOUSE': 1,
    'TAVERN': 2,
    'BEACH': 3,
    'LABYRINTH': 4
}

export const IsfjallLocations = {
    'CITY_CENTER': 0,
    'BLACKSMITH': 1,
    'DOCK': 2,
    'TUNDRA': 3
}

export const TheTrenchLocations = {
    'TRENCH_ENTRANCE': 0,
    'THE_SHALLOWS': 1,
    'THE_DEPTHS': 2,
    'OBSIDIAN_CITY': 3
}

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
    "SHORT SWORD": "weap_001_shortsword"
}

export const Slot = {
    "Head": 0,
    "Body": 1,
    "Weapon": 2
}

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



