import 'dotenv/config';
import pkg, { Events } from 'discord.js';
import { commands } from './commands_account.js';
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
    const commandHandler = commands[commandName];

    if (commandHandler) {
      await commandHandler(interaction);
    } else {
      console.log(`Command ${commandName} not found.`);
    }
  });

});


