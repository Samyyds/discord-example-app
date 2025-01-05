import { RegionManager } from "../manager/region_manager.js";
import { EnemyManager } from '../manager/enemy_manager.js';
import { AbilityManager } from "../manager/ability_manager.js";
import { NodeManager } from "../manager/node_manager.js";
import { ItemManager } from "../manager/item_manager.js";
import { RecipeManager } from "../manager/recipe_manager.js";
import { NPCManager } from "../manager/npc_manager.js";
import { QuestManager } from "../manager/quest_manager.js";
import { ShopManager } from "../manager/shop_manager.js";

function initializeGame() {
    //load region
    const regionManager = RegionManager.getInstance();
    regionManager.loadFromJson();

    //load enemy
    const enemyManager = EnemyManager.getInstance();
    enemyManager.loadFromDB();

    //load NPCs
    const npcManager = NPCManager.getInstance();
    npcManager.loadFromJson();

    //load shops
    const shopManager = ShopManager.getInstance();
    shopManager.loadFromJson();

    //load quests
    const questManager = QuestManager.getInstance();
    questManager.loadFromJson();

    //load abilities
    const abilityManager = AbilityManager.getInstance();
    abilityManager.loadFromDB();
    //console.log('Abilities loaded:', abilityManager.abilities);

    //load recipes
    const recipeManager = RecipeManager.getInstance();
    recipeManager.loadFromJson();

    //load nodes
    const nodeManager = NodeManager.getInstance();
    nodeManager.loadFromDB();

    //load items/equipments/consumables
    const itemManager = ItemManager.getInstance();
    itemManager.loadFromDB();

    //initialize rooms,generate enemies and NPCs
    regionManager.regions.forEach(region => {
        region.locations.forEach(location => {
            location.initializeRooms();

            const enemyTypes = enemyManager.getEnemiesForLocation(region.id, location.locationId);
            
            for (let roomId = 0; roomId < location.roomCount; roomId++) {
                const room = location.getRoom(roomId);
                room.spawnEnemies(enemyTypes);
                room.generateNPCs(region.id, location.locationId, roomId);
                room.generateShops(region.id, location.locationId, roomId);
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
