import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from '../manager/region_manager.js';
import { CharacterManager } from "../manager/character_manager.js";

export async function handleTravelAutocomplete(interaction) {
  try {
    const playerMoveManager = PlayerMovementManager.getInstance();
    const regionManager = RegionManager.getInstance();

    const userId = interaction.user.id;
    const characterManager = CharacterManager.getInstance();
    const activeCharacter = characterManager.getActiveCharacter(userId);

    if (!activeCharacter) {
      await interaction.respond([]);
      return;
    }

    const currentLocation = playerMoveManager.getLocation(userId, activeCharacter.id);
    const currentRegionId = currentLocation?.regionId;

    const allRegions = Array.from(regionManager.regions.values());
    const filteredRegions = allRegions.filter(region => region.id !== currentRegionId);

    const focusedOption = interaction.options.getFocused();

    const matchingRegions = filteredRegions.filter(region =>
      region.name.toLowerCase().startsWith(focusedOption.toLowerCase())
    );

    await interaction.respond(
      matchingRegions.map(region => ({ name: region.name, value: region.id.toString() }))
    );
  } catch (error) {
    console.error('Error in travel autocomplete:', error);
    await interaction.respond([]);
  }
}
