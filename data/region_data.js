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

export { RegionsData };