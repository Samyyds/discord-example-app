class LocationRepository {
    constructor() {
        if (LocationRepository.instance) {
            return LocationRepository.instance;
        }

        this.locations = new Map(); // user ID -> Map(character ID -> location)
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
        return null;
    }

    getCharactersLocations(userId) {
        return this.locations.get(userId) || new Map();
    }

    canMoveRegion(userId, characterId, destRegionId) {
        const location = this.getLocation(userId, characterId);
        if (!location) return false;
        return destRegionId !== location.regionId && location.roomId === 0;
    }

    canMoveRoom(userId, characterId, destRoomId, regionRoomLimits) {
        const location = this.getLocation(userId, characterId);
        if (!location) return false;
        const isValidRoom = destRoomId < regionRoomLimits[location.regionId];
        return isValidRoom && destRoomId !== location.roomId;
    }

    moveRegion(userId, characterId, regionId) {
        this.setLocation(userId, characterId, regionId, 0);
    }

    moveRoom(userId, characterId, roomId) {
        const location = this.getLocation(userId, characterId);
        if (!location) return;
        this.setLocation(userId, characterId, location.regionId, roomId);
    }
}

export { LocationRepository };