import Database from "better-sqlite3";
import path from 'path';
import { fileURLToPath } from 'url';

class Node {
    constructor(nodeType) {
        this.id = nodeType.id;
        this.rechargeInterval = nodeType.rechargeInterval;
        this.charges = nodeType.charges;
        this.name = nodeType.name;
        this.yieldEntry = nodeType.yieldEntry;
        this.yieldQuantity = nodeType.yieldQuantity;
        this.requiredSkillType = nodeType.requiredSkillType;
        this.requiredSkillValue = nodeType.requiredSkillValue;
        this.requiredItem = nodeType.requiredItem;
        this.subscriberOnly = nodeType.subscriberOnly;
        this.description = nodeType.description;
        this.location = nodeType.location;
    }
}

class NodeManager {
    constructor() {
        if (NodeManager.instance) {
            return NodeManager.instance;
        }

        this.nodeTemplates = [];
        this.locationNodes = new Map();
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
        const dbPath = path.join(__dirname, '../db/merfolk_and_magic_db.db');
        const db = new Database(dbPath, { verbose: console.log });

        try {
            const nodeStmt = db.prepare('SELECT * FROM Nodes');
            const nodeRows = nodeStmt.all();
            this.nodeTemplates = nodeRows.map(row => ({
                id: row.ID,
                name: row.NAME,
                rechargeInterval: row.RECHARGE_INTERVAL,
                charges: row.CHARGES,
                yieldEntry: row.YIELD_ENTRY,
                yieldQuantity: row.YIELD_QUANTITY,
                requiredSkillType: row.REQUIRED_SKILL_TYPE,
                requiredSkillValue: row.REQUIRED_SKILL_VALUE,
                requiredItem: row.REQUIRED_ITEM,
                description: row.DESCRIPTION,
                subscriberOnly: row.SUBSCRIBER_ONLY
            }));

            const locationStmt = db.prepare('SELECT * FROM LocationNodes');
            const locationRows = locationStmt.all();
            locationRows.forEach(row => {
                const key = `${row.REGION_ID}_${row.LOCATION_ID}_${row.ROOM_ID}`;
                if (!this.locationNodes.has(key)) {
                    this.locationNodes.set(key, []);
                }
                this.locationNodes.get(key).push(this.getTemplateById(row.NODE_ID));
            });
        } catch (error) {
            console.error('Error loading nodes from database:', error);
        } finally {
            db.close();
        }
    }

    getTemplateById(id) {
        return this.nodeTemplates.find(t => t.id === id);
    }

    getAllNodeLocations() {
        const nodeLocations = [];
        for (const [key, value] of this.locationNodes.entries()) {
            const parts = key.split('_').map(Number); 
            const locationInfo = {
                regionId: parts[0],
                locationId: parts[1],
                roomId: parts[2],
                node: value  
            };
            nodeLocations.push(locationInfo);
        }
        return nodeLocations;
    }
}

export { NodeManager, Node };