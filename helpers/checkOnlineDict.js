import path from 'path';
import url from 'url';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { addCandidateWord } from '../dbAccessLayer.js';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const thesKey = process.env.THES;
const learnerKey = process.env.LEARN;
const thesURL = 'https://www.dictionaryapi.com/api/v3/references/thesaurus/json/';
const learnerURL = 'https://www.dictionaryapi.com/api/v3/references/learners/json/';
const freeURL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

export async function checkWordInOnlineDict(word) {
  const learnerQuery = `${learnerURL}${word}?key=${learnerKey}`;
  const thesQuery = `${thesURL}${word}?key=${thesKey}`;
  const freeQuery = `${freeURL}${word}`;
  try {
    // check Learner's
    const learnArr = await axios.get(learnerQuery);
    for (const res of learnArr.data) {
      // res.hwi contains headword information
      // res.hwi.hw contains the headword, which may be split with '*' denoting the stressed syllable
      // res.fl contains the part of speech
      if (
        res.hwi 
        && res.fl 
        && res.fl === 'noun'
        && res.hwi.hw.split('*').join('') === word 
      ) {
        let plural = false;
        // check sls (subject status label) whether the word is plural form only
        if (res.sls) {
          const slsArr = res.sls;
          for (const sl of slsArr) {
            if (!(sl.includes('plural'))) {
              plural = false;
              break;
            } else {
              plural = true;
            }
          }
        }

        if (plural) {
          continue;
        }

        if (res.meta.offensive) {
          return false;
        }

        return true;
      }
    }

    // check Thesaurus
    const thesArr = await axios.get(thesQuery);

    for (const res of thesArr.data) {
      if (
        res.hwi 
        && res.hwi.hw === word 
        && res.fl 
        && res.fl === 'noun'
      ) {
        let plural = false;
        // check sls (subject status label) whether the word is only a plural form
        if (res.sls) {
          const slsArr = res.sls;
          for (const sl of slsArr) {
            if (!(sl.includes('plural'))) {
              plural = false;
              break;
            } else {
              plural = true;
            }
          }
        }

        if (plural) {
          continue;
        }

        if (res.meta.offensive) {
          return false;
        }

        return true;
      }
    }

    // Free Dictionary results are less reliable, put matches into manual review
    const freeRes = await axios.get(freeQuery, {
      validateStatus: function (status) {
        return (status >= 200 && status < 300) || status === 404; // default
      },

    });

    if (!(Array.isArray(freeRes.data))) {
      return false;
    }

    const defArr = [];
    for (const res of freeRes.data) {
      if (res.word && res.word === word) {
        const { meanings } = res;
        for (const meaning of meanings) {
          if (meaning.partOfSpeech === 'noun') {
            const { definitions } = meaning;
            for (const item of definitions) {
              defArr.push(item.definition);
            }
          }
        }
      }
    }

    // add to a special table for review
    if (defArr.length) {
      await addCandidateWord({
        word: word,
        definitions: defArr.join('\n')
      });
    }

    return false;
  } catch (error) {
    console.log(error);
  }
}
