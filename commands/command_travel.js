import { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
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

        const playerMoveManager = PlayerMovementManager.getInstance();
        const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        const regionManager = RegionManager.getInstance();

        const currentRegionId = curLocation.regionId;
        const allRegions = Array.from(regionManager.regions.values());

        const targetRegions = allRegions.filter(region => region.id !== currentRegionId);
        if (targetRegions.length === 0) {
            return await sendErrorMessage(interaction, 'No available regions to travel to!');
        }

        const targetRegionId = interaction.options.getString('region');
        if (!targetRegionId) {
            return await sendErrorMessage(interaction, 'No target region selected!');
        }

        const targetRegion = targetRegions.find(region => region.id === Number(targetRegionId));
        if (!targetRegion) {
            return await sendErrorMessage(interaction, `Region "${targetRegionId}" is not available for travel.`);
        }

        const paths = regionManager.getPathsFromRegion(curLocation.regionId, curLocation.locationId);

        if (!(paths instanceof Map)) {
            return await sendErrorMessage(interaction, 'Path data is not available. Please try again later.');
        }

        const pathArray = Array.from(paths.values()).flat();
        const validPath = pathArray.find(path => path.regionId === targetRegion.id);

        if (!validPath) {
            return await sendErrorMessage(
                interaction,
                `You cannot travel to **${targetRegion.name}** from your current location. There is no path connecting these regions.`
            );
        }

        const targetLocationId = validPath.locationId;

        const canMoveResult = playerMoveManager.canMoveRegion(
            interaction.user.id,
            activeCharacter.id,
            targetRegion.id,
            targetLocationId
        );

        if (!canMoveResult.canMove) {
            return await sendErrorMessage(interaction, canMoveResult.message || 'You cannot travel to the selected region.');
        }

        playerMoveManager.moveRegion(interaction.user.id, activeCharacter.id, targetRegion.id, targetLocationId);

        const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        saveCharacterLocation(interaction.user.id, activeCharacter.id, newLocation);

        const targetLocation = regionManager.getLocationById(targetRegion.id, targetLocationId);

        const embed = new EmbedBuilder()
            .setTitle('Travel Complete')
            .setDescription(`You have traveled to **${targetRegion.name}**, arriving at **${targetLocation.name}**.`)
            .setColor(0x00FF00);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error in travelCommand:', error);
        return await sendErrorMessage(interaction, `An error occurred: ${error.message}`);
    }
};

export const travelCommands = {
    travel: travelCommand
};
