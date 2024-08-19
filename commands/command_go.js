import { EmbedBuilder } from 'discord.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { CharacterManager } from '../manager/character_manager.js';
import { convertNameToRegionId, convertNameToLocationId } from "../util/util.js";
import { saveCharacterLocation } from "../db/mysql.js";
import { sendErrorMessage } from "../util/util.js";

const goCommand = async (interaction) => {
    try {
        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const regionName = interaction.options.getString('region').trim();
        const locationName = interaction.options.getString('location').trim();

        const tarRegionId = convertNameToRegionId(regionName);
        const tarLocationId = convertNameToLocationId(locationName, tarRegionId);

        if (tarRegionId === undefined) {
            return await sendErrorMessage(interaction, `The specified region '${regionName}' does not exist.`);
        }
        if (tarLocationId === undefined) {
            return await sendErrorMessage(interaction, `The specified location '${locationName}' does not exist in the region '${regionName}'.`);
        }

        // const playerMoveManager = PlayerMovementManager.getInstance();
        // const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

        // if (curLocation && curLocation.regionId === tarRegionId) {
        //     if (!playerMoveManager.canMoveLocation(interaction.user.id, activeCharacter.id, tarRegionId, tarLocationId, interaction)) {
        //         throw new Error("Cannot move to the target location from current location.");
        //     }
        //     playerMoveManager.moveLocation(interaction.user.id, activeCharacter.id, tarRegionId, tarLocationId);
        // } else {
        //     if (!playerMoveManager.canMoveRegion(interaction.user.id, activeCharacter.id, tarRegionId, tarLocationId)) {
        //         throw new Error("Cannot move to the target region and location from current location.");
        //     }
        //     playerMoveManager.moveRegion(interaction.user.id, activeCharacter.id, tarRegionId, tarLocationId);
        // }
        const playerMoveManager = PlayerMovementManager.getInstance();
        const moveResult = playerMoveManager.canMoveLocation(interaction.user.id, activeCharacter.id, tarRegionId, tarLocationId, interaction);

        if (!moveResult.canMove) {
            const moveErrorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Movement Restricted')
                .setDescription(moveResult.message);
            await interaction.reply({ embeds: [moveErrorEmbed], ephemeral: true });
            return;
        }
        playerMoveManager.moveLocation(interaction.user.id, activeCharacter.id, tarRegionId, tarLocationId);

        const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        saveCharacterLocation(interaction.user.id, activeCharacter.id, newLocation);

        let embed = new EmbedBuilder()
            .setTitle('Adventure Awaits!')
            .setDescription(`You have arrived at ${locationName} in ${regionName}.`)
            .addFields(
                { name: 'Region', value: regionName, inline: true },
                { name: 'Location', value: locationName, inline: true }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in goCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const goCommands = {
    go: goCommand
};
