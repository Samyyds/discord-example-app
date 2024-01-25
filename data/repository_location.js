class LocationRepository {
    constructor() {
        if (LocationRepository.instance) {
            return LocationRepository.instance;
        }

        // user ID -> Map(character ID -> location)
        this.locations = new Map();
        LocationRepository.instance = this;
    }

    static getInstance() {
        if (!LocationRepository.instance) {
            LocationRepository.instance = new LocationRepository();
        }
        return LocationRepository.instance;
    }

    /**
     * @param {number} userId - The user's ID.
     * @param {number} characterId - The character's ID.
     * @param {number} regionId - The region ID where the character is now.
     * @param {number} roomId - The room ID where the character is now.
     */
    setLocation(userId, characterId, regionId = 0, roomId = 0) {
        if (!this.locations.has(userId)) {
            this.locations.set(userId, new Map());
        }
        this.locations.get(userId).set(characterId, { regionId, roomId });
    }

    getLocation(userId, characterId) {
        let userLocations = this.locations.get(userId);
        if (userLocations && userLocations.has(characterId)) {
            return userLocations.get(characterId);
        }
        return null; // Character location not found
    }

    getCharactersLocations(userId) {
        return this.locations.get(userId) || new Map();
    }
}

export { LocationRepository };