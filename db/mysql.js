import mysql from 'mysql2/promise';
import { serializeObject } from "../util/util.js";
import { Character, CharacterManager } from "../manager/character_manager.js";
import { PlayerMovementManager } from "../manager/player_movement_manager.js";

const dbConfig = {
    host: 'na01-sql.pebblehost.com',
    user: 'customer_766436_mm',
    database: 'customer_766436_mm',
    password: 'vJTYzplW@T7kuJikp6x@',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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
        const [rows] = await connection.execute('SELECT COUNT(*) AS count FROM mm_characters');
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
            INSERT INTO mm_characters (user_id, id, name, level, class_id, race_id, personality_id, xp, battle_bar, loot_quality, abilities, stats, skills, status, region_id, location_id, room_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const { id, name, level, classId, raceId, personalityId, xp, battleBar, lootQuality, abilities, stats, skills, status } = character;
        const battleBarJson = JSON.stringify(battleBar);
        const abilitiesJson = JSON.stringify(abilities);
        const serializedStats = serializeObject(character.stats, ['hp', 'mp', 'spd', 'physicalATK', 'physicalDEF', 'magicATK', 'magicDEF', 'fireATK', 'fireDEF', 'lightATK', 'lightDEF', 'darkATK', 'darkDEF']);
        const serializedSkills = serializeObject(character.skills, ['mining', 'smithing', 'crafting', 'fishing', 'gathering', 'farming', 'cooking', 'brewing']);
        const serializedStatus = serializeObject(character.status, ['spdMult', 'phyDefBuffMag', 'phyDefBuffTimer', 'bleedMag', 'bleedTimer', 'poisonMag', 'poisonTimer']);

        const result = await connection.execute(sql, [
            userId.toString(), id, name, level, classId, raceId, personalityId, xp,
            battleBarJson, lootQuality, abilitiesJson,
            serializedStats, serializedSkills, serializedStatus,
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
            UPDATE mm_characters
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
        const [rows] = await connection.execute('SELECT DISTINCT user_id FROM mm_characters');
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
        const [rows] = await connection.execute('SELECT * FROM mm_characters WHERE user_id = ?', [userId.toString()]);

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
                JSON.parse(row.abilities)
            );
            character.stats = JSON.parse(row.stats);
            character.skills = JSON.parse(row.skills);
            character.status = JSON.parse(row.status);
            return character;
        });

        for (let i = 0; i < characters.length; i++) {
            charManager.addCharacter(userId, characters[i]);
            moveManager.setLocation(userId, characters[i].id, rows[i].region_id, rows[i].location_id, rows[i].room_id);
        }

        charManager.setActiveCharacter(userId, characters[0].id);

        console.log(`Characters for user ${userId} loaded successfully.`);
    } catch (error) {
        console.error(`Failed to load characters for user ${userId}:`, error);
    } finally {
        connection.release();
    }
}

async function getNextCharacterId() {
    const connection = await MysqlDB.getConnection();
    try {
        const [rows] = await connection.execute('SELECT MAX(id) AS max_id FROM mm_characters');
        const maxId = rows[0].max_id || 0;
        console.log(`=================maxId:${maxId}`);
        return maxId + 1;
    } catch (error) {
        console.error('Failed to retrieve next character ID:', error);
        throw error;
    } finally {
        connection.release();
    }
}

export { MysqlDB, hasCharacters, saveCharacterData, getAllUserIds, loadCharactersForUser, saveCharacterLocation, getNextCharacterId };