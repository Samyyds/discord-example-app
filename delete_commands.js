import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import 'dotenv/config';

const clientId = process.env.APP_ID;

const token = process.env.DISCORD_TOKEN;

const commandId = '1191742729462497381';

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Start to delete global command...');
    await rest.delete(Routes.applicationCommand(clientId, commandId));
    console.log('Global command is deleted');
  } catch (error) {
    console.error('Cannot delete global command:', error);
  }
})();
