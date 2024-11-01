import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager, CombatSession } from '../manager/character_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { RegionManager } from "../manager/region_manager.js";
import { AbilityManager } from "../manager/ability_manager.js";
import { QuestManager } from "../manager/quest_manager.js";
import { ItemManager, Key } from "../manager/item_manager.js";
import { sendErrorMessage } from "../util/util.js";
import { ItemType, QuestStatus } from "../data/enums.js";
import { InventoryManager } from "../manager/inventory_manager.js";

const attackCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const characterManager = CharacterManager.getInstance();
        const activeChar = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeChar) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const enemyNameInput = interaction.options.getString('enemy-name');
        if (!enemyNameInput) {
            return await sendErrorMessage(interaction, 'Enemy name is required.');
        }
        const enemyName = enemyNameInput.trim().toLowerCase();

        const playerMovementManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMovementManager.getLocation(interaction.user.id, activeChar.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        if (!room) {
            return await sendErrorMessage(interaction, `Room not found for regionId ${regionId}, locationId ${locationId}, roomId ${roomId}`);
        }
        const enemies = room.getEnemies();

        const enemy = enemies.find(enemy => enemy.name.toLowerCase() === enemyName);
        if (!enemy) {
            return await sendErrorMessage(interaction, `Enemy with name ${enemyName} not found in this room.`);
        }

        const combatSession = new CombatSession();
        combatSession.characters = [activeChar, enemy];

        await interaction.editReply({ content: `Combat started with ${enemy.name}!` });
        await sendAbilityButtons(interaction, activeChar, enemy);

        const combatLoop = async () => {
            while (combatSession.active && activeChar.alive && enemy.alive) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const { combatLog, playerAlive, enemyAlive } = turnBasedCombat(interaction, activeChar, enemy, combatSession.currentAbilityId, regionManager, regionId, locationId, roomId);
                await sendCombatLog(interaction, combatLog);
                if (!playerAlive || !enemyAlive) {
                    combatSession.active = false;
                }
            }
            if (!combatSession.active) {
                combatSession.endCombat();
                await interaction.editReply({ content: 'Combat ended.' });
            }
        };

        combatLoop();

    } catch (error) {
        console.error('Error in attackCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export function turnBasedCombat(interaction, player, enemy, abilityId, regionManager, regionId, locationId, roomId) {
    const combatLog = [];
    console.log(`Before combat: hpMax: ${player.stats.hpMax}, mpMax: ${player.stats.mpMax}`);
    const abilityManager = AbilityManager.getInstance();
    const ability = abilityManager.getAbilityById(abilityId);

    if (!ability) {
        combatLog.push('Invalid ability index.');
        return { combatLog, playerAlive: true, enemyAlive: true };
    }

    if (player.stats.mp < ability.mpCost) {
        combatLog.push(`${player.name} does not have enough MP to use ${ability.name}.`);
        return { combatLog, playerAlive: true, enemyAlive: true };
    }

    player.stats.mp -= ability.mpCost;

    console.log(`[Combat Log] ${player.name}'s MP after using ${ability.name}: ${player.stats.mp}`);

    let damage = applyAbilityEffect(player, enemy, ability, combatLog);

    combatLog.push(`${player.name}'s remaining HP: ${player.stats.hp}.`);
    combatLog.push(`${enemy.name}'s remaining HP: ${enemy.stats.hp}`);

    if (enemy.stats.hp <= 0) {
        handleEnemyDefeat(interaction, player, enemy, combatLog, regionManager, regionId, locationId, roomId);
        return { combatLog, playerAlive: true, enemyAlive: false };
    }

    let enemyAbility = getRandomEnemyAbility(enemy);

    if (!enemyAbility) {
        combatLog.push('Enemy tried to use an invalid ability.');
        return { combatLog, playerAlive: true, enemyAlive: true };
    }

    const enemyDamage = handlePhysicalAttack(enemy, player, enemyAbility.intensity);

    combatLog.push(`${enemy.name} used ${enemyAbility.name} on ${player.name}.`);
    combatLog.push(`${player.name} took ${enemyDamage} damage. Remaining HP: ${player.stats.hp}`);

    if (player.stats.hp <= 0) {
        combatLog.push(`${player.name} is defeated!`);
        combatLog.push('Your soul will be sent to the Moku\'ah Clinic.');
        const characterManager = CharacterManager.getInstance();
        characterManager.reviveCharacter(interaction.user.id);
        return { combatLog, playerAlive: false, enemyAlive: true };
    }

    return { combatLog, playerAlive: true, enemyAlive: true };
}

function applyAbilityEffect(player, enemy, ability, combatLog) {
    let damage = 0;
    const abilityEffectMap = {
        'punch': {
            damageType: 'physical',
            damageValue: 80,
            action: `${player.name} swings their fist at ${enemy.name}, crushing them for `
        },
        'drain': {
            damageType: 'magical',
            damageValue: 80,
            action: `${player.name} pulls the life force out of ${enemy.name}, burning away part of their soul for `
        },
        'bite': {
            damageType: 'physical',
            damageValue: 100,
            action: `${player.name} ferociously bites ${enemy.name}, causing `
        },
        'slash': {
            damageType: 'physical',
            damageValue: 100,
            action: `${player.name} slashes ${enemy.name}, slicing them for `
        },
        'martial_strike': {
            damageType: 'physical',
            damageValue: (player) => {
                let multiplier = 1.2;
                if (enemy.status.physicalATKBoost < 0) {
                    multiplier = 1.8;
                }
                return player.stats.physicalATK * multiplier;
            },
            action: `${player.name} strikes ${enemy.name} dexterously with their weapon, dealing `
        },
        'disarm': {
            damageType: 'physical',
            damageValue: 0,
            action: `${player.name} knocks ${enemy.name}'s weapons aside, hurting them for `,
            debuff: {
                type: 'physicalATKBoost',
                value: -20,
                duration: 2
            }
        },
        'fortify': {
            damageType: null,
            damageValue: 0,
            action: `${player.name} steels their body and mind, significantly increasing their resistance to Physical Damage for 3 turns.`,
            buff: {
                type: 'physicalDEFBoost',
                value: 300,
                duration: 3
            }
        },
        'breakout': {
            damageType: 'physical',
            damageValue: 0,
            action: `${player.name} moves from a defensive stance and delivers a powerful strike to ${enemy.name}, hurting them for `
        },
        'savage_strikes': {
            damageType: 'physical',
            damageValue: 160,
            action: `${player.name} attacks ${enemy.name} with multiple savage blows, eviscerating them for `,
            selfDamage: 3
        },
        'fury': {
            damageType: null,
            damageValue: 0,
            action: `${player.name}'s rage from being hurt is boosting their Physical attack for 1 turn.`,
            buff: {
                type: 'physicalATKBoost',
                value: 15,
                duration: 1
            }
        },
        'frenzy': {
            damageType: 'physical',
            damageValue: (player) => {
                let missingHpPercent = 1 - (player.stats.hp / player.stats.hpMax);
                return 200 + (2 * missingHpPercent * player.stats.physicalATK);
            },
            action: `${player.name} unleashes a frenzy of strikes on ${enemy.name}, leaving them bloodied for `,
            xpGain: (player) => Math.round(0.04 * missingHpPercent(player) * player.stats.hpMax)
        },
        'blood_frenzy': {
            damageType: 'physical',
            damageValue: (player) => {
                let missingHPPercentage = (1 - (player.stats.hp / player.stats.hpMax)) * 100;
                return 200 + (2 * missingHPPercentage);
            },
            action: `${player.name} unleashes a frenzy of strikes on ${enemy.name}, leaving them bloodied for `,
            healthRecovery: player => player.stats.hpMax * 0.04
        },
        'spiritblade': {
            damageType: 'magical',
            damageValue: 1.9 * player.stats.magicATK,
            action: `${player.name} swings a blade of energy at ${enemy.name}, cleaving them with arcane power for `,
            buff: {
                type: 'magicDEFBoost',
                value: 200,
                duration: 1
            }
        },
        'arcane_barrier': {
            damageType: null,
            damageValue: 0,
            action: `${player.name} focuses a layer of arcane energy around themselves, significantly increasing their Magic Defense for 3 turns.`,
            buff: {
                type: 'magicDEFBoost',
                value: 200,
                duration: 3
            }
        },
        'fireball': {
            damageType: 'magical',
            damageValue: 1.5 * player.stats.magicATK,
            action: `${player.name} throws an incendiary orb that explodes on ${enemy.name}, scorching them for `,
            debuff: {
                type: 'burn',
                value: 10,
                duration: 2
            }
        },
        'incinerate': {
            damageType: 'magical',
            damageValue: (ability, player) => {
                let spentMana = ability.mpCost;
                return (spentMana * 0.04) * player.stats.magicATK;
            },
            action: `${player.name} unleashes a devastating beam of power into ${enemy.name}, obliterating them for `
        },
        'chilling_blast': {
            damageType: 'magical',
            damageValue: 0.8 * player.stats.magicATK,
            action: `${player.name} blasts ${enemy.name} with ice shards, dealing `,
            debuff: {
                type: 'speed',
                value: -50,
                duration: 4
            }
        },
        'ice_spear': {
            damageType: 'magical',
            damageValue: 2.2 * player.stats.magicATK,
            action: `${player.name} propels a massive ice spear at ${enemy.name}, impaling them for `,
            stunChance: 0.3
        },
        'noxious_cloud': {
            damageType: null,
            damageValue: 0,
            action: `${player.name} conjures toxic vapours around ${enemy.name}, poisoning them.`,
            debuff: {
                type: 'poison',
                value: 20,
                duration: 5
            }
        },
        'putrefy': {
            damageType: 'magical',
            damageValue: 2.0 * player.stats.magicATK,
            action: `${player.name} dissolves the innards of ${enemy.name}, liquefying them for `,
            debuff: {
                type: 'poison',
                value: 30,
                duration: 1
            }
        },
        'thunderclap': {
            damageType: 'magical',
            damageValue: 1.2 * player.stats.magicATK,
            action: `${player.name} smacks the enemy with a massive thunderclap, concussing ${enemy.name} for `,
            debuff: {
                type: 'stun',
                duration: 1
            }
        },
        'electric_whip': {
            damageType: 'magical',
            damageValue: player.stats.magicATK,
            action: `${player.name} whips the enemy with an electric coil, electrocuting ${enemy.name} for `
        },
        'nimble': {
            damageType: null,
            damageValue: 0,
            action: '',
            buff: {
                type: 'physicalDEFBoost',
                value: player.stats.spd * 2
            }
        }
    };

    const effect = abilityEffectMap[ability.name.toLowerCase().replace(/\s/g, '_')];
    if (effect) {
        if (effect.damageType === 'physical') {
            damage = handlePhysicalAttack(player, enemy, effect.damageValue);
        } else if (effect.damageType === 'magical') {
            damage = handleMagicalAttack(player, enemy, effect.damageValue);
        }
        combatLog.push(effect.action + damage + ' damage.');
    } else {
        combatLog.push('Ability effect not implemented.');
    }
    return damage;
}

function getRandomEnemyAbility(enemy) {
    if (enemy.abilities.length === 1) {
        return AbilityManager.getInstance().getAbilityById(enemy.abilities[0]);
    } else if (enemy.abilities.length > 1) {
        const randomAbilityIndex = Math.floor(Math.random() * enemy.abilities.length);
        return AbilityManager.getInstance().getAbilityById(enemy.abilities[randomAbilityIndex]);
    }
    return null;
}

function handleEnemyDefeat(interaction, player, enemy, combatLog, regionManager, regionId, locationId, roomId) {
    const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
    if (enemy.dropItem && Math.random() < enemy.dropChance) {
        const itemManager = ItemManager.getInstance();
        let droppedItem;

        const dropItemType = enemy.dropItemType;
        switch (dropItemType) {
            case ItemType.MATERIAL:
                droppedItem = itemManager.getItemDataById(enemy.dropItem);
                break;
            case ItemType.CONSUMABLE:
                droppedItem = itemManager.getConsumableDataById(enemy.dropItem);
                break;
            case ItemType.EQUIPMENT:
                droppedItem = itemManager.getEquipmentDataById(enemy.dropItem);
                break;
            default:
                console.log("Unknown item type for drop.");
                break;
        }

        if (droppedItem) {
            room.addItemToRoom(droppedItem);
            combatLog.push(`${enemy.name} dropped ${droppedItem.name}!`);
        }
    }

    if (enemy.name === 'Kala the Enlightened') {
        handleQuestCompletion(interaction.user.id, player.id, "Enlightenment", 2, enemy.name, combatLog);
    } else if (enemy.name === 'Arunashti the Sphynx') {
        handleQuestCompletion(interaction.user.id, player.id, "Curiousity", 3, enemy.name, combatLog);
    } else if (enemy.name === 'The Old King') {
        handleQuestCompletion(interaction.user.id, player.id, "Royalty", 4, enemy.name, combatLog);
    } else if (enemy.name === 'The Wall of Ice') {
        handleQuestCompletion(interaction.user.id, player.id, "Love", null, enemy.name, combatLog);
    }

    const xpGain = enemy.xpReward;
    player.increaseCharacterXp(xpGain);
    combatLog.push(`${player.name} gained ${xpGain} XP!`);

    room.removeEnemy(enemy);
    console.log(`Before combat: hpMax: ${player.stats.hpMax}, mpMax: ${player.stats.mpMax}`);
}

function handlePhysicalAttack(applicator, receiver, intensity) {
    const baseATK = applicator.stats.physicalATK;
    const totalATK = baseATK + (applicator.status.physicalATKBoost || 0);
    const baseDEF = receiver.stats.physicalDEF;
    const totalDEF = baseDEF + (receiver.status.physicalDEFBoost || 0);

    const damageReduction = 1 - (totalDEF / (300 + totalDEF));
    let damage = totalATK * damageReduction;
    damage *= (intensity / 100);
    damage = Math.round(damage);
    receiver.stats.applyDamage(damage);
    return damage;
}

function handleMagicalAttack(applicator, receiver, intensity) {
    const baseMAG = applicator.stats.magicATK;
    const totalMAG = baseMAG + (applicator.status.magicATKBoost || 0);
    const baseMDEF = receiver.stats.magicDEF;
    const totalMDEF = baseMDEF + (receiver.status.magicDEFBoost || 0);

    const magDamageReduction = 1 - (totalMDEF / (300 + totalMDEF));
    let damage = totalMAG * magDamageReduction;
    damage *= (intensity / 100);
    damage = Math.round(damage);
    receiver.stats.applyDamage(damage);
    return damage;
}

export async function sendCombatLog(interaction, combatLog) {
    for (let i = 0; i < combatLog.length; i++) {
        const embed = new EmbedBuilder().setDescription(combatLog[i]).setColor(0xff0000);
        await interaction.followUp({ embeds: [embed], ephemeral: true });
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s
    }
}

export async function sendAbilityButtons(interaction, player, enemy) {
    const actionRows = [];
    let row = new ActionRowBuilder();

    player.abilities.forEach((ability, index) => {
        const abilityButton = new ButtonBuilder()
            .setCustomId(`attack_${ability.name.toLowerCase().replace(/\s/g, '_')}_${enemy.name}`)
            .setLabel(ability.name)
            .setStyle(ButtonStyle.Primary);

        row.addComponents(abilityButton);
        if ((index + 1) % 5 === 0 || index === player.abilities.length - 1) {
            actionRows.push(row);
            row = new ActionRowBuilder();
        }
    });

    const embed = new EmbedBuilder()
        .setTitle(`Combat with ${enemy.name}`)
        .setDescription('Select an ability to use in this turn.')
        .setColor(0x00FF00);

    await interaction.followUp({ embeds: [embed], components: actionRows, ephemeral: true });
}

const handleQuestCompletion = (userId, characterId, questName, nextQuestId, enemyName, combatLog) => {
    const questManager = QuestManager.getInstance();
    const itemManager = ItemManager.getInstance();
    const inventoryManager = InventoryManager.getInstance();

    const questId = questManager.getQuestIdByName(questName);
    if (!questId) return;

    const quest = questManager.getQuestByID(userId, characterId, questId);
    if (quest && quest.status === QuestStatus.IN_PROGRESS) {
        quest.complete();
        combatLog.push(`Quest '${quest.name}' completed!`);
    }

    const rewardText = questManager.completeQuest(userId, characterId, questId);
    if (rewardText) combatLog.push(rewardText);

    const nextQuestText = questManager.startNextQuest(userId, characterId, nextQuestId);
    if (nextQuestText) combatLog.push(nextQuestText);

    const rewardKey = quest?.rewards?.key;
    if (rewardKey) {
        const keyData = itemManager.getKeyDataById(Number(rewardKey));
        if (keyData) {
            const key = new Key(keyData);
            inventoryManager.addItem(userId, characterId, key, 1);
        }
    }
};

export const attackCommands = {
    attack: attackCommand
};