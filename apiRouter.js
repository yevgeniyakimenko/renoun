import express from 'express';

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import axios from 'axios';

import * as dbModel from './dbAccessLayer.js';
import processWord from './helpers/processWord.js';
import scoreCalc from './helpers/scoreCalc.js';
import GameReNoun from './helpers/GameReNoun.js';

const minTaskWordLength = process.env.MINWORDLENGTH;
const defaultGameLength = 120;
const defaultVocabPagesize = 50;

const apiRouter = express.Router();

apiRouter.get('/getword', async (req, res) => {
  if (!(req.session.playerId)) {
    // if you're not a logged in user, you're a guest
    req.session.isUser = false;
    req.session.playerId = uuidv4();
    req.session.game = null;
  }

  req.session.timestamp = Date.now();

  const isUser = req.session.isUser;
  const playerId = req.session.playerId;

  // try to retrieve existing game
  if (req.session.game) {
    console.log('session', req.session);
    const gameId = req.session.game.gameId;
    const gameFound = GameReNoun.findGame(gameId);
    if (gameFound) {
      const secondsElapsed = Math.ceil((Date.now() - gameFound.created) / 1000);
      const secondsLeft = gameFound.maxSeconds - secondsElapsed;
      res.json({
        loggedIn: req.session.isUser,
        taskWord: gameFound.taskWord,
        secondsLeft,
        maxSeconds: gameFound.maxSeconds,
        wordList: gameFound.wordList,
      });
      return;
    } else {
      req.session.game = null;
    }
  }

  // instantiate a new game
  try {
    let secondsLeft;
    let maxSeconds;
    secondsLeft = defaultGameLength;
    maxSeconds = defaultGameLength;

    const [dbResult] = await dbModel.getRandomWordByLength(minTaskWordLength);
    if (!(dbResult[0].word_entry)) {
      console.log(`couldn't find a suitable word in database`);
      res.json({});
      return;
    }

    const taskWord = dbResult[0].word_entry;
    const gameId = uuidv4();
    req.session.game = {
      gameId,
      taskWord,
      maxSeconds,
    };

    const gameInfo = {
      gameId,
      isUser,
      taskWord,
      playerId,
      maxSeconds,
    };

    GameReNoun.addGameInstance(gameInfo);

    res.json({
      taskWord,
      secondsLeft,
      maxSeconds,
    });
  } catch (error) {
    console.log(error);
  }
});

apiRouter.post('/wordanswer', async (req, res) => {
  if (!(req.session.game)) {
    console.log(new Error('user submitting a word wihout a game stored in session'));
    res.json({ submission: 'error' });
    return;
  }

  req.session.timestamp = Date.now();

  const wordAnswer = req.body.wordAnswer;
  if (!wordAnswer) {
    console.log(new Error(`user submitting an empty wordAnswer`));
    res.json({ submission: 'error' });
    return;
  }

  const taskWord = req.session.game.taskWord;

  if (taskWord === wordAnswer) {
    console.log(new Error(`can't use the whole task word`));
    res.json({
      submission: 'fail',
      wordAnswer,
      score: 0,
      message: `can't use the whole task word`,
    });
    return;
  }

  // make sure the submitted word is derived from the task word
  let wordArr = wordAnswer.split('');
  let taskWordArr = taskWord.split('');
  for (let index = wordArr.length - 1; index >= 0; index--) {
    const letter = wordArr[index];
    if (!(taskWordArr.includes(letter))) {
      console.log(new Error(`wrong word answer '${wordAnswer}' for task word '${taskWord}'`));
      res.json({
        submission: 'error',
      });
      return;
    }

    wordArr.splice(wordArr.indexOf(letter), 1);
    taskWordArr.splice(taskWordArr.indexOf(letter), 1);
  }

  try {
    req.session.timestamp = Date.now();

    if (!(req.session.game)) {
      res.json({
        submission: 'fail',
        wordAnswer,
        score: 0,
        message: `Your game has ended`,
      });
      return;
    }

    const gameId = req.session.game.gameId;
    const playerId = req.session.playerId;
    const game = GameReNoun.findGame(gameId);
    if (!game) {
      res.json({
        submission: 'fail',
        wordAnswer,
        score: 0,
        message: `Your game has ended`,
      });
      return;
    }

    const isWord = await processWord(wordAnswer);

    if (!isWord) {
      res.json({
        submission: 'fail',
        wordAnswer,
        score: 0,
        message: `Couldn't find noun '${wordAnswer}' in dictionary`,
      });
      return;
    }

    const score = scoreCalc(wordAnswer);

    const newWord = GameReNoun.addWordAnswer(gameId, wordAnswer, score);

    if (!newWord) {
      res.json({
        submission: 'fail',
        wordAnswer,
        score: 0,
        message: `You already submitted '${wordAnswer}'`,
      });
      return;
    }

    res.json({
      submission: 'success',
      wordAnswer,
      score,
    });
  } catch (error) {
    console.log(error);
  }
});

apiRouter.post('/signup', async (req, res) => {
  req.session.game = null;
  req.session.timestamp = Date.now();

  try {
    const { username, password, captcha } = req.body;

    if (!username || !password) {
      throw `missing string in username '${username}' or password '${password}'`;
    }

    if (
      username.length < 6
      || username.length > 12
    ) {
      throw `wrong username length: '${username}'`;
    }

    if (
      password.length < 8
      || password.length > 16
    ) {
      throw `wrong password length: '${password}'`;
    }

    const captchaVerify = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.CAPTCHASECRET,
          response: captcha,
        }
      }
    );
    const captchaSuccess = captchaVerify.data.success;
    if (!captchaSuccess) {
      throw ('captcha error: ' + JSON.stringify(captchaVerify.data));
    }

    const hash = await bcrypt.hash(password, 12);
    await dbModel.addUser(username, hash);

    req.session.isUser = true;
    req.session.playerId = username;
    res.json({ 
      isLoggedIn: true,
      message: 'sign up successful',
    });
  } catch (error) {
    console.log(error);
    let message;
    if (error.code === 'ER_DUP_ENTRY') {
      message = 'This username is already taken. Please choose a different one.';
    } else {
      message = 'Something went wrong. Please try again later.';
    }
    req.session.isUser = false;
    res.json({
      isLoggedIn: false,
      message,
    });
  }
});

apiRouter.post('/login', async (req, res) => {
  req.session.game = null;
  req.session.timestamp = Date.now();
  try {
    const { username, password, captcha } = req.body;

    const captchaVerify = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.CAPTCHASECRET,
          response: captcha,
        }
      }
    );
    const captchaSuccess = captchaVerify.data.success;
    if (!captchaSuccess) {
      throw ('captcha error: ' + JSON.stringify(captchaVerify.data));
    }

    const user = await dbModel.getUser(username);
    if (!user) {
      throw `${username}: no such user in the database`;
    }
  
    const pwdMatch = await bcrypt.compare(password, user.hash);
    if (!pwdMatch) {
      throw 'password mismatch';
    }
  
    req.session.isUser = true;
    req.session.playerId = user.username;
    res.json({ 
      isLoggedIn: true,
      message: 'log in successful',
    });
  } catch (error) {
    console.log(error);
    req.session.isUser = false;
    req.session.playerId = uuidv4();
    res.json({ 
      isLoggedIn: false,
      message: 'Something went wrong. Please make sure your username and password inputs are correct.',
    });
    return;
  }
});

apiRouter.post('/logout', async (req, res) => {
  req.session.isUser = false;
  req.session.playerId = uuidv4();
  req.session.game = null;
  req.session.timestamp = Date.now();
  res.json({ 
    isLoggedIn: false,
    message: 'logged out',
  });
});

apiRouter.get('/stats', async (req, res) => {
  if (!(req.session.isUser)) {
    res.json({
      statsFound: false,
      message: 'no stats for guests',
    });
    return;
  }

  req.session.timestamp = Date.now();

  const user = await dbModel.getUser(req.session.playerId);
  // const vocabSize = await dbModel.getVocabSize(req.session.playerId);
  res.json({
    username: user.username,
    gamesPlayed: user.gamesPlayed,
    totalPoints: user.totalPoints,
    highestScore: user.highestScore,
    totalWords: user.totalWords,
    longestWord: user.longestWord,
    vocabSize: user.vocabSize,
  });
});

apiRouter.put('/vocab', async (req, res) => {
  if (!(req.session.isUser)) {
    res.json({
      statsFound: false,
      message: 'no vocabulary for guests',
    });
    return;
  }

  req.session.timestamp = Date.now();

  const username = req.session.playerId;
  
  const { pageNumber, orderByTimesUsed, descending } = req.body;
  const pageSize = req.body.pageSize ? req.body.pageSize : defaultVocabPagesize;

  const { vocabSize, list } = await dbModel.getVocab({
    username, 
    pageNumber, 
    pageSize, 
    orderByTimesUsed, 
    descending,
  });

  res.json({
    username,
    vocabSize,
    pageSize,
    list,
    orderByTimesUsed,
    descending,
  });
});

export default apiRouter;