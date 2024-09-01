import npcData from '../json/npc.json' assert { type: 'json' };
import { QuestManager } from '../manager/quest_manager.js';
import { QuestStatus } from "../data/enums.js";

class NPC {
    constructor(npcTemplates) {
        this.id = npcTemplates.id;
        this.name = npcTemplates.name;
        this.description = npcTemplates.description;
        this.location = npcTemplates.location;//{}
        this.quest = npcTemplates.quest;// []
        this.dialogueTree = npcTemplates.dialogueTree;//{}
    }

    talk(userId, characterId){
        const questManager = QuestManager.getInstance();
        const quests = questManager.getCharQuests(userId, characterId);
        const questId = this.quest[0];
        const quest = quests.find(quest => quest.id === questId);

        let statusKey = 'quest_not_started';
        if (quest) {
            switch (quest.status) {
                case QuestStatus.IN_PROGRESS:
                    statusKey = 'quest_in_progress';
                    break;
                case QuestStatus.COMPLETED:
                    statusKey = 'quest_completed';
                    break;
            }
        }

        const dialogueOptions = this.dialogueTree[questId][statusKey]['start'];

        return dialogueOptions;
    }

    makeChoice(userId, characterId, questId, option) {
        const questManager = QuestManager.getInstance();
        let quests = questManager.getCharQuests(userId, characterId);
        let quest = quests.find(q => q.id === questId);
        let dialogueOptions = this.dialogueTree[questId];
    
        let statusKey = quest ? quest.status.toLowerCase().replace('_', ' ') : 'quest_not_started';
        let optionDetails = dialogueOptions[statusKey]['start']['options'][option];
    
        if (optionDetails.action) {
            if (optionDetails.action === 'startQuest' && !quest) {
                quest = questManager.startQuest(userId, characterId, questId);
            } else if (quest) {
                quest.updateStatus(optionDetails.action);
            }
        }
    
        if (optionDetails.next) {
            let nextKey = optionDetails.next;
            if (dialogueOptions[statusKey][nextKey] && dialogueOptions[statusKey][nextKey]['text']) {
                return dialogueOptions[statusKey][nextKey]['text'];
            }
        }
    
        return "No further actions found for this option.";
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