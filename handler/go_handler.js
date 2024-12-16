import { Regions, MokuahLocations, NyraLocations, IsfjallLocations, TheTrenchLocations } from '../data/enums.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { CharacterManager } from '../manager/character_manager.js';
import { RegionManager } from "../manager/region_manager.js";
import { saveCharacterLocation } from '../db/mysql.js';
import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { sendErrorMessage } from '../util/util.js';

export const handleGoInteraction = async (interaction) => {
    const playerMoveManager = PlayerMovementManager.getInstance();
    const characterManager = CharacterManager.getInstance();
    const regionManager = RegionManager.getInstance();

    const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
    if (!activeCharacter) return await sendErrorMessage(interaction, "No active character found!");

    const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

    switch (interaction.customId) {
        case 'location-selection': {
            const targetLocationId = interaction.values[0];
            const [regionPart, locationPart] = targetLocationId.split('-');
            const cleanLocationId = parseInt(locationPart, 10);
        
            playerMoveManager.moveLocation(interaction.user.id, activeCharacter.id, curLocation.regionId, cleanLocationId);
        
            const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        
            const targetLocation = regionManager.getLocationById(curLocation.regionId, cleanLocationId);
        
            saveCharacterLocation(interaction.user.id, activeCharacter.id, {
                regionId: newLocation.regionId,
                locationId: cleanLocationId,
                roomId: newLocation.roomId,
            });
        
            const embed = new EmbedBuilder()
                .setDescription(`You have arrived at **${targetLocation.name}**.`)
                .setColor(0x00FF00);
        
            return await interaction.update({ embeds: [embed], components: [] });
        }  

        case 'dungeon-or-location': {
            const choice = interaction.values[0];

            if (choice === 'dungeon') {
                const embed = new EmbedBuilder()
                    .setDescription('Choose to go deeper or retreat.');

                const actionRow = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('dungeon-exploration')
                        .setPlaceholder('Select an action')
                        .addOptions([
                            { label: 'Go Deeper', value: 'in' },
                            { label: 'Retreat', value: 'out' }
                        ])
                );

                return await interaction.update({ embeds: [embed], components: [actionRow], ephemeral: true });
            } else {
                const currentRegion = regionManager.getRegionById(curLocation.regionId);
                const locationsArray = Array.isArray(currentRegion.locations)
                    ? currentRegion.locations
                    : Array.from(currentRegion.locations.values()); 

                const otherLocations = locationsArray.filter(loc => loc.id !== curLocation.locationId);

                const options = otherLocations.map(loc => ({
                    label: loc.name,
                    value: loc.id.toString(),
                }));

                const embed = new EmbedBuilder()
                    .setDescription('Choose a location to travel to.');

                const actionRow = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('location-selection')
                        .setPlaceholder('Select a location')
                        .addOptions(options)
                );

                return await interaction.update({ embeds: [embed], components: [actionRow], ephemeral: true });
            }
        }

        case 'dungeon-exploration': {
            const direction = interaction.values[0];
        
            const playerMoveManager = PlayerMovementManager.getInstance();
            const regionManager = RegionManager.getInstance();
        
            const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
            const currentRegion = regionManager.getRegionById(curLocation.regionId);
            const currentLocation = currentRegion.getLocation(curLocation.locationId);
            const currentRoom = currentLocation.getRoom(curLocation.roomId);
        
            const isValidRoom = currentLocation.roomCount > 1;
        
            if (!isValidRoom) {
                return await sendErrorMessage(interaction, 'There are no additional rooms to explore in your current location!');
            }
        
            let moved = false;
        
            if (direction === 'in') {
                const canMoveDown = playerMoveManager.canMoveDown(interaction.user.id, activeCharacter.id);
                if (!canMoveDown) {
                    return await sendErrorMessage(interaction, 'You\'ve reached the last room. There\'s no way to move deeper!');
                }
                playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, false); // Move down
                moved = true;
            } else if (direction === 'out') {
                const canMoveUp = playerMoveManager.canMoveUp(interaction.user.id, activeCharacter.id);
                if (!canMoveUp) {
                    return await sendErrorMessage(interaction, 'You are already in the first room. There\'s no way to retreat further!');
                }
                playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, true); // Move up
                moved = true;
            }
        
            if (moved) {
                const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
                saveCharacterLocation(interaction.user.id, activeCharacter.id, newLocation);
        
                const embed = new EmbedBuilder()
                    .setDescription(`You have ${direction === 'in' ? 'moved deeper' : 'retreated'} in the dungeon.`)
                    .setColor(0x00FF00);
        
                console.log(`[DEBUG] New Location after move:`, newLocation);
        
                return await interaction.update({ embeds: [embed], components: [], ephemeral: true });
            }
            break;
        }
        
    }
};
