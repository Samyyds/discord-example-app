import { RegionManager } from "../manager/region_manager.js";
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { CharacterManager } from "../manager/character_manager.js";

export async function handleTalkAutocomplete(interaction) {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeChar = characterManager.getActiveCharacter(interaction.user.id);

        if (!activeChar) {
            return interaction.respond([]);
        }

        const playerMovementManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMovementManager.getLocation(interaction.user.id, activeChar.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);

        if (!room) {
            return interaction.respond([]);
        }

        const npcs = room.getNPCs();

        const focusedValue = interaction.options.getFocused().toLowerCase();
        const filteredNPCs = npcs
            .filter(npc => npc.name.toLowerCase().includes(focusedValue))
            .map(npc => ({ name: npc.name, value: npc.name }));

        await interaction.respond(filteredNPCs);
    } catch (error) {
        console.error('Error in handleTalkAutocomplete:', error);
        await interaction.respond([]);
    }
}
