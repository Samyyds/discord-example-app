import Web3Manager from './web3_manager.js';
import { Class, Race } from './enums.js';
import { ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { Character, StatContainer, SkillContainer, CharacterRepository } from './character_repository.js';
import pkg from 'discord.js';
const { EmbedBuilder } = pkg;

const createCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const charName = interaction.options.getString('character_name');
        const className = interaction.options.getString('class_name').toUpperCase();
        const raceName = interaction.options.getString('race_name').toUpperCase();

        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);

        const classId = web3Provider.toBigN(Class[className]);
        const raceId = web3Provider.toBigN(Race[raceName]);

        if (classId === undefined || raceId === undefined) {
            throw new Error('Invalid class or race name.');
        }

        if (!web3Provider) {
            throw new Error('No Web3 provider found for this user.');
        }

        //create character
        const status = await web3Provider.sendTransaction('CharacterProperties', 'createCharacter', [charName, classId, raceId]);
        const embed = new EmbedBuilder();

        if (status === 1n) {
            embed.setTitle(`Congratulations! Your character has been created!`);
            await interaction.editReply({ embeds: [embed], ephemeral: true });

            embed.setTitle("Querying blockchain...");
            await interaction.followUp({ embeds: [embed], ephemeral: true });

            //query character Id that just created
            const output = await web3Provider.queryContract('CharacterOwnership', 'tokensOfOwner', [web3Provider.currentAccount.address]);
            const charId = output[output.length - 1];

            //query character info by character Id
            const charInfo = await web3Provider.queryContract('CharacterProperties', 'getCharacterInfo', [charId]);
            const stats = new StatContainer(
                charInfo.stats.hpMax, charInfo.stats.mpMax, charInfo.stats.hp, charInfo.stats.mp,
                charInfo.stats.spd, charInfo.stats.physicalATK, charInfo.stats.physicalDEF,
                charInfo.stats.magicATK, charInfo.stats.magicDEF, charInfo.stats.fireATK,
                charInfo.stats.fireDEF, charInfo.stats.lightATK, charInfo.stats.lightDEF,
                charInfo.stats.darkATK, charInfo.stats.darkDEF
            );

            const skills = new SkillContainer(
                charInfo.skills.mining, charInfo.skills.smithing, charInfo.skills.crafting,
                charInfo.skills.fishing, charInfo.skills.gathering, charInfo.skills.farming,
                charInfo.skills.cooking, charInfo.skills.brewing
            );

            const character = new Character(
                charId, charInfo.name, charInfo.level, charInfo.xp, stats, skills,
                charInfo.battleBar, charInfo.lootQuality
            );

            const characterRepo = CharacterRepository.getInstance();
            characterRepo.addCharacter(interaction.user.id, character);
            characterRepo.setActiveCharacter(interaction.user.id, charId);

            const activeChar = characterRepo.getActiveCharacter(interaction.user.id);
            convertBigInt(activeChar);
            embed.setTitle("Your active character's info is: ");

            for (const key in activeChar) {
                let value;
                if (typeof activeChar[key] === 'object') {
                    value = formatCharacterInfo(activeChar[key]);
                } else {
                    value = activeChar[key].toString();
                }

                if (value === '') {
                    value = 'N/A'; 
                }

                embed.addFields({ name: key, value: value, inline: true });
            }
            await interaction.followUp({ embeds: [embed], ephemeral: true });
        } else {
            embed.setTitle(`fail`);
            await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
    } catch (error) {
        console.error('Error in createCharacterCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

const switchCommand = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const charRepo = CharacterRepository.getInstance();
    const allCharacters = charRepo.getCharactersByUserId(interaction.user.id);
    const activeCharacterId = charRepo.getActiveCharacter(interaction.user.id)?.id;

    const otherCharacters = allCharacters.filter(character => character.id !== activeCharacterId);

    if (otherCharacters.length === 0) {
        await interaction.editReply({ content: 'No other characters to switch to', ephemeral: true });
        return;
    }

    const buttons = otherCharacters.map(character => new ButtonBuilder()
        .setCustomId(`switch-character:${character.id}`)
        .setLabel(character.name)
        .setStyle(ButtonStyle.Primary));

    const actionRow = new ActionRowBuilder().addComponents(buttons);

    await interaction.editReply({ content: 'Choose a character:', components: [actionRow] });
}

const statusCommand = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);
        if (!web3Provider) {
            throw new Error('No Web3 provider found for this user.');
        }

        const characterId = 1;

        const charInfo = await web3Provider.queryContract('CharacterProperties', 'getCharacterInfo', [characterId]);

        const stats = new StatContainer(
            charInfo.stats.hpMax, charInfo.stats.mpMax, charInfo.stats.hp, charInfo.stats.mp,
            charInfo.stats.spd, charInfo.stats.physicalATK, charInfo.stats.physicalDEF,
            charInfo.stats.magicATK, charInfo.stats.magicDEF, charInfo.stats.fireATK,
            charInfo.stats.fireDEF, charInfo.stats.lightATK, charInfo.stats.lightDEF,
            charInfo.stats.darkATK, charInfo.stats.darkDEF
        );

        const skills = new SkillContainer(
            charInfo.skills.mining, charInfo.skills.smithing, charInfo.skills.crafting,
            charInfo.skills.fishing, charInfo.skills.gathering, charInfo.skills.farming,
            charInfo.skills.cooking, charInfo.skills.brewing
        );

        const character = new Character(
            characterId, charInfo.name, charInfo.level, charInfo.xp, stats, skills,
            charInfo.battleBar, charInfo.lootQuality
        );

        convertBigInt(character);
        await interaction.editReply({ content: `Character Info: ${JSON.stringify(character)}`, ephemeral: true });
    } catch (error) {
        console.error('Error in statusCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const charactercommands = {
    create: createCommand,
    status: statusCommand,
    switch: switchCommand
};

function convertBigInt(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'bigint') {
            // Convert BigInt to String
            obj[key] = obj[key].toString();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursive call for nested objects
            convertBigInt(obj[key]);
        }
    }
}

function formatCharacterInfo(character) {
    let formattedString = '';
    for (const key in character) {
        if (typeof character[key] === 'object') {
            formattedString += `${key}:\n${formatCharacterInfo(character[key])}\n`;
        } else {
            formattedString += `${key}: ${character[key]}\n`;
        }
    }
    return formattedString;
}
