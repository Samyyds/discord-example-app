import { Class, Race } from '../data/enums.js';
import { ActionRowBuilder } from 'discord.js';
import { Character, StatContainer, SkillContainer, CharacterRepository } from '../data/repository_character.js';
import pkg from 'discord.js';
const { EmbedBuilder, StringSelectMenuBuilder } = pkg;
import { LocationRepository } from '../data/repository_location.js';
import { addCharacterInfoToEmbed } from '../util/util.js';

const CLASS_BASE_STATS = {
    'NO_CLASS': { hp: 100, mp: 100, spd: 100, physicalATK: 100, physicalDEF: 100, magicATK: 100, magicDEF: 100 },
    'WARRIOR': { hp: 300, mp: 100, spd: 100, physicalATK: 150, physicalDEF: 120, magicATK: 60, magicDEF: 60 },
    'ROGUE': { hp: 100, mp: 100, spd: 200, physicalATK: 150, physicalDEF: 120, magicATK: 60, magicDEF: 60 },
    'MAGE': { hp: 100, mp: 200, spd: 100, physicalATK: 60, physicalDEF: 60, magicATK: 150, magicDEF: 120 },
};

const CLASS_BASE_STAT_MODIFIERS = {
    'NO_CLASS': { hp: 1, mp: 1, spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'WARRIOR': { hp: 1.3, mp: 1, spd: 0.8, physicalATK: 1.5, physicalDEF: 1.2, magicATK: 1.1, magicDEF: 0.5 },
    'ROGUE': { hp: 1.3, mp: 1, spd: 1.8, physicalATK: 1.5, physicalDEF: 1.2, magicATK: 1.1, magicDEF: 0.5 },
    'MAGE': { hp: 1.3, mp: 2, spd: 1, physicalATK: 0.6, physicalDEF: 0.6, magicATK: 1.5, magicDEF: 1.2 },
};

const RACE_BASE_STAT_MODIFIERS = {
    'HUMAN': { hp: 1.1, mp: 1, spd: 1, physicalATK: 1.1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'ELF': { hp: 0.9, mp: 1.2, spd: 1.2, physicalATK: 0.9, physicalDEF: 0.9, magicATK: 1.2, magicDEF: 1.2 },
    'DWARF': { hp: 1.2, mp: 0.8, spd: 0.8, physicalATK: 1.2, physicalDEF: 1.3, magicATK: 0.8, magicDEF: 1 },
};

const PERSONALITY_BASE_STAT_MODIFIERS = {
    'NO_PERSONALITY': { hp: 1, mp: 1, spd: 1, physicalATK: 1, physicalDEF: 1, magicATK: 1, magicDEF: 1 },
    'BRAWNY': { hp: 1.1, mp: 0.9, spd: 0.9, physicalATK: 1.2, physicalDEF: 1.1, magicATK: 0.9, magicDEF: 0.9 },
    'WISE': { hp: 0.9, mp: 1.1, spd: 1, physicalATK: 0.9, physicalDEF: 0.9, magicATK: 1.2, magicDEF: 1.2 },

}

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

function createCharacter(userId, name, className, raceName, personalityId = 'NO_PERSONALITY') {
    const baseStats = CLASS_BASE_STATS[className];
    const statModifiers = CLASS_BASE_STAT_MODIFIERS[className];
    const raceModifiers = RACE_BASE_STAT_MODIFIERS[raceName];
    const personalityModifiers = PERSONALITY_BASE_STAT_MODIFIERS[personalityId];
    
    const currentCharacterId = nextCharacterId;
    nextCharacterId++;

    const finalStats = {
        hp: baseStats.hp * statModifiers.hp * raceModifiers.hp * personalityModifiers.hp,
        mp: baseStats.mp * statModifiers.mp * raceModifiers.mp * personalityModifiers.mp,
        spd: baseStats.spd * statModifiers.spd * raceModifiers.spd * personalityModifiers.spd,
        physicalATK: baseStats.physicalATK * statModifiers.physicalATK * raceModifiers.physicalATK * personalityModifiers.physicalATK,
        physicalDEF: baseStats.physicalDEF * statModifiers.physicalDEF * raceModifiers.physicalDEF * personalityModifiers.physicalDEF,
        magicATK: baseStats.magicATK * statModifiers.magicATK * raceModifiers.magicATK * personalityModifiers.magicATK,
        magicDEF: baseStats.magicDEF * statModifiers.magicDEF * raceModifiers.magicDEF * personalityModifiers.magicDEF,
    };

    const stats = new StatContainer(finalStats);
    const skills = new SkillContainer({});

    const character =  new Character(
        currentCharacterId, 
        name,
        1,
        Class[className],
        Race[raceName],
        personalityId,
        0,
        stats,
        skills,
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

    await interaction.reply({ content: 'Choose a character:', components: [actionRow] });
}

const statusCommand = async (interaction) => {
    try {
        const charRepo = CharacterRepository.getInstance();
        const characters = charRepo.getCharactersByUserId(interaction.user.id);

        if (!characters || characters.length === 0) {
            await interaction.editReply({ content: 'No characters found for this user.', ephemeral: true });
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