import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';

const subCommand = new SlashCommandBuilder()
  .setName('sub')
  .setDescription('Experience the full game.');

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
      .setDescription('Enter the name of the region you want to go to.')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('location')
      .setDescription('Enter the name of the location you want to go to.')
      .setRequired(true));

const moveCommand = new SlashCommandBuilder()
  .setName('move')
  .setDescription('Navigate between rooms in your current location.')
  .addIntegerOption(option =>
    option.setName('direction')
      .setDescription('Select a direction to move.')
      .setRequired(true)
      .addChoices(
        { name: 'up', value: 1 },
        { name: 'down', value: 0 }
      ));

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

const dropCommand = new SlashCommandBuilder()
  .setName('drop')
  .setDescription('Drop item from inventory onto the floor.')
  .addStringOption(option =>
    option.setName('object')
      .setDescription('The name of the item you want to drop.')
      .setRequired(true));

const unequipCommand = new SlashCommandBuilder()
  .setName('unequip')
  .setDescription('Unequip an equipment.')
  .addStringOption(option =>
    option.setName('object')
      .setDescription('The name of the equipment you want to unequip.')
      .setRequired(true));

const equipCommand = new SlashCommandBuilder()
  .setName('equip')
  .setDescription('equip an equipment.')
  .addStringOption(option =>
    option.setName('object')
      .setDescription('The name of the equipment you want to equip.')
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
    subCommand.toJSON(),
    characterCommand.toJSON(),
    goCommand.toJSON(),
    moveCommand.toJSON(),
    mapCommand.toJSON(),
    lookCommand.toJSON(),
    attackCommand.toJSON(),
    takeCommand.toJSON(),
    inventoryCommand.toJSON(),
    mineCommand.toJSON(),
    dropCommand.toJSON(),
    unequipCommand.toJSON(),
    equipCommand.toJSON()
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