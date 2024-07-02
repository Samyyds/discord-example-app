import mysql from 'mysql2/promise';
import { serializeObject, exportLocationValues } from "../util/util.js";

const dbConfig = {
    host: 'na01-sql.pebblehost.com',
    user: 'customer_766436_mm',
    database: 'customer_766436_mm',
    password: 'vJTYzplW@T7kuJikp6x@'
};

async function initializeMysql() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Database connection established');
        return connection;
    } catch (error) {
        console.error('Failed to establish database connection:', error);
        throw error;
    }
}

async function saveCharacter(userId, character, location) {
    const connection = await initializeMysql();
    const locationData = exportLocationValues(location);
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
            userId, id, name, level, classId, raceId, personalityId, xp,
            battleBarJson, lootQuality, abilitiesJson,
            serializedStats, serializedSkills, serializedStatus,
            locationData.regionId, locationData.locationId, locationData.roomId
        ]);
        console.log('Character saved:', result);
    } catch (error) {
        console.error('Failed to save character:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

export { initializeMysql, saveCharacter};