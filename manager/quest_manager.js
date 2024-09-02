import { QuestStatus } from "../data/enums.js";
import questData from '../json/quest.json' assert { type: 'json' };

class Quest {
    constructor(questType) {
        this.id = questType.id;
        this.name = questType.name;
        this.description = questType.description;
        this.status = QuestStatus.NOT_STARTED;
        this.requirements = questType.requirements;
        this.rewards = questType.rewards;
    }

    updateStatus(nextStatus) {
        switch (nextStatus) {
            case 'acceptQuest':
                this.status = QuestStatus.IN_PROGRESS;
                break;
            case 'declineQuest':
                this.status = QuestStatus.DECLINED;
                break;
            case 'completeQuest':
                this.status = QuestStatus.COMPLETED;
                break;
            case 'turnInQuest':
                this.status = QuestStatus.COMPLETED_AND_TURNED_IN;
                break;
            default:
                console.log("Unhandled status update:", nextStatus);
        }
    }

    start() {
        this.status = QuestStatus.IN_PROGRESS;
    }

    complete() {
        this.status = QuestStatus.COMPLETED;
    }

    turnIn() {
        this.status = QuestStatus.COMPLETED_AND_TURNED_IN;
    }
}

class QuestManager {
    constructor() {
        if (QuestManager.instance) {
            return QuestManager.instance;
        }

        this.questTemplates = [];
        this.userQuests = new Map(); //userID -> ( characterID -> [quests] ) 
        QuestManager.instance = this;
    }

    loadFromJson() {
        this.questTemplates = Array.isArray(questData) ? questData : [];
    }

    static getInstance() {
        if (!QuestManager.instance) {
            QuestManager.instance = new QuestManager();
        }
        return QuestManager.instance;
    }

    getQuestTemplateById(questId) {
        return this.questTemplates.find(quest => quest.id === questId);
    }

    getQuestIdByName(name) {
        const questTemplate = this.questTemplates.find(quest => quest.name === name);
        return questTemplate ? questTemplate.id : null;
    }

    createQuestInstance(questId) {
        const template = this.getQuestTemplateById(questId);
        return template ? new Quest(template) : null;
    }

    getCharQuests(userId, characterId) {
        if (!this.userQuests.has(userId)) {
            this.userQuests.set(userId, new Map());
        }
        const charQuests = this.userQuests.get(userId);
        if (!charQuests.has(characterId)) {
            charQuests.set(characterId, []);
        }
        return charQuests.get(characterId);
    }

    getQuestByID(userId, characterId, questId) {
        const quests = this.getCharQuests(userId, characterId);
        return quests.find(q => q.id === questId);
    }

    hasQuest(userId, characterId, questId) {
        const charQuests = this.getCharQuests(userId, characterId);
        return charQuests.some(quest => quest.id === questId);
    }

    addCharQuest(userId, characterId, quest) {
        const charQuests = this.getCharQuests(userId, characterId);
        if (!this.hasQuest(userId, characterId, quest.id)) {
            charQuests.push(quest);
        } else {
            console.log('Already owned this quest.');
        }
    }

    startQuest(userId, characterId, questId) {
        let charQuests = this.getCharQuests(userId, characterId);
        let quest = charQuests.find(q => q.id === questId);
        if (!quest) {
            quest = this.createQuestInstance(questId);
            this.addCharQuest(userId, characterId, quest);
            quest.start();
        } else {
            console.log(`Quest '${quest.name}' already started for character ${characterId} of user ${userId}.`);
        }
    }
}

export { Quest, QuestManager };