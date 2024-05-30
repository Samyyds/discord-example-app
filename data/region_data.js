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
    }

    calculateAttenuatedWeight(weight, attenuation, floor) {
        return weight * Math.pow(attenuation, floor);
    }

    spawnEnemies(enemyTypes) {
        if (!enemyTypes || enemyTypes.length === 0) {
            this.hasEnemy = false;
            return;
        }

        const maxEnemies = 5;
        const currentFloor = this.roomId;

        // 处理优先级敌人和唯一敌人
        const priorityEnemies = enemyTypes.filter(enemy => enemy.isPriority && (!enemy.fixedRooms || enemy.fixedRooms.includes(currentFloor)));
        const uniqueEnemies = enemyTypes.filter(enemy => enemy.isUnique && (!enemy.fixedRooms || enemy.fixedRooms.includes(currentFloor)));

        if (priorityEnemies.length > 0) {
            this.enemies.push(priorityEnemies[0]); // 生成第一个优先级敌人
        } else {
            uniqueEnemies.forEach(enemy => {
                if (!enemyManager.uniqueEnemies.has(enemy.id)) {
                    this.enemies.push(enemy);
                    enemyManager.uniqueEnemies.add(enemy.id);
                }
            });
        }

        // 计算每个敌人的加权值
        const weightedEnemies = enemyTypes
            .filter(enemy => !enemy.isPriority && (!enemy.fixedRooms || enemy.fixedRooms.includes(currentFloor)))
            .map(enemy => {
                enemy.attenuatedWeight = enemy.weight * Math.pow(enemy.attenuation, currentFloor);
                return enemy;
            });

        // 计算总权重
        const totalWeight = weightedEnemies.reduce((sum, enemy) => sum + enemy.attenuatedWeight, 0);

        // 随机生成敌人
        const numberOfEnemies = Math.min(Math.floor(Math.random() * maxEnemies) + 1, maxEnemies - this.enemies.length);
        for (let i = 0; i < numberOfEnemies; i++) {
            let rand = Math.random() * totalWeight;
            for (const enemy of weightedEnemies) {
                if (rand < enemy.attenuatedWeight) {
                    this.enemies.push(enemy);
                    break;
                }
                rand -= enemy.attenuatedWeight;
            }
        }

        this.hasEnemy = this.enemies.length > 0;
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