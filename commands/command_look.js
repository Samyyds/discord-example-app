import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import { LocationRepository } from '../data/repository_location.js';
import { ItemRepository } from '../data/repository_item.js';
import rooms from '../json/rooms.json' assert { type: 'json' };
import items from '../json/items.json' assert {type: 'json'};

const lookCommand = async (interaction) => {
    try {

        const objectName = interaction.options.getString('object');

        const characterRepo = CharacterRepository.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const locationRepo = LocationRepository.getInstance();
        const { regionId, roomId } = locationRepo.getLocation(interaction.user.id, activeCharId);
        console.log(`region: ${regionId}, room: ${roomId}`);

        let description = '';
        const itemRepo = ItemRepository.getInstance();

        if (objectName) {
            const itemCount = itemRepo.getItemCountByName(regionId, roomId, objectName); // Assume this function exists
            if (itemCount > 0) {
                const itemDes = getItemDescriptionByName(objectName, itemCount);
                description += `\n${itemDes}`;
            } else {
                description += "\nItem not found or not available in this location.";
            }
        } else {
            const roomDes = getRoomDescriptionById(regionId, roomId) || 'You find yourself in an unremarkable location.';
            description = roomDes;

            const itemsInLocation = itemRepo.getItemsInLocation(regionId, roomId);
            if (itemsInLocation.length > 0) {
                const itemsDescription = itemsInLocation.map(({ item, quantity }) => {
                    const toBeMinedText = item.type === "Ore" ? " to be mined" : "";
                    return `You see ${item.name}*${quantity}${toBeMinedText}`;
                }).join("\n");
                description += `\n${itemsDescription}`;
            }
        }

        let embed = new EmbedBuilder().setDescription(description);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    catch (error) {
        console.error('Error in lookCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

function getRoomDescriptionById(regionId, roomId) {
    const room = rooms.find(room => room.regionId === regionId && room.roomId === roomId);
    return room ? room.description : null;
}

function getItemDescriptionByName(objectName, quantity) {
    const itemNameLower = objectName.toLowerCase();
    const item = items.find(item => item.name.toLowerCase() === itemNameLower);
    return item ? item.description.replace("{quantity}", `*${quantity}`) : "Item not found or not available in this location.";
}

export const lookCommands = {
    look: lookCommand
};