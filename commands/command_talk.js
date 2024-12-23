import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { RegionManager } from "../manager/region_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { sendErrorMessage, parseNpcDialogue } from "../util/util.js";

const talkCommand = async (interaction) => {
    const npcName = interaction.options.getString('npc').trim().toLowerCase();

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

    if (!npc) {
        return await sendErrorMessage(interaction, 'No such character found here. Please check the name and try again.', true);
    }

    await interaction.deferReply({ ephemeral: true });

    const dialogue = npc.talk(interaction.user.id, activeCharacter.id);  
    const segments = parseNpcDialogue(dialogue.text);

    for (const segment of segments) {
        const descriptionText = segment.type === 'dialogue' 
            ? `**${npc.name} says:** ${segment.text}` 
            : segment.text;
    
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(descriptionText);
        await interaction.followUp({ embeds: [embed], ephemeral: true });
        await new Promise(resolve => setTimeout(resolve, 2000)); 
    }

    if (dialogue.options && Object.keys(dialogue.options).length > 0) {
        const components = [new ActionRowBuilder()];
        Object.keys(dialogue.options).forEach(option => {
            components[0].addComponents(
                new ButtonBuilder()
                    .setCustomId(`talk_${npc.id}_${option}`)
                    .setLabel(option)
                    .setStyle(ButtonStyle.Primary)
            );
        });
        await interaction.followUp({ content: "What will you do?", components: components, ephemeral: true });
    }
}

export const talkCommands = {
    talk: talkCommand
};
