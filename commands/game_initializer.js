import itemsData from '../json/items.json' assert { type: 'json' };
import { LocationRepository } from '../data/repository_location.js';
import { Item, RawIngredient, Potion, Fish, Gem, Equipment, ItemRepository } from '../data/respository_item.js';
import { parseLocationJson } from '../util/util.js';

function initializeItems() {
    const itemRepo = ItemRepository.getInstance();

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
            const { regionId, roomId, quantity } = parseLocationJson(itemData.details.locations);
            if ({ regionId, roomId }) {
                itemRepo.addItemToLocation(regionId, roomId, item, quantity);
                itemRepo.getItemsInLocation(regionId, roomId);
            }
        }
    })
};

export { initializeItems };
