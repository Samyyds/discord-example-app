import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';

const accountCommand = new SlashCommandBuilder()
  .setName('account')
  .setDescription('Manage your account')
  .addSubcommand(subcommand =>
    subcommand
      .setName('register')
      .setDescription('Create 12 words seed'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('login')
      .setDescription('Log in to your account')
      .addStringOption(option =>
        option.setName('seedphrase')
          .setDescription('Enter your seedphrase')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('logout')
      .setDescription('Log out of your account'));

const characterCommand = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Manage your character')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new character')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('The name of the character')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('classname')
          .setDescription('The class of the character (WARRIOR, ROGUE, MAGE)')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('racename')
          .setDescription('The race of the character (HUMAN, ORGE, DRACONID, ELF)')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('View your character\'s status'));

const guildCommands =
  [
    accountCommand.toJSON(),
    characterCommand.toJSON()
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