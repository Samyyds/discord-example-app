import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from "../manager/region_manager.js";

export const handleLookAutocomplete = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return interaction.respond([]);
        }
        const activeCharId = activeCharacter.id;

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharId);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        if (!room) {
            return interaction.respond([]);
        }

        const enemies = room.getEnemies().map(enemy => ({ name: enemy.name, value: enemy.name }));
        const nodes = room.getNodes().map(node => ({ name: node.name, value: node.name }));
        const items = room.getItems().map(item => ({ name: item.name, value: item.name }));
        const npcs = room.getNPCs().map(npc => ({ name: npc.name, value: npc.name }));

        const options = [...enemies, ...nodes, ...items, ...npcs];

        // Limit to 25 options (discord API limits)
        const limitedOptions = options.slice(0, 25);

        await interaction.respond(limitedOptions);
    } catch (error) {
        console.error('Error in handleLookAutocomplete:', error);
        await interaction.respond([]);
    }
};
