import Database from "better-sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

class NodeManager {
    constructor() {
        if (NodeManager.instance) {
            return NodeManager.instance;
        }

        this.nodes = [];
        NodeManager.instance = this;
    }

    static getInstance() {
        if (!NodeManager.instance) {
            NodeManager.instance = new NodeManager();
        }
        return NodeManager.instance;
    }

    loadFromDB() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        console.log('Current Directory:', __dirname); 
        const dbPath = path.join(__dirname, '../db/merfolk_and_magic_db.db');
        console.log('Database Path:', dbPath); 
        const db = new Database(dbPath, { verbose: console.log });

        try {
            const stmt = db.prepare('SELECT * FROM Nodes');
            const rows = stmt.all();
            this.nodes = rows.map(row => new Node(
                row.ID, 
                row.TYPE, 
                row.RECHARGE_INTERVAL, 
                row.CHARGES, 
                row.NAME, 
                row.YIELD_ENTRY, 
                row.YIELD_QUANTITY, 
                row.REQUIRED_SKILL_TYPE, 
                row.REQUIRED_SKILL_VALUE, 
                row.REQUIRED_ITEM, 
                row.DESCRIPTION, 
                row.LOCATION
            ));
        } catch (error) {
            console.error('Error loading nodes from database:', error);
        } finally {
            db.close();
        }
    }
}

class Node {
    constructor(id, type, recharge_interval, charges, name, yield_entry, yield_quantity, required_skill_type, required_skill_value, required_item, description, location) {
        this.id = id;
        this.type = type;
        this.recharge_interval = recharge_interval;
        this.charges = charges;
        this.name = name;
        this.yield_entry = yield_entry;
        this.yield_quantity = yield_quantity;
        this.required_skill_type = required_skill_type;
        this.required_skill_value = required_skill_value;
        this.required_item = required_item;
        this.description = description;
        this.location = location;
    }

    getLocationParts() {
        const [regionId, locationId, roomId] = this.location.split('/').map(Number);
        return { regionId, locationId, roomId };
    }
}

export { NodeManager, Node };