import itemsData from '../json/items.json' assert { type: 'json' };
import { LocationRepository } from '../data/repository_location.js';
import { RawIngredient, Potion, Gem } from '../data/repository_inventory.js';
import { parseLocationJson } from '../util/util.js';

function initializeItems() {
    const locationRepo = LocationRepository.getInstance();

    const items = itemsData.map(itemData => {
        let item;
        switch (itemData.type) {
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
                item = new Item(itemData.id, itemData.name, itemData.type, itemData.source, itemData.details);
                break;
        }

        if (itemData.source.includes("harvest")) {
            const { regionId, roomId } = parseLocationJson(itemData.details.locations);
            if ({ regionId, roomId }) {
                locationRepo.addItemToLocation(regionId, roomId, item);
            }
        }
    })

    console.log(items.length);
};

export { initializeItems };
