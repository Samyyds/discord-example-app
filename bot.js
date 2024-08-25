import 'dotenv/config';
import pkg, { Events } from 'discord.js';
const { Client, GatewayIntentBits, EmbedBuilder } = pkg;
import { MysqlDB, getAllUserIds, hasCharacters, loadCharactersForUser, loadInventoryForUser } from "./db/mysql.js";
import { charactercommands } from './commands/commands_character.js';
import { subCommands } from "./commands/command_sub.js";
import { CharacterManager } from './manager/character_manager.js';
import { goCommands } from './commands/command_go.js';
import { moveCommands } from './commands/command_move.js';
import { mapCommands } from './commands/command_map.js';
import { lookCommands } from './commands/command_look.js';
import { attackCommands } from "./commands/command_attack.js";
import { takeCommands } from './commands/command_take.js';
import { mineCommands } from "./commands/command_mine.js";
import { gatherCommands } from "./commands/command_gather.js";
import { initializeGame } from './commands/game_initializer.js';
import { inventoryCommands } from './commands/command_inventory.js';
import { dropCommands } from './commands/command_drop.js';
import { useCommands } from "./commands/command_use.js";
import { unequipCommands } from "./commands/command_unequip.js";
import { equipCommands } from "./commands/command_equip.js";
import { recipeCommands } from "./commands/command_recipe.js";
import { cookCommands } from "./commands/command_cook.js";
import { brewCommands } from "./commands/command_brew.js";
import { handleInventoryInteraction } from './handler/inventory_handler.js';
import { handleCharacterInteraction } from "./handler/character_handler.js";
import { handleAttackInteraction } from "./handler/attack_handler.js";
import { handleRecipeInteraction } from "./handler/recipe_handler.js";

// Create and configure the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });

const compoundCommand = {
  character: charactercommands,
};

client.login(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  try {
    const connection = await MysqlDB.getConnection();
    const hasData = await hasCharacters(connection);

    setImmediate(() => {
      initializeGame();
    });

    if (hasData) {
      const userIds = await getAllUserIds(connection);
      for (const userId of userIds) {
        await loadCharactersForUser(userId);
        await loadInventoryForUser(userId);
      }
    }

    console.log('Bot is ready!');
  } catch (error) {
    console.error('Failed to initialize bot:', error);
  }
  // const channelId = '1232231036054667286';
  // const channel = client.channels.cache.get(channelId);
  // if (!channel) {
  //   console.error('Channel not found');
  //   return;
  // }
  // try {
  //   const message = await channel.send(
  //     '**Welcome to the Free Access Area of Merfolk & Magic!**\n\n' +
  //     'This channel allows you to experience the trial version of our game.\n\n' +
  //     '**Interacting in the Game:**\n' +
  //     '👉 All gameplay interactions are performed via slash commands.\n' +
  //     '👉 Type `/help` at any time to learn more about how to play.\n\n' +
  //     'Enjoy your journey!'
  //   );

  //   await message.pin();
  //   console.log('Message pinned successfully.');
  // } catch (error) {
  //   console.error('Failed to send or pin the message:', error);
  // }
});

//assign "free member" role to new users
client.on(Events.GuildMemberAdd, async (member) => {
  const roleId = '1232243211846811658';
  try {
    await member.roles.add(roleId);
    console.log(`Assigned role to new member: ${member.displayName}`);
  } catch (error) {
    console.error('Failed to assign role:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  console.log('Interaction created:', interaction);

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
    return;
  }

  if (interaction.isCommand()) {
    const commandName = interaction.commandName;
    let commandHandler;

    switch (commandName) {
      case "go":
        commandHandler = goCommands[commandName];
        break;
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
      case "cook":
        commandHandler = cookCommands[commandName];
        break;
      case "brew":
        commandHandler = brewCommands[commandName];
        break;
      case "drop":
        commandHandler = dropCommands[commandName];
        break;
      case "use":
        commandHandler = useCommands[commandName];
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
      default:
        const subCommandName = interaction.options.getSubcommand();
        commandHandler = compoundCommand[commandName]?.[subCommandName];
        break;
    }

    if (commandHandler) {
      await commandHandler(interaction);
    } else {
      console.log(`Command '${commandName}' with subcommand '${subCommandName}' not found.`);
      await interaction.reply({ content: "Sorry, I didn't recognize that command.", ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith('inventory_')) {
      await handleInventoryInteraction(interaction);
    } else if (interaction.customId.startsWith('show_')) {
      await handleCharacterInteraction(interaction);
    } else if (interaction.customId.startsWith('attack_')) {
      await handleAttackInteraction(interaction);
    }else if(interaction.customId.startsWith('next_') || interaction.customId.startsWith('prev_')){
      await handleRecipeInteraction(interaction);
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
