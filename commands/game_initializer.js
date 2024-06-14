import { RegionManager } from "../manager/region_manager.js";
import { EnemyManager } from '../manager/enemy_manager.js';
import { AbilityManager } from "../manager/ability_manager.js";

function initializeGame(){
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

    //generate enemies
    regionManager.regions.forEach(region => {
        region.locations.forEach(location => {
            location.initializeRooms();

            const enemyTypes = enemyManager.getEnemiesForLocation(region.id, location.locationId);

            for (let roomId = 0; roomId <= location.roomCount; roomId++) {
                const room = location.getRoom(roomId);
                room.spawnEnemies(enemyTypes);
            }
        });
    });
    
    const enemies = regionManager.getRoomByLocation(0, 5, 0).getEnemies();
    //console.log(`Enemies in room: ${enemies.map(enemy => enemy.name).join(', ')}`);
}

// function loadNodesFromDB(){
//     const nodeRepo = NodeRepository.getInstance();
//     nodeRepo.loadFromFile();
//     console.log(nodeRepo.nodes[0].name);
// }


export { initializeGame };
