import 'dotenv/config';
import pkg, { Events } from 'discord.js';
import { charactercommands } from './commands/commands_character.js';
const { Client, GatewayIntentBits, EmbedBuilder } = pkg;
import AccountManagementView from './commands/login-panel.js';
import { CharacterRepository } from './data/repository_character.js';
import { goCommands } from './commands/command_go.js';
import { mapCommands } from './commands/command_map.js';
import { lookCommands } from "./commands/command_look.js";

// Create and configure the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const compoundCommand = {
  character: charactercommands,
};

client.login(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  const accountManagementView = new AccountManagementView(client);
  const loginPanel = accountManagementView.getLoginPanel();

  const channel = client.channels.cache.find(ch => ch.name === 'start-here');
  if (channel) {
    await channel.send(loginPanel);
  }

  console.log('Bot is ready!');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const accountManagementView = new AccountManagementView(client);

  switch (interaction.customId) {
    case 'account-management:sign-up-button':
      await accountManagementView.handleSignUp(interaction);
      break;
    case 'account-management:log-in-button':
      await accountManagementView.handleLogIn(interaction);
      break;
    case 'account-management:log-out-button':
      await accountManagementView.handleLogOut(interaction);
      break;
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId === 'login-modal') {
    const accountManagementView = new AccountManagementView(client);
    await accountManagementView.handleModalSubmit(interaction);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  console.log('Interaction created:', interaction);

  if (interaction.isStringSelectMenu()) {
    const userId = interaction.user.id;
    const charRepo = CharacterRepository.getInstance();
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
      case "map":
          commandHandler = mapCommands[commandName];
          break;
      case "look":
          commandHandler = lookCommands[commandName];
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
});