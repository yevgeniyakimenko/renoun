import fs from 'fs/promises';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let wordsToAdd;

try {
  const dictLines = await fs.readFile(path.join(__dirname, 'wordsToAdd.txt'), 'utf8');
  wordsToAdd = dictLines.split('\n');
} catch (error) {
  console.log(error);
}

export default wordsToAdd;
