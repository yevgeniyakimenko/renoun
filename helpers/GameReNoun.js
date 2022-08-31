import * as dbModel from '../dbAccessLayer.js';

export default class GameReNoun {
  #gameId;
  #playerId;
  #isUser;
  #taskWord;
  #wordList = {};
  #maxSeconds;
  #created = {};

  get gameId() {
    return this.#gameId;
  }

  get playerId() {
    return this.#playerId
  }

  get isUser() {
    return this.#isUser;
  }

  get taskWord() {
    return this.#taskWord;
  }

  get wordList() {
    return this.#wordList;
  }

  get maxSeconds() {
    return this.#maxSeconds;
  }

  get created() {
    return this.#created;
  }

  constructor(data) {
    this.#gameId = data.gameId;
    this.#playerId = data.playerId;
    this.#isUser = data.isUser;
    this.#taskWord = data.taskWord;
    this.#maxSeconds = data.maxSeconds;
    this.#created = Date.now();
  };

  static findGame(gameId) {
    if (!(this.instances[gameId])) {
      return null;
    }

    return this.instances[gameId];
  };

  static addGameInstance(gameInfo) {
    const instance = new GameReNoun(gameInfo);
    const gameId = instance.gameId;
    this.instances[gameId] = instance;
    const maxSeconds = instance.maxSeconds;
    setTimeout(() => {
      GameReNoun.deleteGameInstance(gameId);
    }, maxSeconds * 1000);
  }

  static async deleteGameInstance(gameId) {
    const game = GameReNoun.findGame(gameId);
    if ((game.isUser)) {
      const wordList = game.wordList;
      await dbModel.updateStats(game.playerId, wordList);
    } 

    delete this.instances[gameId];
  }
  
  static addWordAnswer(gameId, wordAnswer, score) {
    const game = this.findGame(gameId);
    if (!game) {
      console.log('trying to add word to non-existing game');
      return false;
    }

    const playerList = game.wordList;
    if ((Object.keys(playerList).includes(wordAnswer))) {
      return false;
    }
    
    playerList[wordAnswer] = score;
    return true;
  };

  static instances = {};
}
