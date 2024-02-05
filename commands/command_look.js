import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import Web3Manager from '../web3/web3_manager.js';
import { Character, StatContainer, SkillContainer } from '../data/repository_character.js';
import { getKeyByValue, addCharacterInfoToEmbed, convertBigInt } from '../util/util.js';
import { Class, Race } from '../data/enums.js';

const surveyCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const characterRepo = CharacterRepository.getInstance();
        const activeCharId = characterRepo.getActiveCharacter(interaction.user.id).id;
        if (!activeCharId) {
            throw new Error('You do not have an available character!');
        }

        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);

        const enemiesInfo = await web3Provider.queryContract('Combat', 'viewEnemies', [web3Provider.toBigN(activeCharId)]);

        const enemyNames = enemiesInfo.map(enemy => enemy.name);
        const enemiesCount = enemyNames.length;

        let embed = new EmbedBuilder().setColor(0x00AE86);

        if (enemiesCount > 0) {
            const enemyListString = enemyNames.join('\n');
            const description = `You glance around and spot ${enemiesCount} creature(s):\n${enemyListString}\n\nFeeling brave? Use the \`/look inspect\` command for a closer look!`;
            embed = new EmbedBuilder()
                .setTitle('Adventure Awaits!')
                .setDescription(description);
        } else {
            embed.setTitle('All Clear!').setDescription("The coast is clear, no threats lurk in the shadows. What will your next move be, brave adventurer?");
        }

        await interaction.editReply({ embeds: [embed], ephemeral: true });

        // enemiesInfo.forEach((enemy, index) => {
        //     setTimeout(() => {
        //         const stats = new StatContainer(
        //             enemy.stats.hpMax, enemy.stats.mpMax, enemy.stats.hp, enemy.stats.mp,
        //             enemy.stats.spd, enemy.stats.physicalATK, enemy.stats.physicalDEF,
        //             enemy.stats.magicATK, enemy.stats.magicDEF, enemy.stats.fireATK,
        //             enemy.stats.fireDEF, enemy.stats.lightATK, enemy.stats.lightDEF,
        //             enemy.stats.darkATK, enemy.stats.darkDEF
        //         );

        //         const skills = new SkillContainer(
        //             enemy.skills.mining, enemy.skills.smithing, enemy.skills.crafting,
        //             enemy.skills.fishing, enemy.skills.gathering, enemy.skills.farming,
        //             enemy.skills.cooking, enemy.skills.brewing
        //         );

        //         const enemyInfo = new Character(
        //             index, enemy.name, enemy.level, getKeyByValue(Class, web3Provider.toNumber(enemy.classId)), getKeyByValue(Race, web3Provider.toNumber(enemy.raceId)), enemy.personalityId, enemy.xp, stats, skills,
        //             enemy.battleBar, enemy.lootQuality
        //         );

        //         let embed = new EmbedBuilder();
        //         const coveredEnemy = convertBigInt(enemyInfo);
        //         embed = addCharacterInfoToEmbed(coveredEnemy, embed);

        //         embed.setTitle(`Enemy Spotted: ${enemy.name}`)
        //             .setDescription(`Details about enemy ${index + 1}`)
        //             .setColor(0xff0000);
        //         interaction.followUp({ embeds: [embed], ephemeral: true });
        //     }, index * 2000);
        //});

    } catch (error) {
        console.error('Error in lookCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

const inspectCommand = async (interaction) => {
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

        const targetIndex = enemiesInfo.findIndex(enemy => enemy.name.toLowerCase() === enemyName);
        if (targetIndex === -1) {
            throw new Error('No enemy with that name found.');
        }

        const targetEnemy = enemiesInfo[targetIndex];

        const stats = new StatContainer(
            targetEnemy.stats.hpMax, targetEnemy.stats.mpMax, targetEnemy.stats.hp, targetEnemy.stats.mp,
            targetEnemy.stats.spd, targetEnemy.stats.physicalATK, targetEnemy.stats.physicalDEF,
            targetEnemy.stats.magicATK, targetEnemy.stats.magicDEF, targetEnemy.stats.fireATK,
            targetEnemy.stats.fireDEF, targetEnemy.stats.lightATK, targetEnemy.stats.lightDEF,
            targetEnemy.stats.darkATK, targetEnemy.stats.darkDEF
        );

        const skills = new SkillContainer(
            targetEnemy.skills.mining, targetEnemy.skills.smithing, targetEnemy.skills.crafting,
            targetEnemy.skills.fishing, targetEnemy.skills.gathering, targetEnemy.skills.farming,
            targetEnemy.skills.cooking, targetEnemy.skills.brewing
        );

        const enemyInfo = new Character(
            targetIndex, targetEnemy.name, targetEnemy.level, getKeyByValue(Class, web3Provider.toNumber(targetEnemy.classId)), getKeyByValue(Race, web3Provider.toNumber(targetEnemy.raceId)), targetEnemy.personalityId, targetEnemy.xp, stats, skills,
            targetEnemy.battleBar, targetEnemy.lootQuality
        );

        let embed = new EmbedBuilder();
        const coveredEnemy = convertBigInt(enemyInfo);
        embed = addCharacterInfoToEmbed(coveredEnemy, embed);

        embed.setTitle("Enemy insight")
            .setDescription(`A closer look reveals the true nature of ${targetEnemy.name}.`)
            .setColor(0x00AE86);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
    }

    catch (error) {
        console.error('Error in inspectCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const lookCommands = {
    survey: surveyCommand,
    inspect: inspectCommand
};