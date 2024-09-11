import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { RegionManager } from "../manager/region_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { sendErrorMessage } from "../util/util.js";

const talkCommand = async (interaction) => {
    const npcName = interaction.options.getString('npc_name').trim().toLowerCase();

    const characterManager = CharacterManager.getInstance();
    const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
    if (!activeCharacter) {
        return await sendErrorMessage(interaction, 'You do not have an available character!');
    }

    if (npcName === 'feleti') {
        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();
        return;
    }

    const playerMoveManager = PlayerMovementManager.getInstance();
    const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

    const regionManager = RegionManager.getInstance();
    const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
    const npcs = room.getNPCs();
    const npc = npcs.find(npc => npc.name.toLowerCase() === npcName.toLowerCase());

    if (npc) {
        const dialogue = npc.talk(interaction.user.id, activeCharacter.id);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`**${npc.name}:** ${dialogue.text}`);

        const components = [];
        if (dialogue.options && Object.keys(dialogue.options).length > 0) {
            const row = new ActionRowBuilder();
            Object.keys(dialogue.options).forEach(option => {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`talk_${npc.id}_${option}`)
                        .setLabel(option)
                        .setStyle(ButtonStyle.Primary)
                );
            });
            components.push(row);
        }

        await interaction.reply({ embeds: [embed], components: components, ephemeral: true });
    } else {
        return await sendErrorMessage(interaction, 'No such character found here. Please check the name and try again.', true);
    }
}

export const talkCommands = {
    talk: talkCommand
};
