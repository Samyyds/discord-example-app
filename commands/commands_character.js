import pkg from 'discord.js';
import { saveCharacterData, getNextCharacterId } from "../db/mysql.js";
const { EmbedBuilder, StringSelectMenuBuilder } = pkg;
import { Class, Race, Personality } from '../data/enums.js';
import { AbilityManager } from '../manager/ability_manager.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { Character, CharacterManager, StatContainer, StatusContainer, CLASS_BASE_STATS, CLASS_BASE_STAT_MODIFIERS, RACE_BASE_STAT_MODIFIERS, PERSONALITY_BASE_STAT_MODIFIERS } from '../manager/character_manager.js';
import { sendErrorMessage } from "../util/util.js";

//let currentCharacterId = 0;

const createCommand = async (interaction) => {
    try {
        const charName = interaction.options.getString('character-name');
        const className = interaction.options.getString('class-name').toUpperCase();
        const raceName = interaction.options.getString('race-name').toUpperCase();
        const personalityName = interaction.options.getString('personality-name').toUpperCase();

        if (!(className in Class) || !(raceName in Race) || !(personalityName in Personality)) {
            return await sendErrorMessage(interaction, 'Invalid class, race or personality name.');
        }

        const userId = interaction.user.id;

        const hasSubscriberRole = interaction.member.roles.cache.some(role => role.name === 'Subscriber');
        if ((raceName === 'MINOTAUR' || raceName === 'ULFUR') && !hasSubscriberRole) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('Restricted Access')
                .setDescription('The race you have chosen is only available to subscribers.');
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const character = await createCharacter(userId, charName, className, raceName, personalityName);

        const characterManager = CharacterManager.getInstance();
        characterManager.addCharacter(userId, character);
        characterManager.setActiveCharacter(userId, character.id);

        let embed = new EmbedBuilder()
            .setTitle("Huzzah! Your hero has emerged into the realm, ready for adventure!")
            .setColor(0x00AE86)
            .setDescription(`The tale of ${charName}, the valiant ${className.toLowerCase()} of the ${raceName.toLowerCase()} race begins!`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in createCharacterCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

async function createCharacter(userId, name, className, raceName, personalityName) {
   
    let currentCharacterId = await getNextCharacterId();
    //currentCharacterId ++;

    const classModifiers = CLASS_BASE_STAT_MODIFIERS[className];
    const raceModifiers = RACE_BASE_STAT_MODIFIERS[raceName];
    const personalityModifiers = PERSONALITY_BASE_STAT_MODIFIERS[personalityName];

    const finalHpModifier = 1 - (1 - raceModifiers.hp) - 0.1 + (classModifiers.hp - 1);
    const finalMpModifier = 1 - (1 - raceModifiers.mp) - 0.1 + (classModifiers.mp - 1);
    const finalSpdModifier = 1 - (1 - raceModifiers.spd) - (1 - personalityModifiers.spd) + (classModifiers.spd - 1);

    const classStats = CLASS_BASE_STATS[className];

    const character = new Character(
        currentCharacterId,
        name,
        0, 
        Class[className],
        Race[raceName],
        Personality[personalityName],
        0, 
        [], 
        1, 
        [],
        50 
    );

    character.stats.hpMax = Math.round(classStats.hp * finalHpModifier);
    character.stats.mpMax = Math.round(classStats.mp * finalMpModifier);
    character.stats.hp = character.stats.hpMax;
    character.stats.mp = character.stats.mpMax; 
    character.stats.spd = Math.round(classStats.spd * finalSpdModifier);

    character.stats.physicalATK = Math.round(
        classStats.physicalATK * classModifiers.physicalATK * raceModifiers.physicalATK * personalityModifiers.physicalATK
    );
    character.stats.physicalDEF = Math.round(
        classStats.physicalDEF * classModifiers.physicalDEF * raceModifiers.physicalDEF * personalityModifiers.physicalDEF
    );
    character.stats.magicATK = Math.round(
        classStats.magicATK * classModifiers.magicATK * raceModifiers.magicATK * personalityModifiers.magicATK
    );
    character.stats.magicDEF = Math.round(
        classStats.magicDEF * classModifiers.magicDEF * raceModifiers.magicDEF * personalityModifiers.magicDEF
    );

    const abilityManager = AbilityManager.getInstance();
    abilityManager.assignAbilitiesToCharacter(character);

    const playerMoveManager = PlayerMovementManager.getInstance();
    playerMoveManager.setLocation(userId, currentCharacterId, 0, 3, 0);
    const location = playerMoveManager.getLocation(userId, currentCharacterId);

    saveCharacterData(userId, character, location);

    return character;
}

const switchCommand = async (interaction) => {
    const charRepo = CharacterManager.getInstance();
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
        const charRepo = CharacterManager.getInstance();
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

        let embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle("Character Information")
            .setDescription("Click the buttons below to view detailed information about your character.");

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('show_basic_info')
                    .setLabel('Basic Info')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('show_stats')
                    .setLabel('Stats')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('show_skills')
                    .setLabel('Skills')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('show_abilities')
                    .setLabel('Abilities')
                    .setStyle(ButtonStyle.Primary),
            );

        await interaction.reply({ embeds: [embed], components: [buttonRow], ephemeral: true });
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