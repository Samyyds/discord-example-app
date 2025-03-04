import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from '../manager/region_manager.js';
import { CharacterManager } from '../manager/character_manager.js';

export const handleGoAutocomplete = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);

        if (!activeCharacter) {
            return interaction.respond([]);
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        const regionManager = RegionManager.getInstance();
        const currentRegion = regionManager.getRegionById(curLocation.regionId);
        const currentLocation = currentRegion.getLocation(curLocation.locationId);

        const options = [];

        if (currentLocation.roomCount <= 1) {
            const locationsArray = Array.isArray(currentRegion.locations)
                ? currentRegion.locations
                : Array.from(currentRegion.locations.values());

            const otherLocations = locationsArray.filter(loc => loc.id !== currentLocation.id);
            options.push(...otherLocations.map(loc => ({
                name: loc.name,
                value: loc.id.toString(),
            })));
        }

        if (currentLocation.roomCount > 1 && curLocation.roomId === 0) {
            const locationsArray = Array.isArray(currentRegion.locations)
                ? currentRegion.locations
                : Array.from(currentRegion.locations.values());

            const otherLocations = locationsArray.filter(loc => loc.id !== currentLocation.id);
            options.push(...otherLocations.map(loc => ({
                name: loc.name,
                value: loc.id.toString(),
            })));

            options.push({
                name: `Explore ${currentLocation.name}`,
                value: 'dungeon-in',
            });
        }

        if (currentLocation.roomCount > 1 && curLocation.roomId > 0) {
            options.push(
                { name: 'In', value: 'dungeon-in' },
                { name: 'Out', value: 'dungeon-out' },
            );
        }

        await interaction.respond(options);
    } catch (error) {
        console.error('Error in handleGoAutocomplete:', error);
        await interaction.respond([]);
    }
};
