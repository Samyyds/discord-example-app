import { RegionManager } from "../manager/region_manager.js";
import { EnemyManager } from '../manager/enemy_manager.js';
import { AbilityManager } from "../manager/ability_manager.js";
import { NodeManager } from "../manager/node_manager.js";

function initializeGame() {
    //initialize region
    const regionManager = RegionManager.getInstance();
    regionManager.loadFromJson();

    //initialize enemy
    const enemyManager = EnemyManager.getInstance();
    enemyManager.loadFromDB();

    //initialize abilities
    const abilityManager = AbilityManager.getInstance();
    abilityManager.loadFromDB();
    //console.log('Abilities loaded:', abilityManager.abilities);

    //initialize nodes
    const nodeManager = NodeManager.getInstance();
    nodeManager.loadFromDB();

    //initialize rooms and generate enemies
    regionManager.regions.forEach(region => {
        region.locations.forEach(location => {
            location.initializeRooms();

            const enemyTypes = enemyManager.getEnemiesForLocation(region.id, location.locationId);

            for (let roomId = 0; roomId <= location.roomCount; roomId++) {
                const room = location.getRoom(roomId);
                room.spawnEnemies(enemyTypes);

                const enemies = regionManager.getRoomByLocation(region.id, location.locationId, roomId).getEnemies();
                console.log(`room id: ${roomId}, Enemies in room: ${enemies.map(enemy => enemy.name).join(', ')}`);
            }
        });
    });

    //generate nodes
    const nodeLocations = nodeManager.getAllNodeLocations();
    for (let i = 0; i <= nodeLocations.length - 1; i++) {
        const room = regionManager.getRoomByLocation(nodeLocations[i].regionId, nodeLocations[i].locationId, nodeLocations[i].roomId);
        if (room) {
            room.spawnNodes(nodeLocations[i].node);

            const nodes = room.getNodes();
            const nodeNames = nodes.map(node => node.name).join(', ');
            console.log(`room id: ${room.roomId}, nodes in room: ${nodeNames}`);
        }
    }
}

// function loadNodesFromDB(){
//     const nodeRepo = NodeRepository.getInstance();
//     nodeRepo.loadFromFile();
//     console.log(nodeRepo.nodes[0].name);
// }


export { initializeGame };
