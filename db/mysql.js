import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'na01-sql.pebblehost.com',
    user: 'customer_766436_mm',
    database: 'customer_766436_mm',
    password: 'vJTYzplW@T7kuJikp6x@'
};

async function initializeMysql() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Database connection established');

    try {
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables in the database:');
        tables.forEach(table => {
            console.log(table[Object.keys(table)[0]]); 
        });
    } catch (error) {
        console.error('Failed to retrieve tables:', error);
    }

    return connection;
}

export { initializeMysql };