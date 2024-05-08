class RegionsData {
    static Regions = {
        MOKUAH: {
            name: 'Moku\'ah',
            id: 0,
            locations: {
                VILLAGE_CENTER: { id: 0, name: 'Village Center', roomCount: 1 },
                BLACKSMITH: { id: 1, name: 'Blacksmith', roomCount: 1 },
                FARM: { id: 2, name: 'Farm', roomCount: 1 },
                CLINIC: { id: 3, name: 'Clinic', roomCount: 1 },
                DOCK: { id: 4, name: 'Dock', roomCount: 1 },
                JUNGLE: { id: 5, name: 'Jungle', roomCount: 100 },
                VOLCANO: { id: 6, name: 'Volcano', roomCount: 100 }
            }
        },
        NYRA: {
            name: 'Nyra',
            id: 1,
            locations: {
                Town: { id: 0, name: 'Town', roomCount: 1 },
                CRAFTHOUSE: { id: 1, name: 'Crafthouse', roomCount: 1 },
                TAVERN: { id: 2, name: 'Tavern', roomCount: 1 },
                BEACH: { id: 3, name: 'Beach', roomCount: 1 },
                LABYRINTH: { id: 4, name: 'Labyrinth', roomCount: 1 }
            }

        },
        ISFJALL: {
            name: 'Isfjall',
            id: 2,
            locations: {
                CITY_CENTER: { id: 0, name: 'City Center', roomCount: 1 },
                BLACKSMITH: { id: 1, name: 'Blacksmith', roomCount: 1 },
                DOCK: { id: 2, name: 'Dock', roomCount: 1 },
                TUNDRA: { id: 3, name: 'Tundra', roomCount: 1 }
            }
        },
        THE_TRENCH: {
            name: 'The Trench',
            id: 3,
            locations: {
                ENTRANCE: { id: 0, name: 'Entrance', roomCount: 1 },
                THE_SHALLOWS: { id: 1, name: 'The Shallows', roomCount: 50 },
                THE_DEPTHS: { id: 2, name: 'The Depths', roomCount: 50 },
                OBSIDIAN_CITY: { id: 3, name: 'Obsidian City', roomCount: 1 }
            }
        }
    }

    static changeRegionPaths = {
        0: { // Moku'ah ID
            4: [1, 3], // Moku'ah Dock (4) to Nyra Beach (1) and Trench Entrance (3)
        },
        1: { // Nyra ID
            3: [0, 2, 3], // Nyra Beach (3) to Moku'ah Dock (0), Isfjall Dock (2), and Trench Entrance (3)
        },
        2: { // Isfjall ID
            2: [1, 3], // Isfjall Dock (2) to Nyra Beach (1) and Trench Entrance (3)
        },
        3: { // The Trench ID
            0: [0, 1, 2], // Trench Entrance (0) to Moku'ah Dock (0), Nyra Beach (1), and Isfjall Dock (2)
        }
    };

    static getRegionById(targetRegionId) {
        for (const regionKey in this.Regions) {
            const region = this.Regions[regionKey];
            if (region.id === targetRegionId) {
                return region;
            }
        }
        return null;
    }

    static getLocationById(regionId, locationId) {
        const region = this.getRegionById(regionId);
        if (region && region.locations) {
            for (const locationKey in region.locations) {
                const location = region.locations[locationKey];
                if (location.id === locationId) {
                    return location;
                }
            }
        }
        return null;
    }

    static getRoomCount(regionId, locationId) {
        for (const regionKey in this.Regions) {
            const region = this.Regions[regionKey];
            if (region.id === regionId) {
                for (const locationKey in region.locations) {
                    const location = region.locations[locationKey];
                    if (location.id === locationId) {
                        return location.roomCount;
                    }
                }
            }
        }
        console.error("Region or Location not found.");
        return undefined;
    }

    static isValidRoom(regionId, locationId) {
        return this.getRoomCount(regionId, locationId) > 1;
    }
}

class LocationRepository {
    constructor() {
        if (LocationRepository.instance) {
            return LocationRepository.instance;
        }

        this.locations = new Map(); // user ID -> Map(character ID -> location)
        LocationRepository.instance = this;
    }

    static getInstance() {
        return LocationRepository.instance || new LocationRepository();
    }

    /**
     * @param {number} userId - The user's ID.
     * @param {number} characterId - The character's ID.
     * @param {number} regionId - The worldID where the character is now.
     * @param {number} locationId - The region ID where the character is now.
     * @param {number} roomId - The room ID where the character is now.
     */
    setLocation(userId, characterId, regionId = 0, locationId = 0, roomId = 0) {
        if (!this.locations.has(userId)) {
            this.locations.set(userId, new Map());
        }
        this.locations.get(userId).set(characterId, { regionId, locationId, roomId });
    }

    getLocation(userId, characterId) {
        let userLocations = this.locations.get(userId);
        return userLocations ? userLocations.get(characterId) : null;
    }

    moveRegion(userId, characterId, targetRegionId, targetLocationId) {
        if (this.canMoveRegion(userId, characterId, targetRegionId, targetLocationId)) {
            this.setLocation(userId, characterId, targetRegionId, targetLocationId, 0);
            return true;
        } else {
            console.error("Invalid movement path or region/location ID.");
            return false;
        }
    }

    canMoveRegion(userId, characterId, targetRegionId, targetLocationId) {
        const location = this.getLocation(userId, characterId);
        if (!location) {
            console.error("No location found for this user/character.");
            return false;
        }

        const currentRegionPaths = RegionsData.changeRegionPaths[location.regionId];

        const currentLocationPaths = currentRegionPaths && currentRegionPaths[location.locationId];

        if (currentLocationPaths.includes(targetRegionId)) {
            const targetLocation = RegionsData.getLocationById(targetRegionId, targetLocationId);
            if (targetLocation) {
                return true;
            } else {
                console.error(`Invalid target location ID: ${targetLocationId} for region ID: ${targetRegionId}`);
            }
        }
        return false;
    }

    moveLocation(userId, characterId, regionId, locationId) {
        console.log(locationId);
        this.setLocation(userId, characterId, regionId, locationId, 0);
    }

    canMoveLocation(userId, characterId, destRegionId, destLocationId) {
        const location = this.getLocation(userId, characterId);
        return location && location.regionId === destRegionId && location.locationId !== destLocationId && location.roomId === 0;
    }

    moveRoom(userId, characterId, isUp, interaction) {
        const location = this.getLocation(userId, characterId);
        if (!location) return;
        const region = RegionsData.Regions[Object.keys(RegionsData.Regions).find(key => RegionsData.Regions[key].id === location.regionId)];
        const locationData = region.locations[Object.keys(region.locations).find(key => region.locations[key].id === location.locationId)];
        const roomCount = locationData.roomCount;

        let newRoomId = location.roomId + (isUp ? -1 : 1);

        const hasSubscriberRole = interaction.member.roles.cache.some(role => role.name === 'Subscriber');
        console.log(`hasSubscriberRole: ${hasSubscriberRole}`);
        console.log(`locationData.name: ${locationData.name}`);
        console.log(`newRoomId: ${newRoomId}`);
        if (!hasSubscriberRole && locationData.name === 'Jungle' && newRoomId > 1) {
            throw new Error('Oops! Please upgrade your account to explore further.');
        }

        if ((isUp && newRoomId >= 0) || (!isUp && newRoomId < roomCount)) {
            this.setLocation(userId, characterId, location.regionId, location.locationId, newRoomId);
        }
    }

    canMoveUp(userId, characterId) {
        const location = this.getLocation(userId, characterId);
        return location && location.roomId > 0;
    }

    canMoveDown(userId, characterId) {
        const location = this.getLocation(userId, characterId);
        if (!location) return false;
        const region = RegionsData.Regions[Object.keys(RegionsData.Regions).find(key => RegionsData.Regions[key].id === location.regionId)];
        const locationData = region.locations[Object.keys(region.locations).find(key => region.locations[key].id === location.locationId)];
        const roomCount = locationData.roomCount;
        return location.roomId < roomCount;
    }
}

export { RegionsData, LocationRepository };