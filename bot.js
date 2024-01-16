import 'dotenv/config';
import pkg, { Events } from 'discord.js';
import { charactercommands } from './commands_character.js';
const { Client, GatewayIntentBits } = pkg;
import AccountManagementView from './login-panel.js';

// Create and configure the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const commandMap = {
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
  if (!interaction.isCommand()) return;

  const commandName = interaction.commandName;
  const subCommandName = interaction.options.getSubcommand();

  const commandHandler = commandMap[commandName]?.[subCommandName];

  if (commandHandler) {
    await commandHandler(interaction);
  } else {
    console.log(`Command or subcommand '${subCommandName}' not found for '${commandName}'.`);
  }
});