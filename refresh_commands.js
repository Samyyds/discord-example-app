import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';

const characterCommand = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Character commands')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new character')
      .addStringOption(option =>
        option.setName('character-name')
          .setDescription('Name of your character')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('class-name')
          .setDescription('Class of your character')
          .setRequired(true)
          .addChoices(
            { name: 'Warrior', value: 'WARRIOR' },
            { name: 'Rogue', value: 'ROGUE' },
            { name: 'Mage', value: 'MAGE' }
          ))
      .addStringOption(option =>
        option.setName('race-name')
          .setDescription('Race of your character')
          .setRequired(true)
          .addChoices(
            { name: 'Human', value: 'HUMAN' },
            { name: 'Draconid', value: 'DRACONID' },
            { name: 'Ogre', value: 'OGRE' },
            { name: 'Elf', value: 'ELF' }
          )))
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('View your character\'s status'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('switch')
      .setDescription('Switch your active character'));

const guildCommands =
  [
    //accountCommand.toJSON(),
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