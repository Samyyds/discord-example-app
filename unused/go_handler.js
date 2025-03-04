import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from '../manager/region_manager.js';
import { saveCharacterLocation } from "../db/mysql.js";
import { sendErrorMessage } from "../util/util.js";

export const handleGoInteraction = async (interaction) => {
    try {
        const playerMoveManager = PlayerMovementManager.getInstance();
        const regionManager = RegionManager.getInstance();
        const characterManager = CharacterManager.getInstance();

        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an active character!');
        }

        const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        const destination = interaction.options.getString('destination');

        if (destination === 'dungeon-in') {
            playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, false); // Go deeper
        } else if (destination === 'dungeon-out') {
            playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, true); // Retreat
        } else {
            const [regionPart, locationPart] = destination.split('-');
            const targetLocationId = parseInt(locationPart, 10);
            playerMoveManager.moveLocation(interaction.user.id, activeCharacter.id, curLocation.regionId, targetLocationId);
        }

        const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        saveCharacterLocation(interaction.user.id, activeCharacter.id, newLocation);

        const embed = new EmbedBuilder()
            .setDescription(`You have arrived at **${regionManager.getLocationById(newLocation.regionId, newLocation.locationId).name}**.`)
            .setColor(0x00FF00);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error in handleGoInteraction:', error);
        await sendErrorMessage(interaction, 'An error occurred while processing your action.');
    }
};
