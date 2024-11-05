import { Enemy, EnemyManager } from "../manager/enemy_manager.js";
import { Node } from "../manager/node_manager.js";
import { NPCManager } from "../manager/npc_manager.js";

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
    constructor(id, name, regionId, locationId, roomCount = 1, description = '', subscriberOnly = false, questRequired = {}) {
        this.id = `${regionId}-${id}`;
        this.name = name;
        this.regionId = regionId;
        this.locationId = locationId;
        this.roomCount = roomCount;
        this.description = description;
        this.rooms = new Map();
        this.subscriberOnly = subscriberOnly;
        this.questRequired = questRequired;
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

    getRequiredQuest() {
        return this.questRequired;
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
        this.nodes = [];
        this.items = [];
        this.npcs = [];
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
                    const newEnemy = new Enemy(enemy);
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
            if (enemy.isUnique) {
                this.uniqueEnemiesSpawned.delete(enemy.id);
            }
            this.scheduleRespawn(enemy);
        }
    }

    scheduleRespawn(enemy) {
        // if (enemy.isUnique) {
        //      Handle unique enemy respawn rules if needed
        //     return;
        // }
        //
        const respawnTime = enemy.isUnique ? 600000 : 180000; //unique enemy 10mins, regular enemy 3mins
        setTimeout(() => {
            const template = EnemyManager.getInstance().getTemplateById(enemy.id);
            if (enemy.isUnique && this.uniqueEnemiesSpawned.has(template.id)) {
                console.log(`Unique enemy ${template.name} already spawned, skipping respawn.`);
                return;
            }
            this.respawnEnemy(template);
        }, respawnTime);
    }

    respawnEnemy(enemyTemplate) {
        if (!this.uniqueEnemiesSpawned.has(enemyTemplate.id)) {
            const newEnemy = new Enemy(enemyTemplate);
            this.enemies.push(newEnemy);
            if (enemyTemplate.isUnique) {
                this.uniqueEnemiesSpawned.add(enemyTemplate.id);
            }
            console.log(`Enemy ${newEnemy.name} has respawned in Room ID: ${this.roomId}`);
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

    spawnNodes(nodeTemplates) {
        nodeTemplates.forEach(template => {
            this.nodes.push(new Node(template));
        });
    }

    getNodes() {
        return this.nodes;
    }

    addItemToRoom(item) {
        this.items.push(item);
    }

    removeItemFromRoom(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }

    getItems() {
        return this.items;
    }

    generateNPCs(regionId, locationId, roomId) {
        const npcManager = NPCManager.getInstance();

        npcManager.npcTemplates.forEach(npcTemplate => {
            if (npcTemplate.location.regionId === regionId &&
                npcTemplate.location.locationId === locationId &&
                npcTemplate.location.roomId === roomId) {

                const npcInstance = npcManager.createNpcInstance(npcTemplate.id);
                if (npcInstance) {
                    this.npcs.push(npcInstance);
                    console.log(`NPC generated: ${npcInstance.name}`);
                } else {
                    console.log(`Failed to create NPC instance for ID: ${npcTemplate.id}`);
                }
            }
        });
    }

    getNPCs() {
        return this.npcs;
    }
}

export { Region, Location, Room };