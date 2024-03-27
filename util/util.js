import { LocationType } from '../data/enums.js';

export function increaseXp(currentXp, currentLevel, amount, levelCap = 100) {
    const baseSkillRequirement = 100;
    let xp = currentXp + amount;
    let level = currentLevel;
    
    let xpNeededForNextLevel = Math.floor(baseSkillRequirement * Math.pow(1.063, level));
    
    while (xp >= xpNeededForNextLevel && level < levelCap) {
        xp -= xpNeededForNextLevel;
        level++;
        xpNeededForNextLevel = Math.floor(baseSkillRequirement * Math.pow(1.063, level));
    }
    
    return {
        newLevel: level,
        newXp: xp,
        xpForNextLevel: xpNeededForNextLevel
    };
}

export function formatCharacterInfo(character) {
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

export function addCharacterInfoToEmbed(activeChar, embed) {
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
    return embed;
}

export function getKeyByValue(enumObj, value) {
    return Object.keys(enumObj).find(key => enumObj[key] === value);
}
