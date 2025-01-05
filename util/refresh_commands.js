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
            { name: 'Mage', value: 'MAGE' }
          ))
      .addStringOption(option =>
        option.setName('race-name')
          .setDescription('Race of your character.')
          .setRequired(true)
          .addChoices(
            { name: 'Ahonu', value: 'AHONU' },
            { name: 'Manumanu', value: 'MANUMANU' },
            { name: 'Kui', value: 'KUI' }
            // { name: 'Minotaur', value: 'MINOTAUR' },
            // { name: 'Ulfur', value: 'ULFUR' }
          ))
      .addStringOption(option =>
        option.setName('personality-name')
          .setDescription('Personality of your character.')
          .setRequired(true)
          .addChoices(
            { name: 'Stoic', value: 'STOIC' },
            { name: 'Greedy', value: 'GREEDY' },
            { name: 'Nerdy', value: 'NERDY' },
            { name: 'Passionate', value: 'PASSIONATE' },
            { name: 'Horny', value: 'HORNY' },
            { name: 'Brawny', value: 'BRAWNY' },
            { name: 'Cheeky', value: 'CHEEKY' },
            { name: 'Feisty', value: 'FEISTY' },
            { name: 'Hothead', value: 'HOTHEAD' },
            { name: 'Aggressive', value: 'AGGRESSIVE' },
            { name: 'Thicc', value: 'THICC' },
            { name: 'Peaceful', value: 'PEACEFUL' },
            { name: 'Adaptable', value: 'ADAPTABLE' },
            { name: 'Bougie', value: 'BOUGIE' },
            { name: 'Stout', value: 'STOUT' },
            { name: 'Cunning', value: 'CUNNING' },
            { name: 'Hilarious', value: 'HILARIOUS' },
            { name: 'Vindictive', value: 'VINDICTIVE' },
            { name: 'Erratic', value: 'ERRATIC' },
            { name: 'Ambitious', value: 'AMBITIOUS' },
            { name: 'Thoughtful', value: 'THOUGHTFUL' },
            { name: 'Serene', value: 'SERENE' },
            { name: 'Cocky', value: 'COCKY' },
            { name: 'Traditional', value: 'TRADITIONAL' },
            { name: 'Mysterious', value: 'MYSTERIOUS' }
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
      .setRequired(false)
      .setAutocomplete(true)
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
  .setDescription('Move within the current region or explore the dungeon.')
  .addStringOption(option =>
    option.setName('destination')
      .setDescription('Select where you want to go')
      .setAutocomplete(true)
      .setRequired(true)
  );

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


const travelCommand = new SlashCommandBuilder()
  .setName('travel')
  .setDescription('Travel between regions.')
  .addStringOption(option =>
    option
      .setName('region')
      .setDescription('Select the region to travel to.')
      .setAutocomplete(true)
      .setRequired(true)
  );

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

const gatherCommand = new SlashCommandBuilder()
  .setName('gather')
  .setDescription('Gather resources from a specified node.')
  .addStringOption(option =>
    option.setName('resource')
      .setDescription('The name of the node you want to gather.')
      .setRequired(true));

const farmCommand = new SlashCommandBuilder()
  .setName('farm')
  .setDescription('Farm resources from a specified node.')
  .addStringOption(option =>
    option.setName('resource')
      .setDescription('The name of the node you want to farm.')
      .setRequired(true));

const fishCommand = new SlashCommandBuilder()
  .setName('fish')
  .setDescription('Fish resources from a specified node.')
  .addStringOption(option =>
    option.setName('resource')
      .setDescription('The name of the node you want to fish.')
      .setRequired(true));

const cookCommand = new SlashCommandBuilder()
  .setName('cook')
  .setDescription('Cook raw materials according to the recipe.')
  .addStringOption(option =>
    option.setName('recipe_name')
      .setDescription('The name of the recipe you want to use.')
      .setRequired(true));

const brewCommand = new SlashCommandBuilder()
  .setName('brew')
  .setDescription('Create potions using diverse ingredients.')
  .addStringOption(option =>
    option.setName('recipe_name')
      .setDescription('The name of the recipe you want to use.')
      .setRequired(true));

const smithCommand = new SlashCommandBuilder()
  .setName('smith')
  .setDescription('Smelt better things using diverse ingredients')
  .addStringOption(option =>
    option.setName('recipe_name')
      .setDescription('The name of the recipe you want to use.')
      .setRequired(true));

const dropCommand = new SlashCommandBuilder()
  .setName('drop')
  .setDescription('Drop item from inventory onto the floor.')
  .addStringOption(option =>
    option.setName('object')
      .setDescription('The name of the item you want to drop.')
      .setRequired(true));

const useCommand = new SlashCommandBuilder()
  .setName('use')
  .setDescription('Use a consumable object.')
  .addStringOption(option =>
    option.setName('consumable_name')
      .setDescription('The name of consumable object you want to use.')
      .setRequired(true));

const talkCommand = new SlashCommandBuilder()
  .setName('talk')
  .setDescription('Talk to an NPC.')
  .addStringOption(option =>
    option.setName('npc')
      .setDescription('The name of the NPC you want to talk to.')
      .setRequired(true)
      .setAutocomplete(true)
  );

const buyCommand = new SlashCommandBuilder()
  .setName('buy')
  .setDescription('Purchase items from the shop.')
  .addStringOption(option =>
    option.setName('object')
      .setDescription('The name of the object you want to buy.')
      .setRequired(true)
      .setAutocomplete(true)
  );

const sellCommand = new SlashCommandBuilder()
  .setName('sell')
  .setDescription('Sell items to the shop.')
  .addStringOption(option =>
    option.setName('object')
      .setDescription('The name of the object you want to sell.')
      .setRequired(true)
      .setAutocomplete(true)
  );

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
  .setDescription('Attack an enemy in the current room.')
  .addStringOption(option =>
    option.setName('enemy')
      .setDescription('The name of the enemy you want to attack.')
      .setRequired(true)
      .setAutocomplete(true)
  );

const recipeCommand = new SlashCommandBuilder()
  .setName('recipe')
  .setDescription('Displays recipes available to your character.');

const questCommand = new SlashCommandBuilder()
  .setName('quest')
  .setDescription('Displays quests you have accepted.');

const startCommand = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Start the game!');

const helpCommand = new SlashCommandBuilder()
  .setName('help')
  .setDescription('To get a brief guide on how to play the game.');

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
    gatherCommand.toJSON(),
    farmCommand.toJSON(),
    fishCommand.toJSON(),
    cookCommand.toJSON(),
    brewCommand.toJSON(),
    smithCommand.toJSON(),
    dropCommand.toJSON(),
    useCommand.toJSON(),
    talkCommand.toJSON(),
    unequipCommand.toJSON(),
    equipCommand.toJSON(),
    recipeCommand.toJSON(),
    questCommand.toJSON(),
    startCommand.toJSON(),
    helpCommand.toJSON(),
    travelCommand.toJSON(),
    buyCommand.toJSON(),
    sellCommand.toJSON()
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