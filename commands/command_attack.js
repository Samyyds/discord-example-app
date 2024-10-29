import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager, CombatSession } from '../manager/character_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { RegionManager } from "../manager/region_manager.js";
import { AbilityManager } from "../manager/ability_manager.js";
import { QuestManager } from "../manager/quest_manager.js";
import { ItemManager } from "../manager/item_manager.js";
import { sendErrorMessage } from "../util/util.js";
import { ItemType, QuestStatus } from "../data/enums.js";

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

        // const combatSession = new CombatSession();
        // combatSession.characters = [activeChar, enemy]; 

        await interaction.editReply({ content: `Combat started with ${enemy.name}!` });
        await sendAbilityButtons(interaction, activeChar, enemy);

        // combatSession.nextRound();

        // if (!combatSession.active || !enemy.alive || !activeChar.alive) {
        //     combatSession.endCombat();
        //     await interaction.editReply({ content: 'Combat ended.' });
        // }
     
    } catch (error) {
        console.error('Error in attackCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

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

    let damage = 0;
    switch (ability.name.toLowerCase().replace(/\s/g, '_')) {
        case 'punch':
            damage = handlePhysicalAttack(player, enemy, 80);
            combatLog.push(`${player.name} swings their fist at ${enemy.name}, crushing them for ${damage} damage.`);
            break;
        case 'drain':
            damage = handleMagicalAttack(player, enemy, 80);
            combatLog.push(`${player.name} pulls the life force out of ${enemy.name}, burning away part of their soul for ${damage} damage.`);
            break;
        case 'bite':
            damage = handlePhysicalAttack(player, enemy, 100);
            combatLog.push(`${player.name} ferociously bites ${enemy.name}, causing ${damage} damage.`);
            break;
        case 'slash':
            damage = handlePhysicalAttack(player, enemy, 100);
            combatLog.push(`${player.name} slashes ${enemy.name}, slicing them for ${damage} damage.`);
            break;
        case 'martial_strike':
            let multiplier = 1.2;
            if (enemy.status.physicalATKBoost < 0) {
                multiplier = 1.8;
            }
            damage = handlePhysicalAttack(player, enemy, player.stats.physicalATK * multiplier);
            combatLog.push(`${player.name} strikes ${enemy.name} dexterously with their weapon, dealing ${damage} damage.`);
            break;
        case 'disarm':
            if (enemy.status.physicalATKBoost === undefined) {
                enemy.status.physicalATKBoost = 0;
            }
            enemy.status.physicalATKBoost -= 20;
            enemy.applyDebuff({
                type: 'physicalATKBoost',
                value: -20,
                duration: 2,
            });
            combatLog.push(`${player.name} knocks ${enemy.name}'s weapons aside, hurting them for ${damage} damage. Their Physical Damage has been lowered for 2 turns.`);
            break;
        case 'fortify':
            player.applyBuff({
                type: 'physicalDEFBoost',
                value: 300,
                duration: 3
            });
            combatLog.push(`${player.name} steels their body and mind, significantly increasing their resistance to Physical Damage for 3 turns.`);
            break;
        case 'breakout':
            player.clearAllDebuffs();
            combatLog.push(`${player.name} moves from a defensive stance and delivers a powerful strike to ${enemy.name}, hurting them for ${damage} damage.`);
            break;
        case 'savage_strikes':
            damage = handlePhysicalAttack(player, enemy, 160);
            player.stats.hp -= 3;
            combatLog.push(`${player.name} attacks ${enemy.name} with multiple savage blows, eviscerating them for ${damage} damage.`);
            break;
        case 'fury':
            player.applyBuff({
                type: 'physicalATKBoost',
                value: 15,
                duration: 1
            });
            combatLog.push(`${player.name}'s rage from being hurt is boosting their Physical attack for 1 turn.`);
            break;
        case 'frenzy':
            let missingHpPercent = 1 - (player.stats.hp / player.stats.hpMax);
            let frenzyDamage = 200 + (2 * missingHpPercent * player.stats.physicalATK);
            damage = handlePhysicalAttack(player, enemy, frenzyDamage);
            player.increaseCharacterXp(Math.round(0.04 * missingHpPercent * player.stats.hpMax));
            combatLog.push(`${player.name} unleashes a frenzy of strikes on ${enemy.name}, leaving them bloodied for ${damage} damage.`);
            break;
        case 'blood_frenzy':
            let missingHPPercentage = (1 - (player.stats.hp / player.stats.hpMax)) * 100;
            let additionalDamage = 2 * missingHPPercentage;
            damage = handlePhysicalAttack(player, enemy, 200 + additionalDamage);
            let healthRecovery = player.stats.hpMax * 0.04;
            player.stats.hp += healthRecovery;
            combatLog.push(`${player.name} unleashes a frenzy of strikes on ${enemy.name}, leaving them bloodied for ${damage} damage. Drinking the blood of their enemies recovers a portion of their health.`);
            break;
        case 'spiritblade':
            damage = handleMagicalAttack(player, enemy, 1.9 * player.stats.magicATK);
            player.applyBuff({ type: 'magicDEFBoost', value: 200, duration: 1 });
            combatLog.push(`${player.name} swings a blade of energy at ${enemy.name}, cleaving them with arcane power for ${damage} damage.`);
            break;
        case 'arcane_barrier':
            player.applyBuff({ type: 'magicDEFBoost', value: 200, duration: 3 });
            combatLog.push(`${player.name} focuses a layer of arcane energy around themselves, significantly increasing their Magic Defense for 3 turns.`);
            break;
        case 'fireball':
            damage = handleMagicalAttack(player, enemy, 1.5 * player.stats.magicATK);
            enemy.applyDebuff({ type: 'burn', value: 10, duration: 2 });
            combatLog.push(`${player.name} throws an incendiary orb that explodes on ${enemy.name}, scorching them for ${damage}.`);
            break;
        case 'incinerate':
            let spentMana = ability.mpCost;
            damage = handleMagicalAttack(player, enemy, (spentMana * 0.04) * player.stats.magicATK);
            combatLog.push(`${player.name} unleashes a devastating beam of power into ${enemy.name}, obliterating them for ${damage} damage.`);
            break;
        case 'chilling_blast':
            damage = handleMagicalAttack(player, enemy, 0.8 * player.stats.magicATK);
            enemy.applyDebuff({ type: 'speed', value: -50, duration: 4 });
            combatLog.push(`${player.name} blasts ${enemy.name} with ice shards, dealing ${damage} damage and slowing them for 4 turns.`);
            break;
        case 'ice_spear':
            damage = handleMagicalAttack(player, enemy, 2.2 * player.stats.magicATK);
            if (Math.random() < 0.3) {
                enemy.applyDebuff({ type: 'stun', duration: 1 });
            }
            combatLog.push(`${player.name} propels a massive ice spear at ${enemy.name}, impaling them for ${damage} damage.`);
            break;
        case 'noxious_cloud':
            enemy.applyDebuff({ type: 'poison', value: 20, duration: 5 });
            combatLog.push(`${player.name} conjures toxic vapours around ${enemy.name}, poisoning them.`);
            break;
        case 'putrefy':
            damage = handleMagicalAttack(player, enemy, 2.0 * player.stats.magicATK);
            enemy.applyDebuff({ type: 'poison', value: 30, duration: 1 });
            combatLog.push(`${player.name} dissolves the innards of ${enemy.name}, liquefying them for ${damage} damage. They take additional damage for 1 more turn.`);
            break;
        case 'thunderclap':
            damage = handleMagicalAttack(player, enemy, 1.2 * player.stats.magicATK);
            enemy.applyDebuff({ type: 'stun', duration: 1 });
            combatLog.push(`${player.name} smacks the enemy with a massive thunderclap, concussing ${enemy.name} for ${damage} damage. They are also stunned.`);
            break;
        case 'electric_whip':
            damage = handleMagicalAttack(player, enemy, player.stats.magicATK);
            combatLog.push(`${player.name} whips the enemy with an electric coil, electrocuting ${enemy.name} for ${damage} damage and siphoning some of their mana.`);
            break;
        case 'nimble':
            player.applyBuff({ type: 'physicalDEFBoost', value: player.stats.spd * 2 });
            break;
        default:
            combatLog.push('Ability effect not implemented.');
            return { combatLog, playerAlive: true, enemyAlive: true };
    }

    combatLog.push(`${player.name}'s remaining HP: ${player.stats.hp}.`);
    combatLog.push(`${enemy.name}'s remaining HP: ${enemy.stats.hp}`);

    if (enemy.stats.hp <= 0) {
        combatLog.push(`${enemy.name} is defeated!`);
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

            if (enemy.name === "Failed Sacrifice") {
                const questManager = QuestManager.getInstance();
                const questId = questManager.getQuestIdByName("Failed Sacrifice");
                if (questId) {
                    const quest = questManager.getQuestByID(interaction.user.id, player.id, questId);
                    if (quest) {
                        if (quest.status === QuestStatus.IN_PROGRESS) {
                            quest.complete();
                            combatLog.push(`Quest '${quest.name}' completed!`);
                        }
                    }
                }
            }
        }

        const xpGain = 30;
        player.increaseCharacterXp(xpGain);
        combatLog.push(`${player.name} gained ${xpGain} XP!`);

        room.removeEnemy(enemy);
        console.log(`Before combat: hpMax: ${player.stats.hpMax}, mpMax: ${player.stats.mpMax}`);
        return { combatLog, playerAlive: true, enemyAlive: false };
    }

    let enemyAbility;
    if (enemy.abilities.length === 1) {
        enemyAbility = abilityManager.getAbilityById(enemy.abilities[0]);
    } else if (enemy.abilities.length > 1) {
        const randomAbilityIndex = Math.floor(Math.random() * enemy.abilities.length);
        enemyAbility = abilityManager.getAbilityById(enemy.abilities[randomAbilityIndex]);
    }

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

export const attackCommands = {
    attack: attackCommand
};
