import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import 'dotenv/config';

const clientId = process.env.APP_ID;

const token = process.env.DISCORD_TOKEN;

const guildId = process.env.GUILD_ID;

const commandId = '1194288478570172426';

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Start to delete guild command...');
    await rest.delete(Routes.applicationGuildCommand(clientId, guildId, commandId));
    console.log('Guild command is deleted');
  } catch (error) {
    console.error('Cannot delete guild command:', error);
  }
})();
