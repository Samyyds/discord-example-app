import { Enemy } from "../manager/enemy_manager.js";

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

    initializeRooms() {
        for (let roomId = 0; roomId <= this.roomCount; roomId++) {
            this.generateRoom(roomId);
        }
    }

    generateRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            const newRoom = new Room(roomId, this.id);
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
        this.enemies = [];
        this.uniqueEnemiesSpawned = new Set();
    }

    calculateAttenuatedWeight(weight, attenuation, floor) {
        return weight * Math.pow(attenuation, floor);
    }

    spawnEnemies(enemyTemplates) {
        if (!enemyTemplates || enemyTemplates.length === 0) {
            this.hasEnemy = false;
            return;
        }

        const currentFloor = this.roomId;
        const maxEnemies = 5;

        // Spawn priority enemies first
        const priorityEnemies = enemyTemplates.filter(enemy => enemy.isPriority && (!enemy.fixedRooms || enemy.fixedRooms.includes(currentFloor)));
        for (const enemy of priorityEnemies) {
            if (!enemy.isUnique || (enemy.isUnique && !this.uniqueEnemiesSpawned.has(enemy.id))) {
                this.enemies.push(new Enemy(enemy));
                if (enemy.isUnique) {
                    this.uniqueEnemiesSpawned.add(enemy.id);
                }
            }
        }

        // Calculate the attenuated weight for each non-priority enemy based on the current floor
        const weightedEnemies = enemyTemplates
            .filter(enemy => !enemy.isPriority)
            .map(enemy => {
                let attenuatedWeight = enemy.weight * Math.pow(enemy.attenuation, currentFloor);
                if (enemy.fixedRooms && enemy.fixedRooms.length > 0 && !enemy.fixedRooms.includes(currentFloor)) {
                    attenuatedWeight = 0;
                }
                return {
                    ...enemy,
                    attenuatedWeight
                };
            });

        // Filter out enemies with 0 attenuated weight
        const validEnemies = weightedEnemies.filter(enemy => enemy.attenuatedWeight > 0);

        // Calculate the total attenuated weight
        const totalAttenuatedWeight = validEnemies.reduce((acc, enemy) => acc + enemy.attenuatedWeight, 0);

        if (totalAttenuatedWeight === 0 && this.enemies.length === 0) {
            this.hasEnemy = false;
            return;
        }

        // Determine the number of remaining enemies to spawn
        const numberOfEnemies = Math.min(Math.floor(Math.random() * maxEnemies) + 1, maxEnemies - this.enemies.length);

        for (let i = 0; i < numberOfEnemies; i++) {
            let randomWeight = Math.random() * totalAttenuatedWeight;
            for (const enemy of validEnemies) {
                if (randomWeight < enemy.attenuatedWeight) {
                    const newEnemy = new Enemy(enemy);  // Create a new instance of the enemy
                    this.enemies.push(newEnemy);
                    break;
                }
                randomWeight -= enemy.attenuatedWeight;
            }
        }

        this.hasEnemy = this.enemies.length > 0;
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
            this.hasEnemies = this.enemies.length > 0;
        }
    }

    hasEnemies() {
        return this.enemies.length > 0;
    }

    defeatEnemy() {
        this.hasEnemy = false;
    }

    getEnemies() {
        return this.enemies;
    }
}

export { Region, Location, Room };