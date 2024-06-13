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

export const Ability = {
    "PUNCH": 0,
    "DRAIN": 1,
    "BITE": 2,
    "SLASH": 3,
    "MARTIAL_STRIKE":4,
    "DISARM":5,
    "FORTIFY":6,
    "BREAKOUT":7,
    "SAVAGE_STRIKES":8,
    "FURY":9,
    "FRENZY":10,
    "BLOOD_FRENZY":11,
    "SPIRITBLADE":12,
    "ARCANE_BARRIER":13,
    "FIREBALL":14,
    "INCINERATE":15,
    "CHILLING_BLAST":16,
    "ICE_SPEAR":17,
    "NOXIOUS_CLOUD":18,
    "PUTREFY":19,
    "THUNDERCLAP":20,
    "ELECTRIC_WHIP":21,
    "NIMBLE":22
};

export const ItemType = {
    "MATERIAL": 0,
    "GEAR": 1,
    "CONSUMABLE": 2,
    "KEY": 3
};

export const Rarity = {
    "RUSTED_JUNK": 0,
    "STANDARD": 1,
    "VALUABLE": 2,
    "FABLED": 3,
    "ENIGMATA": 4,
    "DELPHIC": 5,
    "ENTHEAT": 6,
    "HALLOWED": 7,
    "APOCRYPHAL": 8
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
    "SALVAGE": 0,
    "SHELL": 1,
    "CORAL": 2,
    "BONE": 3,
    "KELP_BROTH": 4,
    "KELP": 5,
    "CRAB": 6,
    "BOILED_CRAB_W/_DICED_KELP": 7
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



