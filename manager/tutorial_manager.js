import { EmbedBuilder } from 'discord.js';
import { Race, Class } from "../data/enums.js";
import { CharacterManager } from "../manager/character_manager.js";

class Tutorial {
    constructor(interaction, client) {
        this.interaction = interaction;
        this.client = client;
        this.commandListener = null;
        this.commandTimeout = 60000;
        this.steps = [
            { text: "Welcome to Merfolk & Magic - a fully discord based multi-user dungeon with a hand written storyline, quests, trading, crafting, classes and class builds, and with a strong emphasis on roleplaying. Future releases will include endgame and post-story mechanics.", command: null },
            { text: "Merfolk & Magic is played using Discord commands. Discord commands always start with the slash symbol (/). Every available / command can be previewed by typing / into the chatbox.", command: null },
            { text: "Use the /character create command to create your character and begin playing.", command: "1194917367155802114" },
            { text: "You are a {$race} {$class} who is called {$name}. You grew up in the small fishing village of Moku’ah. Your adventure begins there.", command: null },
            { text: "Chromatic shapes pass between the gaps in your vision. You want to hold on to words, but they dance away on little black ships. Waves of pain cascade irregularly into the eye in your forehead. You open the door to the next dimension. It smells vaguely of blue corn. There is a hand the size of a building, and it crushes you before you can say anything. You feel every bone break in your body, and you feel your skull crushed like a watermelon. Yet you can still see somehow, your eyeballs floating away independently, functionally scanning the sky. There's no blood, because you died a long time ago. You know it, you're sure of it, but you don't remember when, or who told you. A woman with worms for eyes appears in front of you and, with a piercing scream, they dive into yours.", command: null },
            { text: "You open your eyes. You look to your right and left, then below. You're lying on a dirty mattress, the edges stained black with use. You sit up, disoriented. You had a dream, but you can't remember anything about it. Your gear is still next to you. Your fishing gear. You're not an adventurer, you remember. You're just a failed fisherman.", command: null },
            { text: "You're in the tavern you've always been in. This is where you work, and what you do for a living.", command: null },
            { text: "With a sigh, you stand up. Another day has begun.", command: null },
            { text: "Type /look to inspect your surroundings. This allows you to identify elements in the world in order to interact with them.", command: "1201779927050092614" },
            { text: "The tavern is a run-down hovel. The depth and quality of the construction hints that this was once a proud establishment, with impressive wooden arches and engraved furniture.", command: null },
            { text: "You only know how to fish. Being a fisherman is the way you make ends meet. Every day, you go to the tavern and fulfil the tavernkeeper’s orders. You need to get the tavernkeeper’s orders for the day. Around you, other fishermen are preparing for the day. You can see the innkeeper, Feleti, moving buckets of fish from the storeroom to the kitchen. You should talk to him to find out what he needs from you today.", command: null },
            { text: "Type /talk Feleti to talk to him. You can talk to most characters that you encounter. You can try to /talk to things other than other people, but you may not get a response.", command: "1278618188665458709" },
            { text: "Feleti straightens up, his broad shoulders competing to occupy his bosom. {$playername} he remarks. 'I would say it's nice to see a pleasant face for once, but I'd be lying about at least one of those things.' He chuckles, then frowns. 'Today's different for you. The village elder has asked that all able-bodied men in the village meet with him to discuss an urgent matter.' He picks something out of his ear and flicks it away. 'As the village elder, his word is final. You won't be catching anything for me today. Go talk to him and find out what the old man wants. He's in the town square, where he always is.' He waves dismissively and turns around without waiting for your response.", command: null },
            { text: "Type /help to view a list of in-game commands and explanations about certain game concepts. You can do this at any time.", command: "1283704073790423061" },
            { text: "You gather your things from the side of the bed as you prepare to head out. Among your meager possessions are a sturdy sack, fishing equipment, some food, and a map.", command: null },
            { text: "Type /map to see where you are. The map will also show you areas that are connected to where you currently are. Use the map to navigate the world, and determine how to travel from one location to another.", command: "1200693908859006987" },
            { text: "/go to the village center.", command: "1199966654533218345" },
            { text: "/look around the village center for the village elder.", command: "1201779927050092614" },
            { text: "/talk to the Moku'ah Village Elder.", command: "1278618188665458709" }
        ];
        this.isProcessing = false;
        this.currentStep = 0;
        this.processStep();
    }

    isInTutorial() {
        return this.currentStep < this.steps.length;
    }

    getCurrentCommandId() {
        if (this.steps[this.currentStep - 1] && this.steps[this.currentStep - 1].command) {
            return this.steps[this.currentStep - 1].command;
        }
        return null;
    }

    async processStep() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        if (this.currentStep < this.steps.length) {
            const step = this.steps[this.currentStep];

            const characterManager = CharacterManager.getInstance();
            const activeCharacter = characterManager.getActiveCharacter(this.interaction.user.id);

            let description = step.text;
            if (activeCharacter) {
                description = description.replace('{$name}', activeCharacter.name)
                                         .replace('{$race}', Object.keys(Race).find(key => Race[key] === activeCharacter.raceId).toLowerCase())
                                         .replace('{$class}', Object.keys(Class).find(key => Class[key] === activeCharacter.classId).toLowerCase());
            }
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setDescription(description);

            try {
                await this.interaction.followUp({ embeds: [embed], ephemeral: true });
                if (step.command) {
                    this.waitForCommand(step.command);
                } else {
                    this.currentStep++;
                    setTimeout(() => this.processStep(), 1000);
                }
            } catch (error) {
                console.error('Failed to send message for step:', this.currentStep, error);
            }
        } else {
            console.log('Tutorial completed.');
            this.cleanup();
        }

        this.isProcessing = false;
    }

    waitForCommand(commandId) {
        this.cleanupListener();

        this.commandListener = (commandInteraction) => {
            if (commandInteraction.commandId === commandId) {
                console.log(`Command ${commandId} executed, continuing tutorial.`);
                this.cleanupListener();
                this.currentStep++;
                this.processStep();
            } else {
                this.retry(commandId);
            }
        };

        this.timeout = setTimeout(() => {
            this.interaction.followUp({
                content: "Time out. Please try the command again to continue the tutorial.",
                ephemeral: true
            });
            this.cleanupListener();
            this.waitForCommand(commandId);
        }, this.commandTimeout);

        this.client.on('commandExecuted', this.commandListener);
    }

    retry(commandId) {
        this.cleanupListener();
        this.waitForCommand(commandId);
    }

    cleanupListener() {
        if (this.commandListener) {
            this.client.off('commandExecuted', this.commandListener);
            this.commandListener = null;
        }
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    cleanup() {
        this.cleanupListener();
        const tutorialManager = TutorialManager.getInstance();
        tutorialManager.finishTutorialForUser(this.interaction.user.id);
    }
}

class TutorialManager {
    constructor() {
        this.tutorials = new Map();//user -> tutorial instance

        TutorialManager.instance = this;
    }

    static getInstance() {
        if (!TutorialManager.instance) {
            TutorialManager.instance = new TutorialManager();
        }
        return TutorialManager.instance;
    }

    startTutorialForUser(interaction, client) {
        let tutorial = this.tutorials.get(interaction.user.id);
        if (!tutorial) {
            tutorial = new Tutorial(interaction, client);
            this.tutorials.set(interaction.user.id, tutorial);
        }
        tutorial.processStep();
    }

    getTutorialForUser(userId) {
        return this.tutorials.get(userId);
    }

    finishTutorialForUser(userId) {
        this.tutorials.delete(userId);
    }
}
export { Tutorial, TutorialManager };