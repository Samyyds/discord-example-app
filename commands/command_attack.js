import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import Web3Manager from '../web3/web3_manager.js';

const attackCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const characterRepo = CharacterRepository.getInstance();
        const activeCharId = characterRepo.getActiveCharacter(interaction.user.id).id;
        if (!activeCharId) {
            throw new Error('You do not have an available character!');
        }

        const enemyNameInput = interaction.options.getString('enemy-name');
        if (!enemyNameInput) {
            throw new Error('Enemy name is required.');
        }
        const enemyName = enemyNameInput.trim().toLowerCase();

        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);
        const enemiesInfo = await web3Provider.queryContract('Combat', 'viewEnemies', [web3Provider.toBigN(activeCharId)]);

        let chosenEnemyIndex = enemiesInfo.findIndex(enemy => enemy.name.toLowerCase() === enemyName);

        if (chosenEnemyIndex !== -1) {
            const result = await web3Provider.sendTransaction('Combat', 'fight', [web3Provider.toBigN(activeCharId), chosenEnemyIndex]);
            await interaction.editReply({ content: `Attacking enemy: ${enemyName}`, ephemeral: true });
        } else {
            await interaction.editReply({ content: 'No enemy with that name found.', ephemeral: true });
        }

    } catch (error) {
        console.error('Error in attackCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const attackCommands = {
    attack: attackCommand
};