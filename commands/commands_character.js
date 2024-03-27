import { Class, Race, Personality } from '../data/enums.js';
import { ActionRowBuilder } from 'discord.js';
import { Character, StatContainer, SkillContainer, CharacterRepository } from '../data/repository_character.js';
import pkg from 'discord.js';
const { EmbedBuilder, StringSelectMenuBuilder } = pkg;
import { LocationRepository } from '../data/repository_location.js';
import { addCharacterInfoToEmbed } from '../util/util.js';

let nextCharacterId = 1;

const createCommand = async (interaction) => {
    try {
        const charName = interaction.options.getString('character-name');
        const className = interaction.options.getString('class-name').toUpperCase();
        const raceName = interaction.options.getString('race-name').toUpperCase();

        if (!(className in Class) || !(raceName in Race)) {
            throw new Error('Invalid class or race name.');
        }

        const userId = interaction.user.id;

        const character = createCharacter(userId, charName, className, raceName);

        const characterRepo = CharacterRepository.getInstance();
        characterRepo.addCharacter(userId, character);
        characterRepo.setActiveCharacter(userId, character.id);

        let embed = new EmbedBuilder()
            .setTitle("Huzzah! Your hero has emerged into the realm, ready for adventure!")
            .setColor(0x00AE86)
            .setDescription(`The tale of ${charName}, the valiant ${className} of the ${raceName} race begins!`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in createCharacterCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

function createCharacter(userId, name, className, raceName, personality = 'NO_PERSONALITY') {
    const currentCharacterId = nextCharacterId;
    nextCharacterId++;

    const character = new Character(
        currentCharacterId,
        name,
        1,
        Class[className],
        Race[raceName],
        Personality[personality],
        0,
        [],
        1
    );

    const locationRepo = LocationRepository.getInstance();
    locationRepo.setLocation(userId, currentCharacterId);

    return character;
}

const switchCommand = async (interaction) => {
    const charRepo = CharacterRepository.getInstance();
    const allCharacters = charRepo.getCharactersByUserId(interaction.user.id);
    const activeCharacter = charRepo.getActiveCharacter(interaction.user.id);
    const otherCharacters = allCharacters.filter(character => character.id !== activeCharacter.id);

    if (otherCharacters.length === 0) {
        await interaction.reply({ content: 'No other characters to switch to', ephemeral: true });
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

    await interaction.reply({ content: 'Choose a character:', components: [actionRow], ephemeral: true });
}

const statusCommand = async (interaction) => {
    try {
        const charRepo = CharacterRepository.getInstance();
        const characters = charRepo.getCharactersByUserId(interaction.user.id);

        if (!characters || characters.length === 0) {
            await interaction.reply({ content: 'No characters found for this user.', ephemeral: true });
            return;
        }

        const activeChar = charRepo.getActiveCharacter(interaction.user.id);
        if (!activeChar || !activeChar.id) {
            await interaction.reply({ content: 'No active character found.', ephemeral: true });
            return;
        }

        let embed = new EmbedBuilder();
        embed = addCharacterInfoToEmbed(activeChar, embed);
        embed.setTitle("Your active character's info is: ")
            .setColor(0x00AE86);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error in statusCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const charactercommands = {
    create: createCommand,
    status: statusCommand,
    switch: switchCommand
}