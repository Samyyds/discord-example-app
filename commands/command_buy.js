import { EmbedBuilder } from 'discord.js';
import { sendErrorMessage } from "../util/util.js";
import { ItemType } from "../data/enums.js";
import { RegionManager } from "../manager/region_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { ItemManager, Item, Equipment, Consumable } from "../manager/item_manager.js";

const buyCommand = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        const shops = room.getShops();
        if (shops.length <= 0) {
            return await sendErrorMessage(interaction, 'There\s no shop nearby!');
        }

        const selectedItem = interaction.options.getString('object');
        const { itemType, itemId, itemPrice } = JSON.parse(selectedItem);

        if (activeCharacter.gold < itemPrice) {
            return await sendErrorMessage(interaction, 'You do not have enough gold to buy this item.');
        }

        const itemManager = ItemManager.getInstance();
        let purchasedItem;
        switch (itemType) {
            case ItemType.MATERIAL:
                purchasedItem = new Item(itemManager.getItemDataById(Number(itemId)));
                break;
            case ItemType.EQUIPMENT:
                purchasedItem = new Equipment(itemManager.getEquipmentDataById(Number(itemId)));
                break;
            case ItemType.CONSUMABLE:
                purchasedItem = new Consumable(itemManager.getConsumableDataById(Number(itemId)));
                break;
            default:
                return await sendErrorMessage(interaction, 'Unsupported item type for purchasing.');
        }

        const inventoryManager = InventoryManager.getInstance();
        inventoryManager.addItem(interaction.user.id, activeCharacter.id, purchasedItem, 1);

        activeCharacter.gold -= itemPrice;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`You have successfully purchased **${purchasedItem.name}**.`);
        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Error in buyCommand:', error);
        await sendErrorMessage(interaction, `An error occurred: ${error.message}`);
    }
}

export const buyCommands = {
    buy: buyCommand
};