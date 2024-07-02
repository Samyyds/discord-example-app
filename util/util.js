import { Class, Race, Personality, Item, Ability } from '../data/enums.js';
import itemsData from '../json/items.json' assert { type: 'json' };
import { RegionManager } from '../manager/region_manager.js';
import recipesData from '../json/recipes.json' assert {type: 'json'};

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
        case 'abilities':
            description += "\n**Abilities:**\n";
            activeChar.abilities.forEach(abilityId => {
                description += `${formatAbilityName(abilityId)}\n`;
            });
            break;
        default:
            description = 'No information available.';
    }
    embed.setDescription(description);
    return embed;
}

export function formatAbilityName(abilityId) {
    for (const [key, value] of Object.entries(Ability)) {
        if (value === abilityId) {
            return key.toLowerCase().replace(/_/g, ' ');
        }
    }
    return 'Unknown Ability';
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
    const regionManager = RegionManager.getInstance();
    for (const [regionId, region] of regionManager.regions) {
        if (region.name.toLowerCase() === lowerName) {
            return region.id;
        }
    }
    console.log(`No region found for the name: ${name}`);
    return undefined;
}

export function convertNameToLocationId(name, regionId) {
    const lowerName = name.toLowerCase();
    const regionManager = RegionManager.getInstance();
    const region = regionManager.getRegionById(regionId);
    if (region) {
        for (const [locationId, location] of region.locations) {
            if (location.name.toLowerCase() === lowerName) {
                return location.locationId;
            }
        }
    }
    console.log(`No location found for the name: ${name} in region ID: ${regionId}`);
    return undefined;
}

export function recipesParser(recipeIds, embed) {
    if (!recipeIds.length) {
        embed.addFields({ name: 'No Recipes Available', value: 'You currently do not have any recipes.', inline: false });
        return embed;
    }

    const itemNames = Object.keys(Item).reduce((obj, key) => {
        obj[Item[key]] = key.replace(/_/g, ' ').toLowerCase();
        return obj;
    }, {});

    let description = '';
    recipeIds.forEach(id => {
        const recipe = recipesData.find(r => r.id === id);
        if (recipe) {
            description += `${itemNames[recipe.result]} recipe: `;
            let ingredientTexts = recipe.ingredients.map(ing => `${itemNames[ing.item]}*${ing.quantity}`);
            description += ingredientTexts.join(', ') + '\n';
        }
    });

    embed.addFields({ name: 'Your available recipes are:\n', value: description.trim(), inline: false });

    return embed;
}

export function serializeObject(instance, properties) {
    let serialized = {};
    properties.forEach(prop => {
        if (instance[prop] !== undefined) {
            serialized[prop] = instance[prop];
        }
    });
    return JSON.stringify(serialized);
}

export function exportLocationValues(location) {
    return {
        regionId: location.regionId,
        locationId: location.locationId,
        roomId: location.roomId
    };
}
