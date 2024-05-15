class Region {
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.locations = new Map();
    }

    addLocation(location) {
        this.locations.set(location.locationId, location);
    }

    getLocation(locationId) {
        return this.locations.get(locationId);
    }
}

class Location {
    constructor(id, name, regionId, locationId, roomCount = 1, description = '') {
        this.id = `${regionId}-${id}`;
        this.name = name;
        this.regionId = regionId;
        this.locationId = locationId;
        this.roomCount = roomCount;
        this.description = description;
        this.rooms = new Map();
    }

    generateRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            const newRoom = new Room(roomId, this.id)
            //newRoom.spawnEnemies();
            this.rooms.set(roomId, newRoom);
        }
        return this.rooms.get(roomId);
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    setRoomDescription(roomId, description) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Room(roomId, this.id));
        }
        this.rooms.get(roomId).description = description;
    }
}

class Room {
    constructor(roomId, locationId, hasEnemy = false, description = '') {
        this.roomId = roomId;
        this.locationId = locationId;
        this.hasEnemy = hasEnemy;
        this.description = description;
    }

    spawnEnemies() {
        this.hasEnemy = true;
    }

    defeatEnemy() {
        this.hasEnemy = false;
    }
}

export { Region, Location, Room };