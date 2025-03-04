import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';

async function main() {
    console.log("开始运行脚本...");
    try {
        const result = await uploadUpdatedCharactersData();
        console.log("操作结果：", result);
    } catch (error) {
        console.error("执行过程中出错：", error);
    } finally {
        process.exit(0);
    }
}

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

async function fetchCharactersData() {
    const connection = await MysqlDB.getConnection();
    try {
        const [rows] = await connection.execute("SELECT * FROM mm_characters");
        await fs.writeFile('characters.json', JSON.stringify(rows, null, 2));
        return `成功保存了 ${rows.length} 条记录到 characters.json`;
    } catch (error) {
        console.error("Error fetching characters data: ", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function fetchDummyCharactersData() {
    const connection = await MysqlDB.getConnection();
    try {
        const [rows] = await connection.execute("SELECT * FROM dummy_characters ORDER BY id DESC LIMIT 20");
        const result = rows.reverse();
        await fs.writeFile('dummy_characters.json', JSON.stringify(result, null, 2));
        return `成功保存了 ${result.length} 条记录到 dummy_characters.json`;
    } catch (error) {
        console.error("Error fetching characters data: ", error);
        throw error;
    } finally {
        connection.release();
    }
}

async function uploadUpdatedCharactersData() {
    const connection = await MysqlDB.getConnection();
    try {
      const fileContent = await fs.readFile('updated_characters.json', 'utf8');
      const characters = JSON.parse(fileContent);
      console.log(`读取到 ${characters.length} 条记录`);
  
      const sql = `
        INSERT INTO mm_characters
        (user_id, id, name, level, class_id, race_id, personality_id, xp, battle_bar, loot_quality, abilities, stats, skills, status, gold, region_id, location_id, room_id, quests)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
  
      for (const character of characters) {
        const battleBar = typeof character.battle_bar === 'string'
          ? character.battle_bar
          : JSON.stringify(character.battle_bar);
        const abilities = typeof character.abilities === 'string'
          ? character.abilities
          : JSON.stringify(character.abilities);
        const stats = typeof character.stats === 'string'
          ? character.stats
          : JSON.stringify(character.stats);
        const skills = typeof character.skills === 'string'
          ? character.skills
          : JSON.stringify(character.skills);
        const status = typeof character.status === 'string'
          ? character.status
          : JSON.stringify(character.status);
        
        const gold = character.gold !== undefined ? character.gold : 50;
  
        const quests = character.quests !== undefined ? character.quests : null;
  
        const params = [
          character.user_id,
          character.id,
          character.name,
          character.level,
          character.class_id,
          character.race_id,
          character.personality_id,
          character.xp,
          battleBar,
          character.loot_quality,
          abilities,
          stats,
          skills,
          status,
          gold,
          character.region_id,
          character.location_id,
          character.room_id,
          quests
        ];
  
        const [result] = await connection.execute(sql, params);
        console.log(`记录 id ${character.id} 上传成功:`, result);
      }
      console.log("全部数据上传完成");
    } catch (error) {
      console.error("Error uploading updated characters data:", error);
      throw error;
    } finally {
      connection.release();
    }
  }


main();