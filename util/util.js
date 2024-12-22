import { Class, Race, Personality, Item, Skill, Ability } from '../data/enums.js';
import itemsData from '../json/items.json' assert { type: 'json' };
import { RegionManager } from '../manager/region_manager.js';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';

// export function increaseXp(currentXp, currentLevel, amount, levelCap = 100) {
//     const baseSkillRequirement = 100;
//     let xp = currentXp + amount;
//     let level = currentLevel;

//     let xpNeededForNextLevel = Math.floor(baseSkillRequirement * Math.pow(1.063, level));

//     while (xp >= xpNeededForNextLevel && level < levelCap) {
//         xp -= xpNeededForNextLevel;
//         level++;
//         xpNeededForNextLevel = Math.floor(baseSkillRequirement * Math.pow(1.063, level));
//     }

//     return {
//         newLevel: level,
//         newXp: xp,
//         xpForNextLevel: xpNeededForNextLevel
//     };
// }

export function calculateLevelFromXp(xp) {
    const xpOffset = 5;

    if (xp < xpOffset) {
        return 0;
    }
    else {
        return Math.floor(Math.pow(xp - xpOffset, 0.3332));
    }
    //return Math.floor(Math.pow(xp, 0.5));
}

function xpRequiredForLevel(level) {
    return Math.pow(level, 2);
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
            description += `Name : **${activeChar.name}**\n`;
            description += `Class : ${Object.keys(Class).find(key => Class[key] === activeChar.classId).toLowerCase()}\n`;
            description += `Race : ${Object.keys(Race).find(key => Race[key] === activeChar.raceId).toLowerCase()}\n`;
            description += `Personality : ${Object.keys(Personality).find(key => Personality[key] === activeChar.personalityId).toLowerCase()}\n`;
            description += `Level : ${activeChar.level}\n`;
            const xpForCurrentLevel = xpRequiredForLevel(activeChar.level);
            const xpForNextLevel = xpRequiredForLevel(activeChar.level + 1);
            const currentXp = activeChar.xp - xpForCurrentLevel;

            description += `XP: ${createProgressBar(currentXp, xpForNextLevel - xpForCurrentLevel)}\n`;

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
            // let statsBlock = '```ansi\n';
            // Object.keys(activeChar.stats).forEach(stat => {
            //     if (typeof activeChar.stats[stat] !== 'object' && activeChar.stats[stat] !== undefined) {
            //         if (stat.toLowerCase() === 'hp') {
            //             const hpValue = activeChar.stats[stat];
            //             const hpMax = activeChar.stats['hpMax'];
            //             const hpPercentage = (hpValue / hpMax) * 100;

            //             if (hpPercentage > 50) {
            //                 statsBlock += `${stat}: \u001b[32m${hpValue}\u001b[0m\n`;
            //             } else {
            //                 statsBlock += `${stat}: \u001b[31m${hpValue}\u001b[0m\n`;
            //             }
            //         } else if (stat.toLowerCase() === 'mp') {
            //             statsBlock += `${stat}: \u001b[34m${activeChar.stats[stat]}\u001b[0m\n`;
            //         } else {
            //             statsBlock += `${stat}: ${activeChar.stats[stat]}\n`;
            //         }
            //     } else {
            //         statsBlock += `${stat}: Data not available\n`;
            //     }
            // });
            // statsBlock += '```';
            // description += statsBlock;
            // break;
            const hp = activeChar.stats.hp || 0;
            const hpMax = activeChar.stats.hpMax || 0;
            const mp = activeChar.stats.mp || 0;
            const mpMax = activeChar.stats.mpMax || 0;
            const spd = activeChar.stats.spd || 0;
            const physicalATK = activeChar.stats.physicalATK || 0;
            const physicalDEF = activeChar.stats.physicalDEF || 0;
            const magicATK = activeChar.stats.magicATK || 0;
            const magicDEF = activeChar.stats.magicDEF || 0;

            description += `HP: ${hp}/${hpMax} | MP: ${mp}/${mpMax} | SPD: ${spd}\n`;
            description += `PHY: ${physicalATK} ATK | ${physicalDEF} DEF\n`;
            description += `MAG: ${magicATK} ATK | ${magicDEF} DEF\n`;

            break;

        case 'skills':
            Object.keys(activeChar.skills.skills).forEach(skill => {
                const skillData = activeChar.skills.skills[skill];
                const skillLevel = calculateLevelFromXp(skillData.xp);
                const xpForSkillLevel = xpRequiredForLevel(skillLevel);
                const xpForNextSkillLevel = xpRequiredForLevel(skillLevel + 1);
                const currentSkillXp = skillData.xp - xpForSkillLevel;

                const skillName = `**${skill.charAt(0).toUpperCase() + skill.slice(1)}**`;

                description += `${skillName}:\n`;
                description += `Level: ${skillLevel}\n`;
                description += `XP: ${createProgressBar(currentSkillXp, xpForNextSkillLevel - xpForSkillLevel)}\n\n`;
            });
            break;
        case 'abilities': {
            activeChar.abilities.forEach(ability => {
                let abilityName = `__${ability.name.charAt(0).toUpperCase() + ability.name.slice(1).toLowerCase()}__`;
                let abilityDescription = `*${ability.description}*`;
                description += `${abilityName}:\n${abilityDescription}\n\n`;
            });
            break;
        }
        default:
            description = 'No information available.';
    }
    embed.setDescription(description);
    return embed;
}

export function formatAbilityName(ability) {
    if (ability && ability.name) {
        return ability.name;
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

export function recipesParser(recipes, embed) {
    const maxFieldLength = 1024;
    let currentFieldValue = '';
    let fieldIndex = 1;

    recipes.forEach(recipe => {
        const skillName = Object.keys(Skill).find(key => Skill[key] === recipe.skill);

        if (!skillName) {
            console.warn(`Skill not found for skill value: ${recipe.skill}`);
            return;
        }

        let ingredientsText = recipe.ingredients.map(ing => {
            let itemName = Object.keys(Item).find(key => Item[key] === ing.item);

            if (!itemName) {
                itemName = ing.item;
            }

            return `${itemName.toLowerCase()} x${ing.quantity}`;
        }).filter(Boolean).join(', ');


        let recipeText = `**${recipe.name}**\nSkill: ${skillName.toLowerCase()} (Min: ${recipe.minSkill})\nIngredients: ${ingredientsText}\n\n`;

        if (currentFieldValue.length + recipeText.length > maxFieldLength) {
            embed.addFields({ name: `Recipes (${fieldIndex})`, value: currentFieldValue, inline: false });
            currentFieldValue = recipeText;
            fieldIndex += 1;
        } else {
            currentFieldValue += recipeText;
        }
    });

    if (currentFieldValue.length > 0) {
        embed.addFields({ name: `Recipes (${fieldIndex})`, value: currentFieldValue, inline: false });
    }

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

export async function sendErrorMessage(interaction, message) {
    const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(message);

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed], ephemeral: true });
    } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

export async function sendWelcomeMessage(channel) {
    const button = new ButtonBuilder()
        .setCustomId('start_game')
        .setLabel('Start Game')
        .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    const welcomeText = '\n\nHello, welcome to Merfolk & Magic, a text-based adventure game.\n\n' +
        'To start playing, press the button below to unlock the game channel.\n\n' +
        'Then go to the game and type /start to begin playing. Have fun!\n\n';

    try {
        const message = await channel.send({
            content: welcomeText,
            components: [row]
        });
        await message.pin();
        console.log('Message pinned successfully.');
    } catch (error) {
        console.error('Failed to send or pin the message:', error);
    }
}

export function parseNpcDialogue(text) {
    const segments = [];
    let position = 0;
    let inDialogue = false;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === "\"" && (i === 0 || text[i - 1] !== '\\')) {
            if (inDialogue) {
                segments.push({ type: 'dialogue', text: text.substring(position, i) });
                position = i + 1;
            } else {
                if (i > position) {
                    segments.push({ type: 'narrative', text: text.substring(position, i) });
                }
                position = i + 1;
            }
            inDialogue = !inDialogue;
        }
    }
    if (position < text.length) {
        segments.push({ type: inDialogue ? 'dialogue' : 'narrative', text: text.substring(position) });
    }
    return segments;
}

export function parseEnemyDialogue(text) {
    return text.split('\n').filter(line => line.trim() !== '');
}




