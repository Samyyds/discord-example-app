import npcData from '../json/npc.json' assert { type: 'json' };

class NPC {
    constructor(npcTemplates) {
        this.id = npcTemplates.id;
        this.name = npcTemplates.name;
        this.description = npcTemplates.description;
        this.location = npcTemplates.location;//{}
        this.quest = npcTemplates.quest;// []
        this.dialogueTree = npcTemplates.dialogueTree;//{}
    }
}

class NPCManager {
    constructor() {
        if (NPCManager.instance) {
            return NPCManager.instance;
        }
        this.npcTemplates = [];
        NPCManager.instance = this;
    }

    static getInstance() {
        if (!NPCManager.instance) {
            NPCManager.instance = new NPCManager();
        }
        return NPCManager.instance;
    }

    loadFromJson() {
        this.npcTemplates = Array.isArray(npcData) ? npcData : [];
    }    

    getNpcTemplateById(id) {
        return this.npcTemplates.find(npc => npc.id === id);
    }

    createNpcInstance(id) {
        const template = this.getNpcTemplateById(id);
        if (template) {
            return new NPC(template);
        }
        return null;
    }
}

export { NPC, NPCManager };