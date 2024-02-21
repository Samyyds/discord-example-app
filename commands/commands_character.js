import Web3Manager from '../web3/web3_manager.js';
import { Class, Race } from '../data/enums.js';
import { ActionRowBuilder } from 'discord.js';
import { Character, StatContainer, SkillContainer, CharacterRepository } from '../data/repository_character.js';
import pkg from 'discord.js';
const { EmbedBuilder, StringSelectMenuBuilder } = pkg;
import { LocationRepository } from '../data/repository_location.js';
import { getKeyByValue, addCharacterInfoToEmbed, convertBigInt } from '../util/util.js';

const createCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const charName = interaction.options.getString('character-name');
        const className = interaction.options.getString('class-name').toUpperCase();
        const raceName = interaction.options.getString('race-name').toUpperCase();

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
        let embed = new EmbedBuilder();

        if (status === 1n) {
            embed.setTitle(`Huzzah! Your hero has emerged into the realm, ready for adventure!`);
            await interaction.editReply({ embeds: [embed], ephemeral: true });

            embed.setTitle("Peering into the annals of destiny, uncovering your fate...");
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
                charId, charInfo.name, charInfo.level, getKeyByValue(Class, web3Provider.toNumber(charInfo.classId)), getKeyByValue(Race, web3Provider.toNumber(charInfo.raceId)), charInfo.personalityId, charInfo.xp, stats, skills,
                charInfo.battleBar, charInfo.lootQuality
            );

            const characterRepo = CharacterRepository.getInstance();
            characterRepo.addCharacter(interaction.user.id, character);
            characterRepo.setActiveCharacter(interaction.user.id, charId);

            const activeChar = characterRepo.getActiveCharacter(interaction.user.id);
            const coveredChar = convertBigInt(activeChar);

            const locationRepo = LocationRepository.getInstance();
            locationRepo.setLocation(interaction.user.id, activeChar.id, 0, 0);

            embed.setTitle("Behold, the tale of your valiant hero unfolds: ")
                 .setColor(0x00AE86);
            embed = addCharacterInfoToEmbed(coveredChar, embed);
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
    const activeCharacter = charRepo.getActiveCharacter(interaction.user.id);
    const otherCharacters = allCharacters.filter(character => character.id !== activeCharacter.id);

    if (otherCharacters.length === 0) {
        await interaction.editReply({ content: 'No other characters to switch to', ephemeral: true });
        return;
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('switch-character')
        .setPlaceholder('Switch a character');

    if (activeCharacter) {
        selectMenu.addOptions({
            label: `${activeCharacter.name} (Active)`,
            description: `Level: ${activeCharacter.level}, Class: ${activeCharacter.classId}, Race: ${activeCharacter.raceId} `,
            value: activeCharacter.id.toString()
        });
    }

    otherCharacters.forEach(character => {
        selectMenu.addOptions({
            label: `${character.name} (Inactive)`,
            description: `Level: ${character.level}, Class: ${character.classId}, Race: ${character.raceId} `,
            value: character.id.toString()
        });
    });

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.editReply({ content: 'Choose a character:', components: [actionRow] });
}

const statusCommand = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);
        if (!web3Provider) {
            throw new Error('No Web3 provider found for this user.');
        }

        const charRepo = CharacterRepository.getInstance();
        const characters = charRepo.getCharactersByUserId(interaction.user.id);
        if (!characters || characters.length === 0) {
            await interaction.editReply({ content: 'No characters found for this user.', ephemeral: true });
            return;
        }

        const activeChar = charRepo.getActiveCharacter(interaction.user.id);
        if (!activeChar || !activeChar.id) {
            await interaction.editReply({ content: 'No active character found.', ephemeral: true });
            return;
        }

        const activeId = activeChar.id;
        const charInfo = await web3Provider.queryContract('CharacterProperties', 'getCharacterInfo', [Number(activeId)]);

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
            activeId, charInfo.name, charInfo.level, getKeyByValue(Class, web3Provider.toNumber(charInfo.classId)), getKeyByValue(Race, web3Provider.toNumber(charInfo.raceId)), charInfo.personalityId, charInfo.xp, stats, skills,
            charInfo.battleBar, charInfo.lootQuality
        );

        let embed = new EmbedBuilder();
        const coveredChar = convertBigInt(character);
        embed = addCharacterInfoToEmbed(coveredChar, embed);
        embed.setTitle("Your active character's info is: ")
             .setColor(0x00AE86);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error in statusCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const charactercommands = {
    create: createCommand,
    status: statusCommand,
    switch: switchCommand
}