import { EmbedBuilder } from 'discord.js';
import { CharacterRepository, StatContainer } from '../data/repository_character.js';
import Web3Manager from '../web3/web3_manager.js';

let lastPlayerHp;
let lastEnemyHp;

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
        if (enemiesInfo.length <= 0) {
            await interaction.editReply({ content: 'The air is still, no enemies lurk in the shadows...', ephemeral: true });
            return;
        }
        let chosenEnemyIndex = enemiesInfo.findIndex(enemy => enemy.name.toLowerCase() === enemyName);

        if (chosenEnemyIndex !== -1) {
            const combatHistory = await web3Provider.queryContract('Combat', 'fightTest', [web3Provider.toBigN(activeCharId), web3Provider.toBigN(chosenEnemyIndex)]);
            await displayCombatRounds(interaction, combatHistory.playerHistory, combatHistory.enemyHistory, combatHistory.rounds);
        } else {
            await interaction.editReply({ content: 'No enemy with that name found.', ephemeral: true });
        }
        const result = await web3Provider.sendTransaction('Combat', 'fight', [web3Provider.toBigN(activeCharId), web3Provider.toBigN(chosenEnemyIndex)]);
    } catch (error) {
        console.error('Error in attackCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

async function displayCombatRounds(interaction, playerHistory, enemyHistory, rounds) {
    for (let i = 0; i <= rounds; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000 * i));

        let embed = new EmbedBuilder()
            .setDescription(formatCombatRound(playerHistory[i], enemyHistory[i], i + 1))
            .setColor(0x0099FF);

        await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
}

function formatCombatRound(playerRound, enemyRound, roundNumber) {
    const curPlayerHp = parseInt(playerRound[0][6][2], 10);
    const curEnemyHp = parseInt(enemyRound[0][6][2], 10);

    const playerHpChange = lastPlayerHp !== 0 ? curPlayerHp - lastPlayerHp : 0;
    const enemyHpChange = lastEnemyHp !== 0 ? curEnemyHp - lastEnemyHp : 0;

    lastPlayerHp = curPlayerHp;
    lastEnemyHp = curEnemyHp;
    let roundDescription = `**Round ${roundNumber}**\n`;

    if (roundNumber === 1) {
        roundDescription += ` Locked in a fierce stare-down, you're ready with ${curPlayerHp} HP against your opponent's ${curEnemyHp} HP. Let the battle begin!`;
    } else {
        roundDescription += `You [smash] ${enemyRound[0][0]} with <fists>, ${enemyRound[0][0]} ${enemyHpChange} HP\n`;
        roundDescription += `${enemyRound[0][0]} punches you, you ${playerHpChange} HP\n`;
    }


    if (curPlayerHp > 0 && curEnemyHp <= 0) {
        roundDescription += "\n**You win!** 🎉";
    } else if (curPlayerHp <= 0 && curEnemyHp > 0) {
        roundDescription += "\n**You lose.** 😢";
    }

    return roundDescription;
}

export const attackCommands = {
    attack: attackCommand
};