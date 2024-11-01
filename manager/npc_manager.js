import npcData from '../json/npc.json' assert { type: 'json' };
import { QuestManager } from '../manager/quest_manager.js';
import { QuestStatus } from "../data/enums.js";
import { Key, ItemManager } from "../manager/item_manager.js";
import { InventoryManager } from "../manager/inventory_manager.js";

class NPC {
    constructor(npcTemplates) {
        this.id = npcTemplates.id;
        this.name = npcTemplates.name;
        this.description = npcTemplates.description;
        this.location = npcTemplates.location;//{}
        this.quest = npcTemplates.quest;// []
        this.dialogueTree = npcTemplates.dialogueTree;//{}
    }

    talk(userId, characterId) {
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
                case QuestStatus.COMPLETED_AND_TURNED_IN:
                    statusKey = 'quest_turned_in';
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

        let statusKey = this.getStatusKey(quest);
        let optionDetails = dialogueOptions[statusKey]['start']['options'][option];

        if (optionDetails.action) {
            if (optionDetails.action === 'startQuest' && !quest) {
                questManager.startQuest(userId, characterId, questId);
            } else if (quest) {
                quest.updateStatus(optionDetails.action);
                if (optionDetails.action === 'turnInQuest') {
                    quest.status = QuestStatus.COMPLETED_AND_TURNED_IN;

                    const rewardText = quest.getRewardText();
                    const rewardKey = quest.rewards?.key;

                    if (rewardKey) {
                        const itemManager = ItemManager.getInstance();
                        const key = new Key(itemManager.getKeyDataById(Number(rewardKey)));
                        const inventoryManager = InventoryManager.getInstance();
                        inventoryManager.addItem(userId, characterId, key, 1);
                    }

                    return rewardText;
                }
            }
        }

        if (optionDetails.next) {
            let nextKey = optionDetails.next;
            if (dialogueOptions[statusKey][nextKey] && dialogueOptions[statusKey][nextKey]['text']) {
                return dialogueOptions[statusKey][nextKey]['text'];
            }
        }

        return "No actual reward has been implemented for now.";
    }

    getStatusKey(quest) {
        if (!quest) return 'quest_not_started';
        switch (quest.status) {
            case QuestStatus.IN_PROGRESS:
                return 'quest_in_progress';
            case QuestStatus.COMPLETED:
                return 'quest_completed';
            case QuestStatus.COMPLETED_AND_TURNED_IN:
                return 'quest_turned_in';
            default:
                return 'quest_not_started';
        }
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