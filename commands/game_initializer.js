import itemsData from '../json/items.json' assert { type: 'json' };
import { LocationRepository } from '../data/repository_location.js';
import { RawIngredient, Potion, Gem } from '../data/repository_inventory.js';


function initializeItems() {
    const items = itemsData.map(itemData => {
        switch (itemData.type) {
            case 'Raw Ingredient':
                return new RawIngredient(itemData.id, itemData.name, itemData.location);
            case 'Potion':
                return new Potion(itemData.id, itemData.name);
            case 'Gem':
                return new Gem(itemData.id, itemData.name, itemData.location);
            // TODO: add equipments  
            default:
                return new Item(itemData.id, itemData.name, itemData.location, itemData.type);
        }
    });

    const locationRepo = LocationRepository.getInstance();
    items.forEach(item => {
        if(item.location) {
            locationRepo.addItemToLocation(item.location.regionId, item.location.roomId, item);
        }
    });
}

export { initializeItems };
