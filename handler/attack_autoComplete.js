import { RegionManager } from "../manager/region_manager.js";
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { CharacterManager } from "../manager/character_manager.js";

export async function handleAttackAutocomplete(interaction) {
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

        const enemies = room.getEnemies();

        const focusedValue = interaction.options.getFocused().toLowerCase();
        const filteredEnemies = enemies
            .filter(enemy => enemy.name.toLowerCase().includes(focusedValue))
            .map(enemy => ({ name: enemy.name, value: enemy.name }));

        await interaction.respond(filteredEnemies);
    } catch (error) {
        console.error('Error in handleAttackAutocomplete:', error);
        await interaction.respond([]);
    }
}
