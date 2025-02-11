const SIGNUP_MESSAGE = `Your new account has been created, and you are now logged in!

When you are ready to continue, type /start to start your adventure!

>>> **IMPORTANT:**
>>> Download and save your recovery phrase!!! <<<
The recovery phrase for this account is attached to this message.
You will occasionally need it to log back in.

**WARNING:**
We do not store your recovery phrase; it is your responsibility to keep it safe and not to lose it.
Never share this recovery phrase with anyone else.
Our team members will never ever ask you for your recovery phrase.
Only trust this bot with the recovery phrase.`;

const LOGIN_DES = `In this game, you can explore, chat with your friends, go mining, craft weapons, and fight monsters.
If you ever need help, use the /help command.

To start, create a new account, or login to an existing account.`;

const MAP_STRING = `
Game World Map

Moku'ah ───┬── Village Center
           ├── Blacksmith
           ├── Farm [S]
           ├── Tavern
           ├── Clinic
           ├── Dock
           ├── Jungle
           └── Volcano [S]

Nyra ──────┬── Town
           ├── Crafthouse
           ├── Tavern
           ├── Beach
           ├── Labyrinth
           └── Hospital

Isfjall ───┬── City Center [S]
           ├── Blacksmith [S]
           ├── Dock [S]
           ├── Tundra [S]
           └── Hospital [S]
           
The 
Trench ────┬── Entrance
           ├── The Shallows
           ├── The Depths [S]
           └── Obsidian City [S]

⭐️ indicates your current location
[S] indicates Subscriber Only locations
`;

const HELP_STRING = `
This is Merfolk & Magic, a text-based MMO where you explore regions, fight monsters, craft items, and gain experience.

You control your character and interact with the world using slash commands. Here is a list of the most commonly used commands.

/look - Look around you in general. This is useful for identifying key points of interest in your area.

/look (target) - Look carefully at a specific thing. This is useful for retrieving detailed information about something.

/go (region/room) - Move to a new location. You must specify both arguments. In dungeons, you can only use this syntax on the entrance floor.

/go (in/back) - Move sequentially further in or back out to a room within your region. You will move one unit in or out.

/map - Display your current position in the world. Useful in conjunction with /go.

/quest - Display a list of your active quests and completed quests.

/attack (target) - Requires a target. You can attempt to attack something by specifying its name. Not everything can be attacked.

/talk (target) - Requires a target. You can attempt to talk to someone by specifying their name. Talking to people is critical for receiving quests or using services.

/inventory - Display a list of what is in your inventory.

/recipes - Display a list of your known recipes.

/character create - Creates a character. You will also pick their name, class, race, and personality. These cannot be changed after creation.

/character status - Shows you information about your character, including their level, name, class, race, personality, stats, skills, and unlocked abilities.

/character switch - Switch between active characters. Inventories are not shared.

/harvest - Harvest crops from something. The target should be something field or farm-like.

/gather - Gather from something. The target should be something bush or tree-like.

/mine - Mine  minerals from something. The target should be something stone or ore-like.

/fish - Fish at a location.

/cook - Cook a meal. Requires you to be near an appropriate cooking station.

/brew - Brew a drink, elixir, or concoction. Requires you to be near an appropriate brewing 
Station.

/smelt - Smelt an ore. Requires you to be near an appropriate facility.

/use - Consume or imbibe a beneficial item from your inventory.

`;

const descriptions = {
    SIGNUP_MESSAGE,
    LOGIN_DES,
    MAP_STRING,
    HELP_STRING
};



export default descriptions;