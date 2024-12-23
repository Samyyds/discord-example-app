import 'dotenv/config';
import pkg, { Events } from 'discord.js';
const { Client, GatewayIntentBits, EmbedBuilder, Partials, PermissionsBitField } = pkg;
import { MysqlDB, getAllUserIds, hasCharacters, loadCharactersForUser, loadInventoryForUser } from "./db/mysql.js";

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

import { Regions, MokuahLocations, NyraLocations, IsfjallLocations, TheTrenchLocations } from './data/enums.js';
import { TutorialManager } from "./manager/tutorial_manager.js";
import { charactercommands } from './commands/commands_character.js';
import { subCommands } from "./commands/command_sub.js";
import { CharacterManager } from './manager/character_manager.js';
import { PlayerMovementManager } from "./manager/player_movement_manager.js";
import { RegionManager } from "./manager/region_manager.js";
import { goCommands } from './commands/command_go.js';
import { moveCommands } from './commands/command_move.js';
import { mapCommands } from './commands/command_map.js';
import { lookCommands } from './commands/command_look.js';
import { attackCommands } from "./commands/command_attack.js";
import { takeCommands } from './commands/command_take.js';
import { mineCommands } from "./commands/command_mine.js";
import { gatherCommands } from "./commands/command_gather.js";
import { farmCommands } from "./commands/command_farm.js";
import { initializeGame } from './commands/game_initializer.js';
import { inventoryCommands } from './commands/command_inventory.js';
import { dropCommands } from './commands/command_drop.js';
import { useCommands } from "./commands/command_use.js";
import { talkCommands } from "./commands/command_talk.js";
import { unequipCommands } from "./commands/command_unequip.js";
import { equipCommands } from "./commands/command_equip.js";
import { recipeCommands } from "./commands/command_recipe.js";
import { cookCommands } from "./commands/command_cook.js";
import { brewCommands } from "./commands/command_brew.js";
import { questCommands } from "./commands/command_quest.js";
import { startCommands } from "./commands/command_start.js";
import { helpCommands } from "./commands/command_help.js";
import { travelCommands } from "./commands/command_travel.js";
import { handleInventoryInteraction } from './handler/inventory_handler.js';
import { handleCharacterInteraction } from "./handler/character_handler.js";
import { handleAttackInteraction } from "./handler/attack_handler.js";
import { handleRecipeInteraction } from "./handler/recipe_handler.js";
import { handleTalkInteraction } from "./handler/talk_handler.js";
import { handleQuestInteraction } from "./handler/quest_handler.js";
import { handleStartGameInteraction } from "./handler/startGame_handler.js";
import { handleGoAutocomplete } from "./handler/go_autoComplete.js";
import { handleLookAutocomplete } from "./handler/look_autoComplete.js";
import { handleAttackAutocomplete } from "./handler/attack_autoComplete.js";
import { smithCommands } from './commands/command_smith.js';
import { fishCommands } from "./commands/command_fish.js";
import { handleTravelAutocomplete } from './handler/travel_autoComplete.js';
import { sendWelcomeMessage } from "./util/util.js";


const regionToLocations = {
  MOKUAH: MokuahLocations,
  NYRA: NyraLocations,
  ISFJALL: IsfjallLocations,
  THE_TRENCH: TheTrenchLocations,
};
// Create and configure the Discord client
const client = new Client({
  intents:
    [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
    ],
  partials: [Partials.Message, Partials.Reaction, Partials.Channel]
});

const compoundCommand = {
  character: charactercommands,
};

client.login(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  try {

    // const channelId = process.env.START_HERE_CHANNEL;
    // const channel = client.channels.cache.get(channelId);
    // if (channel) {
    //     sendWelcomeMessage(channel);
    // } else {
    //     console.log('Channel not found');
    // }//send pinned message to channel

    const connection = await MysqlDB.getConnection();
    const hasData = await hasCharacters(connection);

    setImmediate(() => {
      initializeGame();
    });

    if (hasData) {
      const userIds = await getAllUserIds(connection);
      const loadPromises = userIds.map(async (userId) => {
        try {
          await loadCharactersForUser(userId);
          await loadInventoryForUser(userId);
        } catch (error) {
          console.error(`Failed to load data for user ${userId}:`, error);
        }
      });
      await Promise.allSettled(loadPromises);
    }

    console.log('Bot is ready!');

  } catch (error) {
    console.error('Failed to initialize bot:', error);
  }

  client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`New member added: ${member.displayName}`);
  });

  // client.on(Events.MessageReactionAdd, async (reaction, user) => {
  //   console.log("A reaction has been added!");
  //   if (reaction.partial) {
  //     try {
  //       await reaction.fetch();
  //     } catch (error) {
  //       console.error('Something went wrong when fetching the message:', error);
  //       return;
  //     }
  //   }
  //   if (reaction.message.channelId === process.env.START_HERE_CHANNEL) {
  //     const member = await reaction.message.guild.members.fetch(user.id);
  //     await member.roles.add(process.env.FREE_MEMBER_ROLE); 

  //     const updatedMember = await reaction.message.guild.members.fetch(user.id);
  //     if (updatedMember.roles.cache.has(process.env.FREE_MEMBER_ROLE)) {
  //       const freeAccessChannel = member.guild.channels.cache.find(channel => channel.name === 'free-access');
  //       if (freeAccessChannel) {
  //         try {
  //           await freeAccessChannel.permissionOverwrites.edit(member, {
  //             [PermissionsBitField.Flags.ViewChannel]: true,
  //             [PermissionsBitField.Flags.SendMessages]: true
  //           });
  //           console.log(`Access granted to ${member.displayName} for #free-access channel.`);
  //           let tutorial = new Tutorial(freeAccessChannel);
  //           tutorial.processStep();
  //         } catch (error) {
  //           console.error('Failed to edit permissions:', error);
  //         }
  //       }
  //     } else {
  //       console.log(`Failed to add role to ${member.displayName}`);
  //     }
  //   }
  // });
});

client.on(Events.InteractionCreate, async interaction => {
  console.log('Interaction created:', interaction);

  client.emit('commandExecuted', interaction);

  if (interaction.isAutocomplete()) {
    const focusedOption = interaction.options.getFocused(true);

    if (interaction.commandName === 'go') {
      if (focusedOption.name === 'destination') {
        await handleGoAutocomplete(interaction);
      }
    }

    if (interaction.commandName === 'travel') {
      if (focusedOption.name === 'region') {
        await handleTravelAutocomplete(interaction);
      }
    }

    if (interaction.commandName === 'look') {
      if (focusedOption.name === 'object') {
        await handleLookAutocomplete(interaction);
      }
    }

    if (interaction.commandName === 'attack') {
      if (focusedOption.name === 'enemy') {
        await handleAttackAutocomplete(interaction);
      }
    }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    const userId = interaction.user.id;
    const charRepo = CharacterManager.getInstance();
    const selectedCharacterId = interaction.values[0];

    const customId = interaction.customId;
    if (customId === 'switch-character') {
      const activeChar = charRepo.getActiveCharacter(userId);

      if (activeChar && activeChar.id.toString() === selectedCharacterId) {
        await interaction.reply({ content: "You can't select your current active character.", ephemeral: true });
      } else {
        console.log(`selectedCharacterId: ${selectedCharacterId}`, typeof selectedCharacterId);
        charRepo.setActiveCharacter(userId, selectedCharacterId);

        const newActiveChar = charRepo.getActiveCharacter(userId);

        const embed = new EmbedBuilder()
          .setTitle(`Character Switched`)
          .setDescription(`You have switched to character: **${newActiveChar.name}**`)
          .setColor(0x00AE86);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // if (customId === 'travel_region_select') {
    //   await handleTravelInteraction(interaction);
    // }

    // if(customId === 'destination-selection'){
    //   await handleGoInteraction(interaction);
    // }

    return;
  }

  if (interaction.isCommand()) {
    const commandName = interaction.commandName;
    let commandHandler;

    const tutorialManager = TutorialManager.getInstance();
    const tutorial = tutorialManager.getTutorialForUser(interaction.user.id);

    if (tutorial && tutorial.isInTutorial()) {
      const expectedCommandId = tutorial.getCurrentCommandId();
      console.log(`interaction.commandId: ${interaction.commandId}`);
      console.log(`expectedCommandId: ${expectedCommandId}`);
      if (interaction.commandId !== expectedCommandId) {
        await interaction.reply({
          content: "It seems you've entered an incorrect command. Please use the correct command to continue the tutorial.",
          ephemeral: true
        });
        return;
      }
    }

    if (interaction.commandName === "start") {
      commandHandler = startCommands[interaction.commandName];
      if (commandHandler) {
        await commandHandler(interaction, client);
      }
    } else {
      switch (commandName) {
        case "go":
          await goCommands[commandName](interaction);
          return;
        case "move":
          commandHandler = moveCommands[commandName];
          break;
        case "map":
          commandHandler = mapCommands[commandName];
          break;
        case "attack":
          commandHandler = attackCommands[commandName];
          break;
        case "look":
          commandHandler = lookCommands[commandName];
          break;
        case "take":
          commandHandler = takeCommands[commandName];
          break;
        case "inventory":
          commandHandler = inventoryCommands[commandName];
          break;
        case "mine":
          commandHandler = mineCommands[commandName];
          break;
        case "gather":
          commandHandler = gatherCommands[commandName];
          break;
        case "farm":
          commandHandler = farmCommands[commandName];
          break;
        case "fish":
          commandHandler = fishCommands[commandName];
          break;
        case "cook":
          commandHandler = cookCommands[commandName];
          break;
        case "brew":
          commandHandler = brewCommands[commandName];
          break;
        case 'smith':
          commandHandler = smithCommands[commandName];
          break;
        case "drop":
          commandHandler = dropCommands[commandName];
          break;
        case "use":
          commandHandler = useCommands[commandName];
          break;
        case "talk":
          commandHandler = talkCommands[commandName];
          break;
        case "unequip":
          commandHandler = unequipCommands[commandName];
          break;
        case "equip":
          commandHandler = equipCommands[commandName];
          break;
        case "sub":
          commandHandler = subCommands[commandName];
          break;
        case "recipe":
          commandHandler = recipeCommands[commandName];
          break;
        case "quest":
          commandHandler = questCommands[commandName];
          break;
        case "help":
          commandHandler = helpCommands[commandName];
          break;
        case "travel":
          await travelCommands[commandName](interaction);
          return;
        default:
          const subCommandName = interaction.options.getSubcommand();
          commandHandler = compoundCommand[commandName]?.[subCommandName];
          break;
      }
      if (commandHandler) {
        await commandHandler(interaction);
      }
      else {
        console.log(`Command '${commandName}' with subcommand '${subCommandName}' not found.`);
        await interaction.reply({ content: "Sorry, I didn't recognize that command.", ephemeral: true });
      }
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith('inventory_')) {
      await handleInventoryInteraction(interaction);
    } else if (interaction.customId.startsWith('show_')) {
      await handleCharacterInteraction(interaction);
    } else if (interaction.customId.startsWith('attack_')) {
      await handleAttackInteraction(interaction);
    } else if (interaction.customId.startsWith('next_') || interaction.customId.startsWith('prev_') || interaction.customId.startsWith('skill_')) {
      await handleRecipeInteraction(interaction);
    } else if (interaction.customId.startsWith('talk_')) {
      await handleTalkInteraction(interaction);
    } else if (interaction.customId.startsWith('quest_')) {
      handleQuestInteraction(interaction);
    } else if (interaction.customId.startsWith('start_')) {
      handleStartGameInteraction(interaction);
    }
    else {
      console.log('Unrecognized button interaction:', interaction.customId);
      await interaction.reply({ content: "I'm not sure what this button is for!", ephemeral: true });
    }
  }
});

  // const accountManagementView = new AccountManagementView(client);
  // const loginPanel = accountManagementView.getLoginPanel();

  // const channel = client.channels.cache.find(ch => ch.name === 'start-here');
  // if (channel) {
  //   await channel.send(loginPanel);
  // }

// client.on(Events.InteractionCreate, async (interaction) => {
//   if (!interaction.isButton()) return;

//   const accountManagementView = new AccountManagementView(client);

//   switch (interaction.customId) {
//     case 'account-management:sign-up-button':
//       await accountManagementView.handleSignUp(interaction);
//       break;
//     case 'account-management:log-in-button':
//       await accountManagementView.handleLogIn(interaction);
//       break;
//     case 'account-management:log-out-button':
//       await accountManagementView.handleLogOut(interaction);
//       break;
//   }
// });

// client.on(Events.InteractionCreate, async (interaction) => {
//   if (!interaction.isModalSubmit()) return;
//   if (interaction.customId === 'login-modal') {
//     const accountManagementView = new AccountManagementView(client);
//     await accountManagementView.handleModalSubmit(interaction);
//   }
// });
