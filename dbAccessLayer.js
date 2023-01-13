import db from './dbConnection.js';

export async function getWord(word, callback) {
  let sqlQuery = 'SELECT word_entry FROM word WHERE word_entry=:word';
  const params = {
    word,
  };
  
  const answer = await db.query(sqlQuery, params);
  
  return answer;
};

export async function getWordsByLength(length) {
  let sqlQuery = 'SELECT word_entry FROM word WHERE CHAR_LENGTH(word_entry)=:length';
  const params = {
    length,
  };

  const answer = await db.query(sqlQuery, params);
  return answer;
};

export async function getRandomWordByLength(minLength) {
  let sqlQuery = 'SELECT word_entry FROM word WHERE CHAR_LENGTH(word_entry)>:minLength ORDER BY RAND() LIMIT 1';
  const params = {
    minLength,
  };

  const answer = await db.query(sqlQuery, params);

  return answer;
};

export async function addWord(word) {
  const sqlQuery = 'INSERT INTO word (word_entry) VALUES(:word);';
  const params = {
    word,
  };

  const answer = await db.query(sqlQuery, params);
  return answer;
};

export async function getUser(username) {
  let sqlQuery = 'SELECT * FROM user WHERE (username=:username)';
  const params = {
    username,
  };

  const answer = await db.query(sqlQuery, params);

  if (answer[0].length === 0) {
    return null;
  }

  return {
    username: answer[0][0].username,
    hash: answer[0][0].hash,
    gamesPlayed: answer[0][0].games_played,
    totalPoints: answer[0][0].total_points,
    highestScore: answer[0][0].highest_score,
    totalWords: answer[0][0].total_words,
    vocabSize: answer[0][0].vocab_size,
    longestWord: answer[0][0].longest_word,
    highestScore: answer[0][0].highest_score,
  }
};

export async function addUser(username, hash) {
  const sqlQuery = 'INSERT INTO user (username, hash) VALUES(:username, :hash);';
  const params = {
    username,
    hash,
  };

  const answer = await db.query(sqlQuery, params);
  return answer; 
};

export async function updateStats(username, wordList) {
  const user = await getUser(username);
  const gamesPlayed = +user.gamesPlayed + 1;
  const vocabSize = +user.vocabSize;
  let longestWord = user.longestWord;
  const totalWords = +user.totalWords + Object.keys(wordList).length;
  let totalPoints = +user.totalPoints;
  

  let gameScore = 0;

  for (const word in wordList) {
    if (!longestWord || word.length >= longestWord.length) {
      longestWord = word;
    }

    if (Object.hasOwnProperty.call(wordList, word)) {
      const wordScore = +wordList[word];
      gameScore += wordScore;
    }
  }

  totalPoints += gameScore;
  const highestScore = (+user.highestScore > gameScore) ? user.highestScore : gameScore;

  const vocabQuery = 'INSERT INTO user_word (user_id, word_id, times_used) VALUES ((SELECT user_id FROM user WHERE username = :username), (SELECT word_id FROM word WHERE word_entry = :word), 1) ON DUPLICATE KEY UPDATE times_used = times_used + 1;';

  const vocabSizeQuery = 'SELECT COUNT(*) as count FROM user_word WHERE user_id = (SELECT user_id FROM user WHERE username = :username);';
  const vocabSizeParams = {
    username,
  }

  const statsQuery = 'UPDATE user SET games_played = :gamesPlayed, vocab_size = :vocabSize, longest_word = :longestWord, total_words = :totalWords, total_points = :totalPoints, highest_score = :highestScore WHERE (username = :username);';

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    /* Object.keys(wordList).forEach(async (word) => {
      const vocabParams = {
        username,
        word,
      }
  
      await conn.query(vocabQuery, vocabParams);
    }); */

    for (const word of Object.keys(wordList)) {
      const vocabParams = {
        username,
        word,
      };
  
      await conn.query(vocabQuery, vocabParams);
    }

    const vocabSize = await conn.query(vocabSizeQuery, vocabSizeParams);

    const statsParams = {
      gamesPlayed,
      vocabSize: vocabSize[0][0].count,
      longestWord,
      totalWords,
      totalPoints,
      highestScore,
      username,
    };

    await conn.query(statsQuery, statsParams);
  } catch (error) {
    console.log(error)
    if (conn) {
      await conn.rollback();
    } 
  } finally {
    if (conn) {
      
      await conn.commit();
      await conn.release();
      console.log('committing transaction finished')
    }
  }
};

export async function getVocabSize(username) {
  const sqlQuery = 'SELECT COUNT(*) as count FROM user_word WHERE user_id = (SELECT user_id FROM user WHERE username = :username);';
  const params = {
    username,
  }

  const answer = await db.query(sqlQuery, params);
  return answer[0][0].count;
};

export async function getVocab(data) {
  const { username, pageNumber, pageSize, orderByTimesUsed, descending } = data;

  const offset = (+pageNumber - 1) * pageSize;
  const limit = pageSize;

  const firstOrderBy = orderByTimesUsed ? 'times_used' : 'word_entry';
  const secondOrderBy = orderByTimesUsed ? ', word_entry' : '';
  const desc = descending ? 'DESC' : '';
  const orderBy = firstOrderBy + ' ' + desc + secondOrderBy;

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const listQuery = 'SELECT word_entry, times_used FROM user_word JOIN word ON user_word.word_id = word.word_id WHERE user_id = (SELECT user_id FROM user WHERE username = :username) ORDER BY ' + orderBy + ' LIMIT :offset, :limit;';
    const listParams = {
      username,
      orderBy,
      offset,
      limit,
    };
  
    const answer = await conn.query(listQuery, listParams);
    const list = answer[0];

    const vocabSizeQuery = 'SELECT COUNT(*) as count FROM user_word WHERE user_id = (SELECT user_id FROM user WHERE username = :username);';
    const vocabSizeParams = {
      username,
    }

    const vocabSize = await conn.query(vocabSizeQuery, vocabSizeParams);

    return {
      vocabSize: vocabSize[0][0].count,
      list,
    };
  } catch (error) {
    console.log(error);
    if (conn) await conn.rollback();
  } finally {
    if (conn) await conn.release();
  }
};

export async function addWordsToVocab(username, wordList) {
  const vocabQuery = 'INSERT INTO user_word (user_id, word_id, times_used) VALUES ((SELECT user_id FROM user WHERE username = :username), (SELECT word_id FROM word WHERE word_entry = :word), 1) ON DUPLICATE KEY UPDATE times_used = times_used + 1;';

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();
    Object.keys(wordList).forEach(async (word) => {
      const vocabParams = {
        username,
        word,
      }
  
      await conn.query(vocabQuery, vocabParams);
    });
  } catch (err) {
    console.log(err);
    if (conn) await conn.rollback();
  } finally {
    if (conn) await conn.release();
  }
};
