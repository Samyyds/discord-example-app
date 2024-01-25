import fs from 'fs';
import path from 'path';

function getABI(name){
    try {
        const abiPath = path.join(path.resolve(), 'abi', `${name}.abi`);
        console.log(`Trying to read from: ${abiPath}`);

        const abiContent = fs.readFileSync(abiPath, 'utf8');
        return JSON.parse(abiContent);
    } catch (error) {
        console.error(`Error reading ABI file: ${error.message}`);
        throw error;
    }
}

const abiFileName = 'CharacterProperties'; 
const abi = getABI(abiFileName);
console.log(abi);

