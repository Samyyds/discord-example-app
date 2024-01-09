import 'dotenv/config';
import pkg, { Events } from 'discord.js';
import { accountCommands } from './commands_account.js';
const { Client, GatewayIntentBits } = pkg;

// Create and configure the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.login(process.env.DISCORD_TOKEN);

client.once('ready', () => {
  console.log('Discord client ready!');

  client.on(Events.InteractionCreate, async interaction => {
    console.log('Interaction created:', interaction);
    if (!interaction.isCommand()) return;

    const commandName = interaction.commandName;
    if (commandName === 'account') {
      const subCommandName = interaction.options.getSubcommand();
      const commandHandler = accountCommands[subCommandName];

      if (commandHandler) {
        await commandHandler(interaction);
      } else {
        console.log(`Command ${commandName} not found.`);
      }
    } else {
      console.log(`Command ${commandName} not found.`);
    }
  });
});


