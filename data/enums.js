export const Regions = {
    'MOKUAH': 0,
    'NYRA': 1,
    'ISFJALL': 2,
    'THE_TRENCH': 3
};

export const MokuahLocations = {
    'VILLAGE CENTER': 0,
    'BLACKSMITH': 1,
    'FARM': 2,
    'CLINIC': 3,
    'DOCK': 4,
    'JUNGLE': 5,
    'VOLCANO': 6
};

export const NyraLocations = {
    'TOWN': 0,
    'CRAFTHOUSE': 1,
    'TAVERN': 2,
    'BEACH': 3,
    'LABYRINTH': 4
};

export const IsfjallLocations = {
    'CITY_CENTER': 0,
    'BLACKSMITH': 1,
    'DOCK': 2,
    'TUNDRA': 3
};

export const TheTrenchLocations = {
    'TRENCH_ENTRANCE': 0,
    'THE_SHALLOWS': 1,
    'THE_DEPTHS': 2,
    'OBSIDIAN_CITY': 3
};

export const Class = {
    "WARRIOR": 0,
    "MAGE": 1,
    "Ranger": 2,
    "Cleric": 3,
    "Druid": 4,
    "Monk": 5,
    "Barbarian": 6,
    "Paladin": 7,
    "Bard": 8
};

export const Race = {
    "AHONU": 0,
    "MANUMANU": 1,
    "KUI": 2,
    "MINOTAUR": 3,
    "ULFUR":4,
};

export const Personality = {
    "NO_PERSONALITY": 0,
    "BRAWNY": 1,
    "WISE": 2
};

export const Ability = {
    "PUNCH": 1,
    "DRAIN": 2,
    "BITE": 3,
    "SLASH": 4,
    "MARTIAL_STRIKE":5,
    "DISARM":6,
    "FORTIFY":7,
    "BREAKOUT":8,
    "SAVAGE_STRIKES":9,
    "FURY":10,
    "FRENZY":11,
    "BLOOD_FRENZY":12,
    "SPIRITBLADE":13,
    "ARCANE_BARRIER":14,
    "FIREBALL":15,
    "INCINERATE":16,
    "CHILLING_BLAST":17,
    "ICE_SPEAR":18,
    "NOXIOUS_CLOUD":19,
    "PUTREFY":20,
    "THUNDERCLAP":21,
    "ELECTRIC_WHIP":22,
    "NIMBLE":23
};

export const ItemType = {
    "MATERIAL": 0,
    "EQUIPMENT": 1,
    "CONSUMABLE": 2,
    "KEY": 3
};

export const Rarity = {
    "WORN": 0,
    "MEDIAN": 1,
    "ENIGMATIC": 2,
    "DELPHIC": 3,
    "ENTHEAT": 4,
    "HALLOWED": 5,
    "APOCRYPHAL": 6
};

export const Skill = {
    "BREWING": 0,
    "COOKING": 1,
    "FARMING": 2,
    "FISHING": 3,
    "GATHERING": 4,
    "MINING": 5,
    "SMITHING": 6,
    "WATERBREATHING": 7
};

export const NodeType = {
    "MINING": 0,
    "GATHERING": 1,
    "FISHING": 2
};

export const Item = {
    "SALVAGE": 1,
    "LARGE_INTACT_SHELL": 2,
    "CORAL": 3,
    "BONE": 4,
    "LAVA_CHUNKS": 5,
    "OBSIDIAN": 6,
    "FOSSIL_REMAINS": 7,
    "CRAB": 8,
    "EEL": 9,
    "BISNOVA_BUD": 10,
    "TRENCH_WORM_LIVER": 11,
    "SALT_CRYSTAL": 12,
    "CRUSHED_SALT": 13,
    "POLARISED_SALT": 14,
    "DEEP_CRYSTAL": 15,
    "RAW_MEAT": 16,
    "KELP": 17,
    "BRINEAPPLE": 18,
    "TRENCH_FUNGUS": 19,
    "BANEWORT": 20,
    "CHARGE_MOSS": 21,
    "BLIGHTBEAN": 22,
    "BRAIDED_KELP": 23,
    "BOILED_SHELL": 24,
    "CONCENTRATED_CALCIUM": 25,
    "NECROTIC_RESIDUE": 26,
    "NECROSALT_INFUSION": 27,
    "DEEPSPARK_ESSENCE": 28,
    "STORMCORAL_INFUSION": 29,
    "INFUSED_CALCIUM": 30,
    "RECONSTRUCTED_GEOMATTER": 31,
    "GALVANISED_GEOMATTER": 32,
    "MEMORY_MARROW": 33,
    "GALVANIC_MARROW": 34,
    "BISNOVA_CONCENTRATE": 35,
    "KALAs_FINGERNAIL": 36,
    "PRIMORDIAL_STONE": 37,
    "SILVER_GRASS": 38,
    "LOTUS_ROOT": 39
};

export const Items = {}

export const Slot = {
    "Head": 0,
    "Body": 1,
    "Weapon": 2
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



