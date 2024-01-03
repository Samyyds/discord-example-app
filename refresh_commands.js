import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';

const registerCommand = new SlashCommandBuilder()
  .setName('register')
  .setDescription('Create 12 words seed');

const loginCommand = new SlashCommandBuilder()
  .setName('login')
  .setDescription('Log in to your account')
  .addStringOption(option =>
    option.setName('seedphrase')
      .setDescription('Enter your seedphrase')
      .setRequired(true));

const logoutCommand = new SlashCommandBuilder()
  .setName('logout')
  .setDescription('Log out of your account');

const guildCommands =
  [
    registerCommand.toJSON(),
    loginCommand.toJSON(),
    logoutCommand.toJSON()
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

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();