import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const guildCommands = [
  {
    name: 'register',
    description: 'Create 12 words seed',
    type: 1
  },
];

const globalCommands = [
  {
    name: 'test',
    description: 'testing network',
    type: 1
  },
];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // GuildCommands
    await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: guildCommands },
    );

    //globalCommands
    await rest.put(
      Routes.applicationCommands(process.env.APP_ID),
      { body: globalCommands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();