import { Class, Race, Personality } from '../data/enums.js';

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

// export function formatCharacterInfo(character) {
//     let formattedString = '';
//     for (const key in character) {
//         if (typeof character[key] === 'object') {
//             formattedString += `${key}:\n${formatCharacterInfo(character[key])}\n`;
//         } else {
//             formattedString += `${key}: ${character[key]}\n`;
//         }
//     }
//     return formattedString;
// }

// export function addCharacterInfoToEmbed(activeChar, embed) {
//     for (const key in activeChar) {
//         let value;
//         if (typeof activeChar[key] === 'object') {
//             value = formatCharacterInfo(activeChar[key]);
//         } else {
//             value = activeChar[key].toString();
//         }

//         if (value === '') {
//             value = 'N/A';
//         }

//         embed.addFields({ name: key, value: value, inline: true });
//     }
//     return embed;
// }

function createProgressBar(currentXp, totalXpForNextLevel, barLength = 10) {
    const filledLength = Math.round((currentXp / totalXpForNextLevel) * barLength);
    const emptyLength = barLength - filledLength;
    return "█".repeat(filledLength) + "░".repeat(emptyLength);
}

export function addCharacterInfoToEmbed(activeChar, embed, infoType) {
    let description = '';
    switch(infoType) {
        case 'basic':
            description += `Name : ${activeChar.name}\n`;
            description += `Class : ${Object.keys(Class).find(key => Class[key] === activeChar.classId).toLowerCase()}\n`;
            description += `Race : ${Object.keys(Race).find(key => Race[key] === activeChar.raceId).toLowerCase()}\n`;
            description += `Personality : ${Object.keys(Personality).find(key => Personality[key] === activeChar.personalityId).toLowerCase()}\n`;
            description += `Level : ${activeChar.level}\n`;
            const { newXp, xpForNextLevel } = increaseXp(activeChar.xp, activeChar.level, 0);
            description += `XP: ${createProgressBar(newXp, xpForNextLevel)}\n`;
            break;
        case 'stats':
            Object.keys(activeChar.stats).forEach(stat => {
                description += `${stat}: ${activeChar.stats[stat]}\n`;
            });
            break;
        case 'skills':
            Object.keys(activeChar.skills).forEach(skill => {
                const skillData = activeChar.skills[skill];
                const skillXpInfo = increaseXp(skillData.xp, skillData.level, 0);
                description += `${skill.charAt(0).toUpperCase() + skill.slice(1)}: \nLevel: ${skillData.level}\nXP: ${createProgressBar(skillXpInfo.newXp, skillXpInfo.xpForNextLevel)}\n`;
            });
            break;
        default:
            description = 'No information available.';
    }
    embed.setDescription(description);
    return embed;
}


export function getKeyByValue(enumObj, value) {
    return Object.keys(enumObj).find(key => enumObj[key] === value);
}
