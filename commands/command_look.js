import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import { LocationRepository } from '../data/repository_location.js';
import { ItemRepository } from '../data/repository_item.js';
import rooms from '../json/rooms.json' assert { type: 'json' };

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

        let description = '';
        const itemRepo = ItemRepository.getInstance();

        if (objectName) {
            const itemCount = itemRepo.getItemCountByName(regionId, roomId, objectName);
            if (itemCount > 0) {
                // const itemDes = getItemDescriptionByName(objectName, itemCount);
                const itemDes = itemRepo.getItemByName(regionId, roomId, objectName).description;
                description += `\n${itemDes}`;
            } else {
                description += "\nItem not found or not available in this location.";
            }
        } else {
            const roomDes = getRoomDescriptionById(regionId, roomId) || 'You find yourself in an unremarkable location.';
            description = roomDes;

            const itemsInLocation = itemRepo.getItemsInLocation(regionId, roomId).filter(({ quantity }) => quantity > 0);
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

export const lookCommands = {
    look: lookCommand
};