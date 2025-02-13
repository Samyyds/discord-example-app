import mysql from 'mysql2/promise';
import { serializeObject } from "../util/util.js";
import { Character, CharacterManager, SkillContainer, StatContainer, StatusContainer } from "../manager/character_manager.js";
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { InventoryManager } from "../manager/inventory_manager.js";
import { ItemManager, Item, Consumable, Equipment, Fish, Key } from "../manager/item_manager.js";
import { QuestManager } from "../manager/quest_manager.js";
import { ItemType } from "../data/enums.js";

const dbConfig = {
    host: 'na01-sql.pebblehost.com',
    user: 'customer_766436_mm',
    database: 'customer_766436_mm',
    password: 'vJTYzplW@T7kuJikp6x@',
    waitForConnections: true,
    connectionLimit: 30,
    queueLimit: 90
};

class MysqlDB {
    static pool = null;

    static async getPool() {
        if (!MysqlDB.pool) {
            try {
                MysqlDB.pool = await mysql.createPool(dbConfig);
                console.log('Database connection pool established');
            } catch (error) {
                console.error('Failed to establish database connection pool:', error);
                throw error;
            }
        }
        return MysqlDB.pool;
    }

    static async getConnection() {
        const pool = await MysqlDB.getPool();
        return pool.getConnection();
    }

    static async closeConnection() {
        if (MysqlDB.pool) {
            await MysqlDB.pool.end();
            MysqlDB.pool = null;
            console.log('Database connection pool closed');
        }
    }
}

async function hasCharacters() {
    const connection = await MysqlDB.getConnection();
    try {
        const [rows] = await connection.execute(`SELECT COUNT(*) AS count FROM ${process.env.CHARACTERS_DB} `);
        return rows[0].count > 0;
    } catch (error) {
        console.error('Failed to check characters:', error);
        throw error;
    } finally {
        connection.release();
    }
}

async function saveCharacterData(userId, character, location) {
    const connection = await MysqlDB.getConnection();
    const { regionId, locationId, roomId } = location;
    try {
        const sql = `
            INSERT INTO ${process.env.CHARACTERS_DB} (user_id, id, name, level, class_id, race_id, personality_id, xp, battle_bar, loot_quality, abilities, stats, skills, status, gold, region_id, location_id, room_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const { id, name, level, classId, raceId, personalityId, xp, battleBar, lootQuality, abilities, stats, skills, status, gold } = character;
        const battleBarJson = JSON.stringify(battleBar);
        const abilitiesJson = JSON.stringify(abilities);
        const serializedStats = JSON.stringify(character.stats);
        const serializedSkills = JSON.stringify(character.skills.skills);
        const serializedStatus = JSON.stringify(character.status);

        const result = await connection.execute(sql, [
            userId.toString(), id, name, level, classId, raceId, personalityId, xp,
            battleBarJson, lootQuality, abilitiesJson,
            serializedStats, serializedSkills, serializedStatus, gold,
            regionId, locationId, roomId
        ]);
        console.log('Character saved:', result);
    } catch (error) {
        console.error('Failed to save character:', error);
    } finally {
        connection.release();
    }
}

async function saveCharacterLocation(userId, characterId, location) {
    const connection = await MysqlDB.getConnection();

    try {
        const sql = `
            UPDATE ${process.env.CHARACTERS_DB}
            SET region_id = ?, location_id = ?, room_id = ?
            WHERE user_id = ? AND id = ?
        `;

        const { regionId, locationId, roomId } = location;

        const [result] = await connection.execute(sql, [regionId, locationId, roomId, userId.toString(), characterId]);

        if (result.affectedRows > 0) {
            console.log('Character location saved successfully.');
        } else {
            console.log('No character found to update.');
        }
    } catch (error) {
        console.error('Failed to save character location:', error);
    } finally {
        connection.release();
    }
}

async function getAllUserIds() {
    const connection = await MysqlDB.getConnection();
    try {
        const [rows] = await connection.execute(`SELECT DISTINCT user_id FROM ${process.env.CHARACTERS_DB}`);
        return rows.map(row => row.user_id);
    } catch (error) {
        console.error('Failed to get user IDs:', error);
        throw error;
    } finally {
        connection.release();
    }
}

async function loadCharactersForUser(userId) {
    const connection = await MysqlDB.getConnection();
    const charManager = CharacterManager.getInstance();
    const moveManager = PlayerMovementManager.getInstance();

    try {
        const [rows] = await connection.execute(`SELECT * FROM ${process.env.CHARACTERS_DB} WHERE user_id = ?`, [userId.toString()]);

        const characters = rows.map(row => {
            const character = new Character(
                row.id,
                row.name,
                row.level,
                row.class_id,
                row.race_id,
                row.personality_id,
                row.xp,
                JSON.parse(row.battle_bar),
                row.loot_quality,
                JSON.parse(row.abilities),
                row.gold
            );
            const statsData = JSON.parse(row.stats);
            const skillsData = JSON.parse(row.skills);
            const statusData = JSON.parse(row.status);

            character.stats = new StatContainer(
                statsData.hpMax, statsData.mpMax, statsData.hp, statsData.mp, statsData.spd,
                statsData.physicalATK, statsData.physicalDEF, statsData.magicATK, statsData.magicDEF,
                statsData.fireATK, statsData.fireDEF, statsData.lightATK, statsData.lightDEF,
                statsData.darkATK, statsData.darkDEF
            );

            character.skills = new SkillContainer(
                skillsData.mining, skillsData.smithing, skillsData.crafting, skillsData.fishing,
                skillsData.gathering, skillsData.farming, skillsData.cooking, skillsData.brewing
            );

            character.status = new StatusContainer(
                statusData.poison, statusData.bleed, statusData.physicalATKBoost,
                statusData.physicalDEFBoost, statusData.magicATKBoost, statusData.magicDEFBoost,
                statusData.fireATKBoost, statusData.fireDEFBoost, statusData.lightATKBoost,
                statusData.lightDEFBoost, statusData.darkATKBoost, statusData.darkDEFBoost
            );

            return character;
        });

        for (let i = 0; i < characters.length; i++) {
            charManager.addCharacter(userId, characters[i]);
            moveManager.setLocation(userId, characters[i].id, rows[i].region_id, rows[i].location_id, rows[i].room_id);
            await loadCharacterQuests(userId, characters[i].id);
        }

        charManager.setActiveCharacter(userId, characters[0].id);

        console.log(`Characters for user ${userId} loaded successfully.`);
    } catch (error) {
        console.error(`Failed to load characters for user ${userId}:`, error);
    } finally {
        connection.release();
    }
}

async function updateCharacterGold(userId, characterId, gold) {
    const connection = await MysqlDB.getConnection();
    try {
        const sql = `
            UPDATE ${process.env.CHARACTERS_DB}
            SET gold = ?
            WHERE user_id = ? AND id = ?
        `;
        const [result] = await connection.execute(sql, [gold, userId.toString(), characterId]);

        if (result.affectedRows > 0) {
            console.log(`Gold updated successfully for character ID ${characterId}.`);
        } else {
            console.log(`No character found with ID ${characterId} to update gold.`);
        }
    } catch (error) {
        console.error(`Failed to update gold for character ID ${characterId}:`, error);
        throw error;
    } finally {
        connection.release();
    }
}

async function getNextCharacterId() {
    const connection = await MysqlDB.getConnection();
    try {
        const [rows] = await connection.execute(`SELECT MAX(id) AS max_id FROM ${process.env.CHARACTERS_DB}`);
        const maxId = rows[0].max_id || 0;
        return maxId + 1;
    } catch (error) {
        console.error('Failed to retrieve next character ID:', error);
        throw error;
    } finally {
        connection.release();
    }
}

async function updateInventoryToDB(userId, characterId, item, quantity, operation) {
    const connection = await MysqlDB.getConnection();
    try {
        await connection.beginTransaction();

        const [existingRows] = await connection.query(
            `SELECT quantity FROM ${process.env.INVENTORY_DB} WHERE user_id = ? AND character_id = ? AND item_id = ?`,
            [userId, characterId, item.id]
        );

        let newQuantity;
        if (existingRows && existingRows.length > 0) {
            let existingQuantity = existingRows[0].quantity;
            newQuantity = operation === 'add' ? existingQuantity + quantity : existingQuantity - quantity;
        } else {
            console.log("No existing data found. Initializing new entry.");
            newQuantity = operation === 'add' ? quantity : 0;
        }

        if (newQuantity <= 0) {
            await connection.query(
                `DELETE FROM ${process.env.INVENTORY_DB} WHERE user_id = ? AND character_id = ? AND item_id = ?`,
                [userId, characterId, item.id]
            );
        } else {
            if (existingRows && existingRows.length > 0) {
                await connection.query(
                    `UPDATE ${process.env.INVENTORY_DB} SET quantity = ? WHERE user_id = ? AND character_id = ? AND item_id = ?`,
                    [newQuantity, userId, characterId, item.id]
                );
            } else {
                await connection.query(
                    `INSERT INTO ${process.env.INVENTORY_DB} (user_id, character_id, item_type, item_id, quantity) VALUES (?, ?, ?, ?, ?)`,
                    [userId, characterId, item.type, item.id, newQuantity]
                );
            }
        }

        await connection.commit();
    } catch (error) {
        console.error('Transaction failed, rolling back.', error);
        await connection.rollback();
        throw error;  // Re-throwing the error is important after a rollback
    } finally {
        connection.release();
    }
}

async function loadInventoryForUser(userId) {
    const connection = await MysqlDB.getConnection();
    try {
        const [characterInventories] = await connection.query(
            `SELECT character_id, item_type, item_id, quantity FROM ${process.env.INVENTORY_DB} WHERE user_id = ?`,
            [userId]
        );

        const itemManager = ItemManager.getInstance();
        const inventoryManager = InventoryManager.getInstance();

        for (const { character_id, item_type, item_id, quantity } of characterInventories) {
            let newItem;
            switch (item_type) {
                case ItemType.MATERIAL:
                    let itemInfo = itemManager.getItemDataById(item_id);
                    newItem = itemInfo ? new Item(itemInfo) : null;
                    break;
                case ItemType.CONSUMABLE:
                    let consumableInfo = itemManager.getConsumableDataById(item_id);
                    newItem = consumableInfo ? new Consumable(consumableInfo) : null;
                    break;
                case ItemType.EQUIPMENT:
                    let equipmentInfo = itemManager.getEquipmentDataById(item_id);
                    newItem = equipmentInfo ? new Equipment(equipmentInfo) : null;
                    break;
                case ItemType.FISH:
                    let fishInfo = itemManager.getFishDataById(item_id);
                    newItem = fishInfo ? new Fish(fishInfo) : null;
                    break;
                case ItemType.KEY:
                    let keyInfo = itemManager.getKeyDataById(item_id);
                    newItem = keyInfo ? new Key(keyInfo) : null;
                    break;
                default:
                    console.log(`Unrecognized item type for item_id: ${item_id}`);
                    newItem = null;
            }

            if (newItem) {
                const inventory = inventoryManager.getInventory(userId, character_id);
                inventory.loadItem(newItem, quantity);
            } else {
                console.log(`Item data not found or failed to instantiate for item_id: ${item_id}`);
            }
        }
    } catch (error) {
        console.error('Failed to load inventory for user:', error);
    } finally {
        connection.release();
    }
}

async function saveCharacterQuests(userId, characterId) {
    const connection = await MysqlDB.getConnection();
    const questManager = QuestManager.getInstance();
    const quests = questManager.getCharQuests(userId, characterId);

    const serializedQuests = JSON.stringify(quests.map(quest => ({
        questId: quest.id,
        status: quest.status
    })));

    try {
        const sql = `
            UPDATE ${process.env.CHARACTERS_DB}
            SET quests = ?
            WHERE user_id = ? AND id = ?
        `;
        await connection.execute(sql, [serializedQuests, userId, characterId]);
        console.log(`Quests for user ${userId}, character ${characterId} saved successfully.`);
    } catch (error) {
        console.error('Failed to save character quests:', error);
    } finally {
        connection.release();
    }
}

async function loadCharacterQuests(userId, characterId) {
    const connection = await MysqlDB.getConnection();
    const questManager = QuestManager.getInstance();

    try {
        const [rows] = await connection.execute(
            `SELECT quests FROM ${process.env.CHARACTERS_DB} WHERE user_id = ? AND id = ?`,
            [userId, characterId]
        );

        const questsData = JSON.parse(rows[0]?.quests || '[]');
        for (const questData of questsData) {
            const quest = questManager.createQuestInstance(userId, characterId, questData.questId);
            if (quest) {
                quest.status = questData.status;
                questManager.addCharQuest(userId, characterId, quest);
            }
        }

        console.log(`Quests for user ${userId}, character ${characterId} loaded successfully.`);
    } catch (error) {
        console.error(`Failed to load quests for user ${userId}, character ${characterId}:`, error);
    } finally {
        connection.release();
    }
}

export {
    MysqlDB,
    hasCharacters,
    saveCharacterData,
    getAllUserIds,
    loadCharactersForUser,
    saveCharacterLocation,
    getNextCharacterId,
    updateInventoryToDB,
    loadInventoryForUser,
    saveCharacterQuests,
    updateCharacterGold
};