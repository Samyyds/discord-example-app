//import itemsData from '../json/items.json' assert { type: 'json' };
//import { NodeRepository } from "../data/repository_node.js";
import { RegionManager } from "../manager/region_manager.js";
// import { LocationType } from '../data/enums.js';
// import { Item, Ore, Ingredient, Potion, Fish, Gem, Equipment, ItemRepository } from '../data/repository_item.js';

// function initializeItems() {
//     const itemRepo = ItemRepository.getInstance();

//     itemsData.forEach(itemData => {
//         if (itemData.source.includes("Harvest")) {
//             let item;

//             switch (itemData.type) {
//                 case 'Ore':
//                     item = new Ore(itemData);
//                     break;
//                 case 'Ingredient':
//                     item = new Ingredient(itemData);
//                     break;
//                 case 'Potion':
//                     item = new Potion(itemData);
//                     break;
//                 case 'Gem':
//                     item = new Gem(itemData);
//                     break;
//                 // case 'Equipment':
//                 //     item = new Equipment(itemData);
//                 //     break;
//                 default:
//                     item = new Item(itemData);
//                     break;
//             }

//             const { regionId, roomId, quantity } = parseLocationJson(itemData.details.locations);
//             if (regionId != null && roomId != null) {
//                 itemRepo.addItemToLocation(regionId, roomId, item, quantity);
//             }
//         }
//     })
// };

// function parseLocationJson(locationString) {
//     const [location, quantity] = locationString.split(',');
//     const [regionName, roomName] = location.split(' ');
//     const region = Object.values(LocationType).find(region => region.name.toLowerCase() === regionName.toLowerCase());
//     if (!region) return null;
//     const room = Object.values(region.rooms).find(room => room.name.toLowerCase() === roomName.toLowerCase());
//     return { regionId: region.index, roomId: room ? room.index : 0, quantity: quantity };
// }

function loadNodesFromDB(){
    const nodeRepo = NodeRepository.getInstance();
    nodeRepo.loadFromFile();
    console.log(nodeRepo.nodes[0].name);
}

function loadRegionsFromJson(){
    const regionManager = RegionManager.getInstance();
    regionManager.initializeFromJson();

    for (const region of regionManager.regions.values()) {
        console.log(`Region: ${region.name} (ID: ${region.id})`);
        console.log(`Paths:`, region.paths);
    }
}

export { loadNodesFromDB,loadRegionsFromJson };
