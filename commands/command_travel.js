import { EmbedBuilder } from 'discord.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from "../manager/region_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { convertNameToRegionId } from "../util/util.js";
import { saveCharacterLocation } from "../db/mysql.js";
import { sendErrorMessage } from "../util/util.js";

const travelCommand = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const regionName = interaction.options.getString('region')?.trim();

        if (!regionName) {
            return await sendErrorMessage(interaction, 'You must select both a region and a location.');
        }

        const tarRegionId = convertNameToRegionId(regionName);

        if (tarRegionId === undefined) {
            return await sendErrorMessage(interaction, `The specified region '${regionName}' does not exist.`);
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        const regionManager = RegionManager.getInstance();

        const paths = regionManager.getPathsFromRegion(
            curLocation.regionId,
            curLocation.locationId
        );

        const pathKeys = Array.from(paths.keys());

        const validStartLocation = pathKeys.find(
            key => key === String(curLocation.locationId)
        );
        
        if (!validStartLocation) {
            return await sendErrorMessage(interaction, 'Your current location does not allow travel to another region.');
        }

        const targetPath = paths.get(validStartLocation)?.find(
            path => path.regionId === tarRegionId
        );

        if (!targetPath) {
            return await sendErrorMessage(interaction, `You cannot travel to the region '${regionName}' from your current location.`);
        }

        const { locationId: targetLocationId } = targetPath;

        const canMoveResult = playerMoveManager.canMoveRegion(
            interaction.user.id,
            activeCharacter.id,
            tarRegionId,
            targetLocationId
        );

        if (!canMoveResult.canMove) {
            const moveErrorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Movement Restricted')
                .setDescription(canMoveResult.message || "Movement not allowed.");
            await interaction.reply({ embeds: [moveErrorEmbed], ephemeral: true });
            return;
        }

        playerMoveManager.moveRegion(interaction.user.id, activeCharacter.id, tarRegionId, targetLocationId);
        
        const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        saveCharacterLocation(interaction.user.id, activeCharacter.id, newLocation);

        const targetLocation = regionManager.getLocationById(tarRegionId, targetLocationId);

        const embed = new EmbedBuilder()
            .setTitle('Travel Complete')
            .setDescription(`You have traveled to **${regionName}**, arriving at **${targetLocation.name}**.`)
            .setColor(0x00FF00);

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in goCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const travelCommands = {
    travel: travelCommand
};
