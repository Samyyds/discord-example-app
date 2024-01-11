import 'dotenv/config';
import pkg, { Events } from 'discord.js';
import { accountCommands } from './commands_account.js';
import { charactercommands } from './commands_character.js';
const { Client, GatewayIntentBits } = pkg;

// Create and configure the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const commandMap = {
  account: accountCommands,
  character: charactercommands,
};

client.login(process.env.DISCORD_TOKEN);

client.once('ready', () => {
  console.log('Discord client ready!');

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
});


