import itemsData from '../json/items.json' assert { type: 'json' };
import { LocationType } from '../data/enums.js';
import { Item, Ore, RawIngredient, Potion, Fish, Gem, Equipment, ItemRepository } from '../data/repository_item.js';

function initializeItems() {
    const itemRepo = ItemRepository.getInstance();

    const items = itemsData.map(itemData => {
        let item;
        switch (itemData.type) {
            case 'Ore':
                console.log(itemData.details.level);
                item = new Ore(itemData.id, itemData.name, itemData.source, itemData.details, itemData.transformed);
                break;
            case 'Raw Ingredient':
                item = new RawIngredient(itemData.id, itemData.name, itemData.source, itemData.details);
                break;
            case 'Potion':
                item = new Potion(itemData.id, itemData.name, itemData.source, itemData.details);
                break;
            case 'Gem':
                item = new Gem(itemData.id, itemData.name, itemData.source, itemData.details);
                break;
            // case 'Equipment':
            //     item = new Equipment(itemData.id, itemData.name, itemData.source, itemData.details, itemData.slot, itemData.twoHanded, itemData.attributes);
            //     break;
            default:
                item = new Item(itemData.id, itemData.name, itemData.source, itemData.details);
                break;
        }

        if (itemData.source.includes("harvest")) {
            const { regionId, roomId, quantity } = parseLocationJson(itemData.details.locations);
            if ({ regionId, roomId }) {
                itemRepo.addItemToLocation(regionId, roomId, item, quantity);
            }
        }
    })
};

function parseLocationJson(locationString) {
    const [location, quantity] = locationString.split(',');
    const [regionName, roomName] = location.split(' ');
    const region = Object.values(LocationType).find(region => region.name.toLowerCase() === regionName.toLowerCase());
    if (!region) return null;
    const room = Object.values(region.rooms).find(room => room.name.toLowerCase() === roomName.toLowerCase());
    return { regionId: region.index, roomId: room ? room.index : 0, quantity: quantity };
}

export { initializeItems };
