import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import Web3Manager from '../web3/web3_manager.js';
import { Character, StatContainer, SkillContainer } from '../data/repository_character.js';
import { getKeyByValue, addCharacterInfoToEmbed, convertBigInt } from '../util/util.js';
import { Class, Race } from '../data/enums.js';

const lookCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const characterRepo = CharacterRepository.getInstance();
        const activeCharId = characterRepo.getActiveCharacter(interaction.user.id).id;
        if (!activeCharId) {
            throw new Error('You do not have an available character!');
        }

        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);

        const enemiesInfo = await web3Provider.queryContract('Combat', 'viewEnemies', [web3Provider.toBigN(activeCharId)]);

        enemiesInfo.forEach((enemy, index) => {
            setTimeout(() => {
                const stats = new StatContainer(
                    enemy.stats.hpMax, enemy.stats.mpMax, enemy.stats.hp, enemy.stats.mp,
                    enemy.stats.spd, enemy.stats.physicalATK, enemy.stats.physicalDEF,
                    enemy.stats.magicATK, enemy.stats.magicDEF, enemy.stats.fireATK,
                    enemy.stats.fireDEF, enemy.stats.lightATK, enemy.stats.lightDEF,
                    enemy.stats.darkATK, enemy.stats.darkDEF
                );

                const skills = new SkillContainer(
                    enemy.skills.mining, enemy.skills.smithing, enemy.skills.crafting,
                    enemy.skills.fishing, enemy.skills.gathering, enemy.skills.farming,
                    enemy.skills.cooking, enemy.skills.brewing
                );

                const enemyInfo = new Character(
                    index, enemy.name, enemy.level, getKeyByValue(Class, web3Provider.toNumber(enemy.classId)), getKeyByValue(Race, web3Provider.toNumber(enemy.raceId)), enemy.personalityId, enemy.xp, stats, skills,
                    enemy.battleBar, enemy.lootQuality
                );

                let embed = new EmbedBuilder();
                const coveredEnemy = convertBigInt(enemyInfo);
                embed = addCharacterInfoToEmbed(coveredEnemy, embed);

                embed.setTitle(`Enemy Spotted: ${enemy.name}`)
                    .setDescription(`Details about enemy ${index + 1}`)
                    .setColor(0xff0000);
                interaction.followUp({ embeds: [embed], ephemeral: true });
            }, index * 2000);
        });

    } catch (error) {
        console.error('Error in lookCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const lookCommands = {
    look: lookCommand
};