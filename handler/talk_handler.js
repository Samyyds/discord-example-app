import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { NPCManager } from '../manager/npc_manager.js';
import { RegionManager } from "../manager/region_manager.js";
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { sendErrorMessage } from "../util/util.js";

export async function handleTalkInteraction(interaction) {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const characterManager = CharacterManager.getInstance();
    const activeCharacter = characterManager.getActiveCharacter(userId);
    if (!activeCharacter) {
        await interaction.reply({ content: "You do not have an available character!", ephemeral: true });
        return;
    }

    const [_, npcId, option] = interaction.customId.split('_');

    const playerMoveManager = PlayerMovementManager.getInstance();
    const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

    const regionManager = RegionManager.getInstance();
    const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
    const npc = room.getNPCs().find(npc => npc.id.toString() === npcId);

    if (!npc) {
        return await sendErrorMessage(interaction, 'No such character found here. Please check the name and try again.', true);
    }

    const response = npc.makeChoice(userId, activeCharacter.id, npc.quest[0], option);

    let embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setDescription(`**${npc.name}:** ${response}`);

    await interaction.update({ embeds: [embed], components: [], ephemeral: true });
}

