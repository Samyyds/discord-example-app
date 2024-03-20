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
      .setDescription('Create a new character.')
      .addStringOption(option =>
        option.setName('character-name')
          .setDescription('Name of your character.')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('class-name')
          .setDescription('Class of your character.')
          .setRequired(true)
          .addChoices(
            { name: 'Warrior', value: 'WARRIOR' },
            { name: 'Rogue', value: 'ROGUE' },
            { name: 'Mage', value: 'MAGE' }
          ))
      .addStringOption(option =>
        option.setName('race-name')
          .setDescription('Race of your character.')
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
      .setDescription('View your character\'s status.'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('switch')
      .setDescription('Switch your active character.'));

const lookCommand = new SlashCommandBuilder()
  .setName('look')
  .setDescription('Look around or inspect an object/person.')
  .addStringOption(option =>
    option.setName('object')
      .setDescription('The object/person you want to inspect.')
      .setRequired(false)//optional
  );

const takeCommand = new SlashCommandBuilder()
  .setName('take')
  .setDescription('Pick up a specific object in the room.')
  .addStringOption(option =>
    option.setName('item')
      .setDescription('The name of the item you want to pick up.')
      .setRequired(true)
  );

const goCommand = new SlashCommandBuilder()
  .setName('go')
  .setDescription('Where do you want to go?')
  .addStringOption(option =>
    option.setName('region')
      .setDescription('The name of the region you want to move to.')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('room')
      .setDescription('The name of the room you want to move to.')
      .setRequired(true));

const mapCommand = new SlashCommandBuilder()
  .setName('map')
  .setDescription('Shows the adventure map.');

const inventoryCommand = new SlashCommandBuilder()
  .setName('inventory')
  .setDescription('Display your inventory.');  

const mineCommand = new SlashCommandBuilder()
  .setName('mine')
  .setDescription('Embark on a mining expedition to extract valuable ores.')
  .addStringOption(option =>
    option.setName('ore')
      .setDescription('The name of the ore you want to mine.')
      .setRequired(true));

const attackCommand = new SlashCommandBuilder()
  .setName('attack')
  .setDescription('Launch an attack! Prove your strength against the adversaries.')
  .addStringOption(option =>
    option.setName('enemy-name')
      .setDescription('The name of the enemy you want to have a fight with')
      .setRequired(true))

const guildCommands =
  [
    //accountCommand.toJSON(),
    characterCommand.toJSON(),
    goCommand.toJSON(),
    mapCommand.toJSON(),
    lookCommand.toJSON(),
    attackCommand.toJSON(),
    takeCommand.toJSON(),
    inventoryCommand.toJSON(),
    mineCommand.toJSON()
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