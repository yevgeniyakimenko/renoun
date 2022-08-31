const newGamePrompt = document.querySelector('.new-game-prompt');
const activeGameSection = document.querySelector('.active-game-section');
const startGameButton = document.querySelector('.start-game-button');

const taskBlock = document.querySelector('.task-block');
const backSpaceButton = document.querySelector('.backspace');
const submitButton = document.querySelector('.submit-button');
const wordInput = document.querySelector('.recreate-input');
const subbedWordList = document.querySelector('.subbed-word-list');

const scoreSpan = document.querySelector('.recreate-score');
const scorePara = document.querySelector('.recreate-score-para');
const newScoreDiv = document.querySelector('.new-score-div');
const newScorePara = document.querySelector('.new-score-para');

const homeLink = document.querySelector('.home-link');
const navStart = document.querySelector('.navbar-start');
const logOutDiv = document.querySelector('.logout-div');
const logOutAnchor = document.querySelector('.logout-anchor');

const loadingDiv = document.querySelector('.loading-div');
const gameHelpModal = document.querySelector('.help-modal');
const progressDiv = document.querySelector('.progress-div');
const gameTimer = document.querySelector('.game-progress');
const countdown = document.querySelector('.countdown');

const buttonToggleClasses = ['unpressed', 'pressed', 'is-focused', 'is-static'];
const userWordArr = [];
let unpressedLetterButtons = [];
let pressedLetterButtons = [];
let unusedLetterArr = [];
let totalScore = 0;
let gameTimerCount;

function makeLetterButton(letter) {
  const letterButton = document.createElement('button');
  letterButton.classList.add(
    'letter-button', 
    'button', 
    'is-medium',
    'is-link', 
    'is-outlined', 
    'is-family-monospace', 
    'mr-2', 
    'mb-4',
    'unpressed',
  );
  const buttonText = document.createTextNode(letter);
  letterButton.appendChild(buttonText);
  taskBlock.appendChild(letterButton);
}

function addSubbedWord(data) {
  userWordArr.push(data.returnedWord);
  const wordPara = document.createElement('p');
  wordPara.innerHTML = data.returnedWord + ' ';
  const addedScoreSpan = document.createElement('span');
  addedScoreSpan.innerHTML = '+' + data.addedScore;
  addedScoreSpan.classList.add('has-text-primary');
  wordPara.appendChild(addedScoreSpan);
  const userWords = document.querySelectorAll('.user-word');
  const firstWord = userWords.length ? userWords[0] : null;
  subbedWordList.insertBefore(wordPara, firstWord);
  wordPara.classList.add('user-word');
}

function cleanUpBoard() {
  window.removeEventListener('beforeunload', preventNav);
  window.removeEventListener("keydown", processKeyboard);
  submitButton.disabled = true;
  document.querySelectorAll('.letter-button').forEach(button => {
    button.disabled = true;
  });
  document.querySelector('.play-controls-div').classList.add('is-hidden');
  document.querySelector('.progress-div').classList.add('is-hidden');

  document.querySelector('.result-box').classList.remove('is-hidden');
  document.querySelector('.total-score-span').innerHTML = totalScore;
  document.querySelector('.total-words-span').innerHTML = userWordArr.length;

  document.querySelector('.navbar-start').classList.remove('is-hidden');

  document.querySelector('.play-again-button').focus();
  document.querySelector('.play-again-button').addEventListener('click', (event) => {
    event.preventDefault();
    location.reload();
  });
  setTimeout(() => {
    document.querySelector('.game-result-div').classList.toggle('animate__flash');
  }, 400);
}

function preventNav(uloadEvent) {
  uloadEvent.preventDefault();
  uloadEvent.returnValue = true;
}

function deleteLetter() {
  /* console.log('pressed:', pressedLetterButtons);
  console.log('unpressed', unpressedLetterButtons); */
  const lastButton = pressedLetterButtons.pop();

  if (lastButton) {
    unpressedLetterButtons.push(lastButton);
    buttonToggleClasses.forEach(className => {
      lastButton.classList.toggle(className);
    });
    wordInput.value = wordInput.value.slice(0, wordInput.value.length - 1);
  }
}

function processKeyboard(keyboardEvent) {
  keyboardEvent.preventDefault();
  const key = keyboardEvent.key;

  if (key === 'Backspace') {
    deleteLetter();
    return;
  }

  if (key === 'Enter') {
    submitButton.click();
    return;
  }

  const matchingButton = unpressedLetterButtons.find(button => {
    return button.innerHTML === key.toLowerCase();
  });
  if (matchingButton) {
    matchingButton.click();
  }
}

function playGame(response) {
  wordInput.value = '';

  window.addEventListener('beforeunload', preventNav);
  window.addEventListener("keydown", processKeyboard);

  const word = response.data.taskWord;
  document.querySelector('.task-word').innerHTML = word;
  for (const letter of word) {
    makeLetterButton(letter);
  }

  const letterList = taskBlock.childNodes;
  letterList.forEach((button) => {
    unpressedLetterButtons.push(button);

    // prevent button from taking focus on mouse click
    button.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const taskWord = document.querySelector('.task-word').innerHTML;
      if (
        !(event.target.innerHTML.length === 1
        && (taskWord.includes(event.target.innerHTML)))
      ) {
        console.log('wrong input, cancelling the action');
        return;
      }

      buttonToggleClasses.forEach(className => {
        button.classList.toggle(className);
      });
      unpressedLetterButtons.splice(unpressedLetterButtons.indexOf(button), 1);
      pressedLetterButtons.push(button);
      wordInput.value = wordInput.value + button.innerHTML;
    });
  });

  let secondsLeft = response.data.secondsLeft ? parseInt(response.data.secondsLeft, 10) : 120;
  let maxSeconds = response.data.maxSeconds ? parseInt(response.data.maxSeconds, 10) : 120;
  gameTimer.max = maxSeconds;
  gameTimer.value = 0;
  countdown.innerHTML = secondsLeft;

  gameTimerCount = setInterval(() => {
    secondsLeft -= 1;
    gameTimer.value = maxSeconds - secondsLeft;
    countdown.innerHTML = secondsLeft;

    if (secondsLeft === 10) {
      gameTimer.classList.remove('is-link');
      gameTimer.classList.add('is-danger');
    }

    if (secondsLeft <= 0) {
      clearInterval(gameTimerCount);
      cleanUpBoard();
    }
  }, 1000);

  // if an old game is in progress, fill in the player's exsisting word list
  if (response.data.wordList) {
    const wordList = response.data.wordList;
    Object.keys(wordList).forEach(returnedWord => {
      const addedScore = wordList[returnedWord];
      addSubbedWord({ returnedWord, addedScore });
    });
  }
}

const isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
if (isLoggedIn) {
  navStart.classList.remove('is-hidden');
  logOutAnchor.addEventListener('click', (event) => {
    event.preventDefault();
    axios.post('/api/v1/logout')
    .then(() => {
      localStorage.clear();
      location.href = '/';
    })
    .catch((error) => console.log(error));
  });
}

startGameButton.focus();

startGameButton.addEventListener('click', (event) => {
  event.preventDefault();

  document.querySelector('.navbar-start').classList.add('is-hidden');

  newGamePrompt.classList.add('is-hidden');
  activeGameSection.classList.remove('is-hidden');

  loadingDiv.classList.toggle('is-hidden');
  axios.get('/api/v1/getword')
  .then((response) => {
    loadingDiv.classList.toggle('is-hidden');
    playGame(response);
  })
  .catch((error) => {
    console.log(error);
  });
});

backSpaceButton.addEventListener('click', (event) => {
  event.preventDefault();
  deleteLetter();
});

submitButton.addEventListener('click', (event) => {
  loadingDiv.classList.toggle('is-hidden');

  // don't allow words already submitted
  if ((userWordArr.includes(wordInput.value))) {
    loadingDiv.classList.toggle('is-hidden');

    newScorePara.classList.toggle('has-text-primary');
    newScoreDiv.classList.toggle('has-text-danger');
    newScorePara.innerHTML = `"${wordInput.value}" already submitted`;
    newScoreDiv.classList.toggle('is-hidden');
    setTimeout(() => {
      newScoreDiv.classList.toggle('animate__fadeOut');
    }, 500);
    setTimeout(() => {
      newScoreDiv.classList.toggle('is-hidden');
      newScorePara.innerHTML = '';
      newScoreDiv.classList.toggle('animate__fadeOut');
      newScoreDiv.classList.toggle('has-text-danger');
      newScorePara.classList.toggle('has-text-primary');
    }, 1300);

    return;
  }

  axios.post('/api/v1/wordanswer', { wordAnswer: wordInput.value })
    .then((response) => {
      loadingDiv.classList.toggle('is-hidden');
      if (
        !(response.data)
        || response.data.submission === 'error'
      ) {
        wordInput.value = '';
        pressedLetterButtons.forEach((button) => {
          button.classList.toggle('unpressed', 'pressed', 'is-focused', 'is-static');
          unpressedLetterButtons.push(button);
        });

        pressedLetterButtons = [];
        return;
      }

      const returnedWord = response.data.wordAnswer;

      if (response.data.submission === 'fail') {
        if (response.data.message === 'Your game has ended') {
          clearInterval(gameTimerCount);
          cleanUpBoard();
          return;
        }

        newScorePara.classList.toggle('has-text-primary');
        newScoreDiv.classList.toggle('has-text-danger');
        newScorePara.innerHTML = `${response.data.message}`;
        newScoreDiv.classList.toggle('is-hidden');
        setTimeout(() => {
          newScoreDiv.classList.toggle('animate__fadeOut');
        }, 500);
        setTimeout(() => {
          newScoreDiv.classList.toggle('is-hidden');
          newScorePara.innerHTML = '';
          newScoreDiv.classList.toggle('animate__fadeOut');
          newScoreDiv.classList.toggle('has-text-danger');
          newScorePara.classList.toggle('has-text-primary');
        }, 1300);
      }

      const addedScore = parseInt(response.data.score, 10);
      totalScore += addedScore;

      if (response.data.submission === 'success') {
        addSubbedWord({ returnedWord, addedScore });
      }

      scoreSpan.innerHTML = parseInt(scoreSpan.innerHTML, 10) + addedScore;
      if (addedScore > 0) {
        newScorePara.innerHTML = `+${addedScore} points`;
        newScoreDiv.classList.toggle('is-hidden');
        newScoreDiv.classList.toggle('animate__fadeOut');
        scorePara.classList.toggle('animate__pulse');
        setTimeout(() => {
          newScoreDiv.classList.toggle('is-hidden');
          newScorePara.innerHTML = '';
          newScoreDiv.classList.toggle('animate__fadeOut');
          scorePara.classList.toggle('animate__pulse');
        }, 800);
      }

      wordInput.value = '';
      pressedLetterButtons.forEach((button) => {
        buttonToggleClasses.forEach(className => {
          button.classList.toggle(className);
        });
        unpressedLetterButtons.push(button);
      });

      pressedLetterButtons = [];
    })
    .catch((error) => {
      console.log(error);
    });
});

homeLink.addEventListener('click', (event) => {
  window.location.href = '/';
});