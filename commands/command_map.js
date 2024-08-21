import { EmbedBuilder } from 'discord.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { CharacterManager } from '../manager/character_manager.js';
import descriptions from '../data/consts.js';
import { sendErrorMessage } from "../util/util.js";

const mapCommand = async (interaction) => {
    try {
        const characterRepo = CharacterManager.getInstance();
        const activeCharId = characterRepo.getActiveCharacter(interaction.user.id).id;
        if (!activeCharId) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId } = playerMoveManager.getLocation(interaction.user.id, activeCharId) || {};

        let updatedMapString = descriptions.MAP_STRING;

        const regionLocationMap = {
            0: ["Village Center", "Blacksmith", "Farm [S]", "Tavern", "Clinic", "Dock", "Jungle", "Volcano [S]"],
            1: ["Town", "Crafthouse", "Tavern", "Beach", "Labyrinth", "Hospital"],
            2: ["City Center [S]", "Blacksmith [S]", "Dock [S]", "Tundra [S]", "Hospital [S]"],
            3: ["Entrance", "The Shallows", "The Depths [S]", "Obsidian City [S]"]
        };

        if (regionLocationMap[regionId] && regionLocationMap[regionId][locationId]) {
            const locationName = regionLocationMap[regionId][locationId];
            updatedMapString = updatedMapString.replace(locationName, locationName + " ⭐️");
        }

        let embed = new EmbedBuilder()
            .setTitle('Discover Your Adventure!')
            .setDescription("```\n" + updatedMapString + "\n```");

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in mapCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const mapCommands = {
    map: mapCommand
}
