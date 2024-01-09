import Web3Manager from './web3_manager.js';
import { Class, Race } from './enums.js';

const createCharacterCommand = async (interaction) => {
    if (interaction.commandName !== 'createCharacter') return;

    await interaction.deferReply({ ephemeral: true });

    try {
        const className = interaction.options.getString('classname').toUpperCase();
        const raceName = interaction.options.getString('racename').toUpperCase();

        const classId = Class[className];
        const raceId = Race[raceName];

        if (classId === undefined || raceId === undefined) {
            throw new Error('Invalid class or race name.');
        }

        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);
        if (!web3Provider) {
            throw new Error('No Web3 provider found for this user.');
        }

        const receipt = await web3Provider.sendTransaction('CharacterProperties', 'createCharacter', ['CharacterName', classId, raceId]);

        await interaction.editReply({ content: 'Character created successfully!', ephemeral: true });
    } catch (error) {
        console.error('Error in createCharacterCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const commands = {
    createCharacter: createCharacterCommand
};