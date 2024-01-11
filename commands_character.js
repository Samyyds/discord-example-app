import Web3Manager from './web3_manager.js';
import { Class, Race } from './enums.js';
import { Character, StatContainer, SkillContainer, CharatcerRepository } from './character_repository.js';

const createCommand = async (interaction) => {
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

        const output = await web3Provider.queryContract('CharacterOwnership', 'tokensOfOwner', web3Provider.currentAccount.address);
        const character = new Character(
            output.tokens[output.tokens.length - 1], charInfo.name, charInfo.level, charInfo.xp, stats, skills,
            charInfo.battleBar, charInfo.lootQuality
        );
        const characterRepo = CharacterRepository.getInstance();
        characterRepo.addCharacter(interaction.user.id, character);
        characterRepo.setActiveCharacter(interaction.user.id, output.tokens[output.tokens.length - 1]);

    } catch (error) {
        console.error('Error in createCharacterCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

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

        await interaction.editReply({ content: `Character Info: ${JSON.stringify(character)}`, ephemeral: true });
    } catch(error) {
        console.error('Error in statusCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const charactercommands = {
    create: createCommand,
    status: statusCommand
};