import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager, CombatSession } from '../manager/character_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { RegionManager } from "../manager/region_manager.js";
import { AbilityManager } from "../manager/ability_manager.js";
import { QuestManager } from "../manager/quest_manager.js";
import { ItemManager, Key } from "../manager/item_manager.js";
import { sendErrorMessage, parseEnemyDialogue } from "../util/util.js";
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

        const enemyNameInput = interaction.options.getString('enemy');
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
        console.log(`encounter count: ${characterManager.getEnemyEncounterCount(activeChar.id, enemy.id)}`);

        const isFirstEncounter = characterManager.isFirstEncounterWithBoss(activeChar.id, enemy.id);
        characterManager.trackEnemy(activeChar.id, enemy.id);

        const questManager = QuestManager.getInstance();
        if (isFirstEncounter && enemy.encounterDialogue !== null) {
            await displayEnemyDialogue(interaction, enemy.encounterDialogue, 0x00FF00);
            questManager.startQuest(interaction.user.id, activeChar.id, enemy.questId);
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

                combatSession.nextRound();

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
        if (enemy.defeatDialogue) {
            pushEnemyDialogueToCombatLog(enemy.defeatDialogue, combatLog);
        }

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
        combatLog.push("Your soul will be sent to the Moku'ah Clinic.");

        if (enemy.defeatedDialogue) {
            pushEnemyDialogueToCombatLog(enemy.defeatedDialogue, combatLog);
        }

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
            damageValue: 80, // 80%
            action: `You swing your fist at {enemy}, crushing them for {TYPE+DMG} damage.`
        },
        'drain': {
            damageType: 'magical',
            damageValue: 80,
            action: `You pull the life force out of {enemy}, burning away part of their soul for {TYPE+DMG} damage.`
        },
        'bite': {
            damageType: 'physical',
            damageValue: 80,
            action: `You ferociously bite {enemy}, causing {TYPE+DMG} damage.`
        },
        'slash': {
            damageType: 'physical',
            damageValue: 100,
            action: `You slash {enemy}, slicing them for {TYPE+DMG} damage.`
        },
        'martial_strike': {
            damageType: 'physical',
            damageValue: (player, enemy) => player.stats.physicalATK * 1.2,
            action: `You strike {enemy} dextrously with your weapon, dealing {TYPE+DMG} damage.`
        },
        'disarm': {
            damageType: 'physical',
            damageValue: 0,
            action: `You knock {enemy}'s weapons aside, hurting them for {TYPE+DMG}. Their Physical Damage has been lowered for 2 turns.`,
            debuff: { type: 'physicalATKBoost', value: -20, duration: 2 }
        },
        'fortify': {
            damageType: null,
            damageValue: 0,
            action: `You steel your body and mind, significantly increasing your resistance to Physical Damage for 3 turns.`,
            buff: { type: 'physicalDEFBoost', value: 300, duration: 3 }
        },
        'breakout': {
            damageType: 'physical',
            damageValue: (player) => player.status.physicalDEFBoost || 0,
            action: `You move from a defensive stance and deliver a powerful strike to {enemy}, hurting them for {TYPE+DMG} damage.`
        },
        'savage_strikes': {
            damageType: 'physical',
            damageValue: 160,
            action: `You attack {enemy} with multiple savage blows, eviscerating them for {TYPE+DMG} damage.`
        },
        'fury': {
            damageType: null,
            damageValue: 0,
            action: `Rage from being hurt is boosting your Physical attack for 1 turn.`,
            buff: { type: 'physicalATKBoost', value: 15, duration: 1 }
        },
        'frenzy': {
            damageType: 'physical',
            damageValue: (player) => {
                const missingHpRatio = 1 - (player.stats.hp / player.stats.hpMax);
                return player.stats.physicalATK * 2.4 + player.stats.physicalATK * missingHpRatio;
            },
            action: `You unleash a frenzy of strikes on {enemy}, leaving them bloodied for {TYPE+DMG} damage.`
        },
        'blood_frenzy': {
            damageType: 'physical',
            damageValue: (player) => {
                const missingHpRatio = 1 - (player.stats.hp / player.stats.hpMax);
                return player.stats.physicalATK * 2.4 + player.stats.physicalATK * missingHpRatio;
            },
            action: `You unleash a frenzy of strikes on {enemy}, leaving them bloodied for {TYPE+DMG} damage. Drinking the blood of your enemies recovers a portion of your health.`,
            healthRecovery: (player) => player.stats.hpMax * 0.04
        },
        'spiritblade': {
            damageType: 'magical',
            damageValue: 190,
            action: `You swing a blade of energy at {enemy}, cleaving them with arcane power for {TYPE+DMG} damage.`,
            buff: { type: 'magicDEFBoost', value: 200, duration: 1 }
        },
        'arcane_barrier': {
            damageType: null,
            damageValue: 0,
            action: `You focus a layer of arcane energy around you, significantly increasing your Magic Defense for 3 turns.`,
            buff: { type: 'magicDEFBoost', value: 200, duration: 3 }
        },
        'fireball': {
            damageType: 'magical',
            damageValue: 150,
            action: `You throw an incendiary orb that explodes on {enemy}, scorching them for {TYPE+DMG}.`
        },
        'incinerate': {
            damageType: 'magical',
            damageValue: (ability, player) => {
                let spentMana = ability.mpCost;
                return spentMana * 0.04 * player.stats.magicATK;
            },
            action: `You unleash a devastating beam of power into {enemy}, obliterating them for {TYPE+DMG}.`
        },
        'chilling_blast': {
            damageType: 'magical',
            damageValue: 80,
            action: `You blast {enemy} with ice shards, dealing {TYPE+DMG} and slowing them for 4 turns.`,
            debuff: { type: 'speed', value: -50, duration: 4 }
        },
        'ice_spear': {
            damageType: 'magical',
            damageValue: 220,
            action: `You propel a massive ice spear at {enemy}, impaling them for {TYPE+DMG}.`
        },
        'noxious_cloud': {
            damageType: null,
            damageValue: 0,
            action: `You conjure toxic vapours around {enemy}, poisoning them {TYPE+DMG}.`,
            debuff: { type: 'poison', value: 20, duration: 5 }
        },
        'putrefy': {
            damageType: 'magical',
            damageValue: 200,
            action: `You dissolve the innards of {enemy}, liquefying them for {TYPE+DMG} damage. They take additional damage for 1 more turn.`,
            debuff: { type: 'poison', value: 30, duration: 1 }
        },
        'thunderclap': {
            damageType: 'magical',
            damageValue: 120,
            action: `You smack the enemy with a massive thunderclap, concussing them for {TYPE+DMG}. They are also stunned.`,
            debuff: { type: 'stun', duration: 1 }
        },
        'electric_whip': {
            damageType: 'magical',
            damageValue: 100,
            action: `You whip {enemy} with an electric coil, electrocuting them for {TYPE+DMG} and siphoning some of their mana.`
        },
        'forlorn_melody': {
            damageType: null,
            damageValue: 0,
            action: `You play a forlorn melody, reducing your opponent's Magical defenses by 50%.`,
            debuff: { type: 'magicDEFBoost', value: (enemy) => -enemy.stats.magicDEF * 0.5, duration: -1 }
        },
        'anthem_recital': {
            damageType: null,
            damageValue: 0,
            action: `You recite a bolstering anthem, increasing your Physical attack by 50%.`,
            buff: { type: 'physicalATKBoost', value: (player) => player.stats.physicalATK * 0.5, duration: -1 }
        },
        'austere_sermon': {
            damageType: null,
            damageValue: 0,
            action: `You declare an austere sermon, reducing your opponent's Physical attack by 50%.`,
            debuff: { type: 'physicalATKBoost', value: (enemy) => -enemy.stats.physicalATK * 0.5, duration: -1 }
        },
        'luminous_shimmer': {
            damageType: null,
            damageValue: 0,
            action: `You siphon magic from the air, reducing your opponent's Magical attack by 50%.`,
            debuff: { type: 'magicATKBoost', value: (enemy) => -enemy.stats.magicATK * 0.5, duration: -1 }
        },
        'neon_brilliance': {
            damageType: null,
            damageValue: 0,
            action: `You empower yourself with light magic, increasing your Magical attack by 50%.`,
            buff: { type: 'magicATKBoost', value: (player) => player.stats.magicATK * 0.5, duration: -1 }
        },
        'salty_ballad': {
            damageType: 'mixed',
            damageValue: (player) => {
                const physical = player.stats.physicalATK * 1.5;
                const magical = player.stats.magicATK * 1.5;
                return physical + magical;
            },
            action: `You unleash a Salty Ballad, dealing {TYPE+DMG} damage and slowing yourself by 50%.`,
            selfDebuff: { type: 'speed', value: (player) => -player.stats.spd * 0.5, duration: -1 }
        },
        'glitter_flash': {
            damageType: 'magical',
            damageValue: 30,
            action: `You unleash a blinding flash, dealing {TYPE+DMG} while also reducing the opponent's speed by 50%.`,
            debuff: { type: 'speed', value: -50, duration: -1 }
        },
        'pulverize': {
            damageType: 'physical',
            damageValue: 90,
            action: `You pulverise {enemy} like meat, dealing {TYPE+DMG} damage and reducing their attack by 10%.`,
            debuff: { type: 'physicalATKBoost', value: -10, duration: -1 }
        },
        'batter_and_bruise': {
            damageType: 'physical',
            damageValue: 90,
            action: `You batter {enemy} with brute force, dealing {TYPE+DMG} damage and reducing their speed by 10%.`,
            debuff: { type: 'speed', value: -10, duration: -1 }
        },
        'cauldron_masala': {
            damageType: null,
            damageValue: 0,
            action: `You brew and down a vitae broth, healing yourself for {TYPE+DMG} of your total health.`,
            heal: { 
              type: 'hp', 
              value: (player) => player.stats.hpMax * ((10 + player.skills.skills.cooking.level / 2.5) / 100) 
            }
        },
        'kindle_hearth': {
            damageType: null,
            damageValue: 0,
            action: `You kindle the eternal flame within, increasing your Magical defense by your (Gathering level * 5).`,
            buff: { type: 'magicDEFBoost', value: (player) => player.skills.skills.gathering * 5, duration: -1 }
        },
        'palpitate': {
            damageType: 'magical',
            damageValue: (player) => player.stats.magicATK * ((100 + player.skills.skills.smithing.level) / 100),
            action: `You hurl a lance of fire at {enemy}, burning them for {TYPE+DMG} damage.`
        },
        'pelt_poach': {
            damageType: 'physical',
            damageValue: (player, enemy) => enemy.stats.hp * ((10 + player.skills.skills.smithing.level / 2) / 100),
            action: `You gruesomely flense {enemy}, dealing damage equal to {TYPE+DMG} of their current health.`
        },
        'pitfall': {
            damageType: 'physical',
            damageValue: 100,
            action: `You release a pitfall trap beneath {enemy}, dealing {TYPE+DMG} damage and reducing their speed by 50%.`,
            debuff: { type: 'speed', value: -50, duration: -1 }
        }
    };

    const effectKey = ability.name.toLowerCase().replace(/\s/g, '_');
    const effect = abilityEffectMap[effectKey];
    if (effect) {
        if (effect.damageType !== null) {

            if (typeof effect.damageValue === 'function') {
                damage = effect.damageValue(player, enemy, ability);
            } else {
                damage = effect.damageValue;
                if (effect.damageType === 'physical') {
                    damage = handlePhysicalAttack(player, enemy, damage);
                } else if (effect.damageType === 'magical') {
                    damage = handleMagicalAttack(player, enemy, damage);
                } else if (effect.damageType === 'mixed') {
                    const physicalDamage = handlePhysicalAttack(player, enemy, damage / 2);
                    const magicalDamage = handleMagicalAttack(player, enemy, damage / 2);
                    damage = physicalDamage + magicalDamage;
                }
            }
            let damageTypeStr = "";
            if (effect.action.includes("{TYPE+DMG} damage")) {
                damageTypeStr = `${damage}`;
                if (effect.damageType === 'physical') {
                    damageTypeStr += " physical";
                } else if (effect.damageType === 'magical') {
                    damageTypeStr += " magical";
                } else if (effect.damageType === 'mixed') {
                    damageTypeStr += " (physical and magical)";
                }
            } else {
                damageTypeStr = `${damage}`;
                if (effect.damageType === 'physical') {
                    damageTypeStr += " physical damage";
                } else if (effect.damageType === 'magical') {
                    damageTypeStr += " magical damage";
                } else if (effect.damageType === 'mixed') {
                    damageTypeStr += " (physical and magical) damage";
                }
            }
            const finalMessage = effect.action
                .replace('{enemy}', enemy.name)
                .replace('{TYPE+DMG}', damageTypeStr);
            combatLog.push(finalMessage);
        } else {

            let finalMessage = effect.action.replace('{enemy}', enemy.name);
            if (effect.heal && typeof effect.heal.value === 'function') {
                const healAmount = effect.heal.value(player);
                finalMessage = finalMessage.replace('{TYPE+DMG}', `${healAmount} healing`);
            } else {

                finalMessage = finalMessage.replace('{TYPE+DMG}', '');
            }
            combatLog.push(finalMessage);
        }
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
    const previousLevel = player.level;
    player.increaseCharacterXp(xpGain);
    combatLog.push(`${player.name} gained ${xpGain} XP!`);

    if (player.level > previousLevel) {
        combatLog.push(`${player.name} leveled up! Now at level ${player.level}.`);
    }

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
    // for (let i = 0; i < combatLog.length; i++) {
    //     const embed = new EmbedBuilder().setDescription(combatLog[i]).setColor(0xff0000);
    //     await interaction.followUp({ embeds: [embed], ephemeral: true });
    //     await new Promise(resolve => setTimeout(resolve, 1000)); // 1s
    // }
    const logText = combatLog.join('\n');
    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(logText);
    await interaction.followUp({ embeds: [embed], ephemeral: true });
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

async function displayEnemyDialogue(interaction, dialogueText, color = 0xFF0000) {
    if (dialogueText) {
        const segments = parseEnemyDialogue(dialogueText);
        for (const segment of segments) {
            const embed = new EmbedBuilder()
                .setColor(color)
                .setDescription(segment);
            await interaction.followUp({ embeds: [embed], ephemeral: true });
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

function pushEnemyDialogueToCombatLog(dialogueText, combatLog) {
    if (dialogueText) {
        const segments = parseEnemyDialogue(dialogueText);
        for (const segment of segments) {
            combatLog.push(segment);
        }
    }
    return combatLog;
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