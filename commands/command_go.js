import { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from '../manager/region_manager.js';
import { CharacterManager } from '../manager/character_manager.js';
import { saveCharacterLocation } from "../db/mysql.js";
import { sendErrorMessage } from "../util/util.js";

const goCommand = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);

        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an active character!');
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        const regionManager = RegionManager.getInstance();
        const currentRegion = regionManager.getRegionById(curLocation.regionId);
        const currentLocation = currentRegion.getLocation(curLocation.locationId);

        if (!currentRegion) {
            return await sendErrorMessage(interaction, 'Current region data is not available!');
        }

        const currentRoomId = curLocation.roomId;

        if (currentLocation.roomCount <= 1) {

            const locationsData = currentRegion.locations;
            const locationsArray = Array.isArray(locationsData)
                ? locationsData
                : Array.from(locationsData.values());

            const otherLocations = locationsArray.filter(loc => loc.id !== currentLocation.id);
            const options = otherLocations.map(loc => ({
                label: loc.name,
                value: loc.id
            }));

            const embed = new EmbedBuilder()
                .setDescription('Choose a location to go to.');

            const actionRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('location-selection')
                    .setPlaceholder('Select a location')
                    .addOptions(options)
            );

            return await interaction.reply({ embeds: [embed], components: [actionRow], ephemeral: true });
        }

        if (currentLocation.roomCount > 1 && currentRoomId === 0) {
            const embed = new EmbedBuilder()
            .setDescription('You are at the first floor of a dungeon.\nYou can explore deeper into the dungeon or travel to another location.');
        
            const actionRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('dungeon-or-location')
                    .setPlaceholder('Choose an option')
                    .addOptions([
                        { label: 'Explore Dungeon', value: 'dungeon' },
                        { label: 'Go to Locations', value: 'locations' }
                    ])
            );

            return await interaction.reply({ embeds: [embed], components: [actionRow], ephemeral: true });
        }

        if (currentLocation.roomCount > 1 && currentRoomId > 0) {
            const embed = new EmbedBuilder()
                .setDescription('Choose to go deeper into the dungeon or retreat.');

            const actionRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('dungeon-exploration')
                    .setPlaceholder('Select an action')
                    .addOptions([
                        { label: 'Go Deeper', value: 'in' },
                        { label: 'Retreat', value: 'out' }
                    ])
            );

            return await interaction.reply({ embeds: [embed], components: [actionRow], ephemeral: true });
        }
    } catch (error) {
        console.error('Error in goCommand:', error);
        return await sendErrorMessage(interaction, `An error occurred: ${error.message}`);
    }
};

export const goCommands = {
    go: goCommand,
};
