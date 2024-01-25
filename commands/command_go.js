import { EmbedBuilder } from 'discord.js';
import { LocationRepository } from '../data/repository_location.js';
import { CharacterRepository } from '../data/repository_character.js';
import { LocationType, getLocationFromInput } from '../data/enums.js';

const goCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const characterRepo = CharacterRepository.getInstance();
        const activeCharId = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharId) {
            throw new Error('You do not have an available character!');
        }

        const regionName = interaction.options.getString('region').trim();
        const roomNameInput = interaction.options.getString('room')?.trim() || '';

        const { regionIndex, roomIndex } = getLocationFromInput(regionName, roomNameInput);

        const locationRepo = LocationRepository.getInstance();
        locationRepo.setLocation(interaction.user.id, activeCharId, regionIndex, roomIndex);

        let embed = new EmbedBuilder()
            .setTitle('Adventure Awaits!')
            .setDescription(`Pack your bags! You're now exploring:`)
            .addFields(
                { name: 'Region', value: String(regionName), inline: true },
                { name: 'Room', value: String(roomNameInput), inline: true }
            );

        await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error in goCommand:', error);
        let errorMessage = 'An error occurred.';
        if (error.message.includes('not found')) {
            errorMessage = "You can't do that, please try it again.";
        }
        await interaction.editReply({ content: errorMessage, ephemeral: true });
    }
}

export const goCommands = {
    go: goCommand
};
