import { Regions, MokuahLocations, NyraLocations, IsfjallLocations, TheTrenchLocations } from '../data/enums.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { CharacterManager } from '../manager/character_manager.js';
import { saveCharacterLocation } from '../db/mysql.js';
import { EmbedBuilder } from 'discord.js';
import { sendErrorMessage } from '../util/util.js';

const regionToLocations = {
    MOKUAH: MokuahLocations,
    NYRA: NyraLocations,
    ISFJALL: IsfjallLocations,
    THE_TRENCH: TheTrenchLocations,
};

export async function handleGoCommand(interaction) {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);

        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const selectedRegion = interaction.options.getString('region');
        const selectedLocation = interaction.options.getString('location');

        if (!selectedRegion || !selectedLocation) {
            return await sendErrorMessage(interaction, 'Both region and location must be specified!');
        }

        const tarRegionId = Regions[selectedRegion];
        const locations = regionToLocations[selectedRegion];
        const tarLocationId = locations?.[selectedLocation];

        if (tarRegionId === undefined || tarLocationId === undefined) {
            return await sendErrorMessage(
                interaction,
                `The specified region '${selectedRegion}' or location '${selectedLocation}' does not exist.`
            );
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

        if (curLocation.regionId === tarRegionId) {
            const moveResult = playerMoveManager.canMoveLocation(
                interaction.user.id,
                activeCharacter.id,
                tarRegionId,
                tarLocationId,
                interaction
            );
            if (!moveResult.canMove) {
                const moveErrorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Movement Restricted')
                    .setDescription(moveResult.message);
                await interaction.reply({ embeds: [moveErrorEmbed], ephemeral: true });
                return;
            }
            playerMoveManager.moveLocation(interaction.user.id, activeCharacter.id, tarRegionId, tarLocationId);
        } else {
            const canMoveResult = playerMoveManager.canMoveRegion(
                interaction.user.id,
                activeCharacter.id,
                tarRegionId,
                tarLocationId
            );
            if (!canMoveResult.canMove) {
                const moveErrorEmbed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Movement Restricted')
                    .setDescription(canMoveResult.message || 'Movement not allowed.');
                await interaction.reply({ embeds: [moveErrorEmbed], ephemeral: true });
                return;
            }
            playerMoveManager.moveRegion(interaction.user.id, activeCharacter.id, tarRegionId, tarLocationId);
        }

        const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        saveCharacterLocation(interaction.user.id, activeCharacter.id, newLocation);

        const embed = new EmbedBuilder()
            .setDescription(`Adventure awaits, you have arrived at\n\n`)
            .addFields(
                { name: "Region", value: `**${selectedRegion}**`, inline: true },
                { name: "Location", value: `**${selectedLocation}**`, inline: true }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error in /go command:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}
