import * as dbModel from '../dbAccessLayer.js';

import { validateString } from './validateString.js';
import { checkWordInDict } from './checkDict.js';
import { checkWordInOnlineDict } from './checkOnlineDict.js';


export default async function processWord(word) {
  try {
    if (!validateString(word)) {
      return false;
    }

    const isWordInDict = await checkWordInDict(word);
    if (isWordInDict) {
      return true;
    }

    const isWordInOnlineDict = await checkWordInOnlineDict(word);
    if (isWordInOnlineDict) {
      const [dbResult] = await dbModel.addWord(word);
      return true;
    }

    return false;
    
  } catch (error) {
    console.log(error);
  }
}
