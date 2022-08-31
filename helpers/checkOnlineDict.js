import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import axios from 'axios';
import * as dotenv from 'dotenv';

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
      if (res.hwi && res.hwi.hw === word && res.fl && res.fl === 'noun') {
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

        console.log('learners true');
        return true;
      }
    }

    // check Thesaurus
    const thesArr = await axios.get(thesQuery);

    for (const res of thesArr.data) {
      if (res.hwi && res.hwi.hw === word && res.fl && res.fl === 'noun') {
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

        console.log('thesaurus true');
        return true;
      }
    }

    // Free Dictionary results are less reliable, put matches into manual review
    const freeArr = await axios.get(freeQuery, {
      validateStatus: function (status) {
        return (status >= 200 && status < 300) || status === 404; // default
      },

    });

    if (!(Array.isArray(freeArr.data))) {
      return false;
    }

    for (const res of freeArr.data) {
      if (res.word && res.word === word) {
        const meanings = res.meanings;
        for (const meaning of meanings) {
          if (meaning.partOfSpeech === 'noun') {
            const defArr = [];
            const definitions = meaning.definitions;
            for (const definition of definitions) {
              defArr.push(definition.definition);
            }
            const wordStr = word + '\n' + defArr.join('\n') + '\n\n';
            // await fs.appendFile(path.join(__dirname, 'toReview.txt'), wordStr);
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.log(error);
  }
}