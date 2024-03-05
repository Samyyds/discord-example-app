import { LocationType } from '../data/enums.js';

export function convertBigInt(obj) {
    let newObj = {};
    for (let key in obj) {
        if (typeof obj[key] === 'bigint') {
            // Convert BigInt to String for the new object
            newObj[key] = obj[key].toString();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursive call for nested objects
            newObj[key] = convertBigInt(obj[key]);
        } else {
            // Copy other values as is
            newObj[key] = obj[key];
        }
    }
    return newObj;
}

export function formatCharacterInfo(character) {
    let formattedString = '';
    for (const key in character) {
        if (typeof character[key] === 'object') {
            formattedString += `${key}:\n${formatCharacterInfo(character[key])}\n`;
        } else {
            formattedString += `${key}: ${character[key]}\n`;
        }
    }
    return formattedString;
}

export function addCharacterInfoToEmbed(activeChar, embed) {
    for (const key in activeChar) {
        let value;
        if (typeof activeChar[key] === 'object') {
            value = formatCharacterInfo(activeChar[key]);
        } else {
            value = activeChar[key].toString();
        }

        if (value === '') {
            value = 'N/A';
        }

        embed.addFields({ name: key, value: value, inline: true });
    }
    return embed;
}

export function getKeyByValue(enumObj, value) {
    return Object.keys(enumObj).find(key => enumObj[key] === value);
}

export function parseLocationJson(locationString) {
    const [regionName, roomName] = locationString.split(' ');
    const region = Object.values(LocationType).find(region => region.name.toLowerCase() === regionName.toLowerCase());
    if (!region) return null;
    const room = Object.values(region.rooms).find(room => room.name.toLowerCase() === roomName.toLowerCase());
    return { regionId: region.index, roomId: room ? room.index : 0 };
}
