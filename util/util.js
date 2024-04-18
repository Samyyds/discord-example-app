import { Class, Race, Personality } from '../data/enums.js';
import itemsData from '../json/items.json' assert { type: 'json' };
import { RegionsData } from "../data/repository_location.js";

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

function createProgressBar(currentXp, totalXpForNextLevel, barLength = 10) {
    const filledLength = Math.round((currentXp / totalXpForNextLevel) * barLength);
    const emptyLength = barLength - filledLength;
    return "█".repeat(filledLength) + "░".repeat(emptyLength);
}

export function addCharacterInfoToEmbed(activeChar, embed, infoType) {
    let description = '';
    switch (infoType) {
        case 'basic':
            description += `Name : ${activeChar.name}\n`;
            description += `Class : ${Object.keys(Class).find(key => Class[key] === activeChar.classId).toLowerCase()}\n`;
            description += `Race : ${Object.keys(Race).find(key => Race[key] === activeChar.raceId).toLowerCase()}\n`;
            description += `Personality : ${Object.keys(Personality).find(key => Personality[key] === activeChar.personalityId).toLowerCase()}\n`;
            description += `Level : ${activeChar.level}\n`;
            const { newXp, xpForNextLevel } = increaseXp(activeChar.xp, activeChar.level, 0);
            description += `XP: ${createProgressBar(newXp, xpForNextLevel)}\n`;
            description += "\n**Equipped Items:**\n";
            let hasEquippedItems = false;
            for (const slot in activeChar.equippedItems) {
                if (activeChar.equippedItems.hasOwnProperty(slot) && activeChar.equippedItems[slot]) {
                    description += `${slot.charAt(0).toUpperCase() + slot.slice(1)}: ${activeChar.equippedItems[slot].name}\n`;
                    hasEquippedItems = true;
                }
            }
            if (!hasEquippedItems) {
                description += "No items equipped.\n";
            }
            break;
        case 'stats':
            Object.keys(activeChar.stats).forEach(stat => {
                if (typeof activeChar.stats[stat] !== 'object' && activeChar.stats[stat] !== undefined) {
                    description += `${stat}: ${activeChar.stats[stat]}\n`;
                } else {
                    description += `${stat}: Data not available\n`;
                }
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

export function getItemDataById(itemId) {
    const itemData = itemsData.find(item => item.id === itemId);
    if (!itemData) return null;
    return itemData;
}

export function convertNameToRegionId(name) {
    const lowerName = name.toLowerCase();
    const Regions = RegionsData.Regions;
    for (const regionKey in Regions) {
        if (Regions[regionKey].name.toLowerCase() === lowerName) {
            return Regions[regionKey].id;
        }
    }
    console.log(`No region found for the name: ${name}`);
    return undefined;
}

export function convertNameToLocationId(name, regionId) {
    const lowerName = name.toLowerCase();
    const Regions = RegionsData.Regions;
    const region = Regions[Object.keys(Regions).find(key => Regions[key].id === regionId)];
    if (region) {
        for (const locationKey in region.locations) {
            if (region.locations[locationKey].name.toLowerCase() === lowerName) {
                return region.locations[locationKey].id;
            }
        }
    }
    console.log(`No location found for the name: ${name} in region ID: ${regionId}`);
    return undefined;
}
