const navBarBurger = document.querySelector('.navbar-burger');
const navBarMenu = document.querySelector('.navbar-menu');

const statsBlock = document.querySelector('.stats-block');
const statsColumn = document.querySelector('.stats-column');
const statsHeading = document.querySelector('.stats-heading');
const statTemplate = document.querySelector('.stat-item');
const playGameButton = document.querySelector('.play-game-button');
const vocabButton = document.querySelector('.vocab-button');
const logOutAnchor = document.querySelector('.logout-anchor');

function addLines(lines) {
  lines.forEach(line => {
    const statPara = document.createElement('p');
    statPara.classList.add('is-family-monospace');
    const text = document.createTextNode(line);
    statPara.appendChild(text);
    statsBlock.appendChild(statPara);
  });
}

function showStats(response) {
  const span = document.createElement('span');
  span.classList.add('has-text-weight-semibold');
  span.innerHTML += ' ' + response.data.username;
  statsHeading.appendChild(span);

  let avgScore = (+response.data.gamesPlayed > 0) ?
    Math.round(+response.data.totalPoints / +response.data.gamesPlayed) : 0;
  let avgWords = (+response.data.gamesPlayed > 0) ?
    Math.round(+response.data.totalWords / +response.data.gamesPlayed) : 0;
  let longestWord = response.data.longestWord ? response.data.longestWord : '(none)';

  const lines = [
    {
      label: 'Games played',
      value: response.data.gamesPlayed,
    },
    {
      label: 'Total points from all games',
      value: response.data.totalPoints,
    },
    {
      label: 'Average score per game',
      value: avgScore,
    },
    {
      label: 'Highest score in a game',
      value: response.data.highestScore,
    },
    {
      label: 'Total words submitted',
      value: response.data.totalWords,
    },
    {
      label: 'Total different words submitted',
      value: response.data.vocabSize,
    },
    {
      label: 'Average words submitted per game',
      value: avgWords,
    },
    {
      label: 'Longest word submitted',
      value: longestWord,
    },
  ];

  lines.forEach(line => {
    const newStat = statTemplate.cloneNode(true);
    newStat.querySelector('.stat-label').innerHTML = line.label;
    newStat.querySelector('.stat-value').innerHTML = line.value;
    statsColumn.insertBefore(newStat, statsColumn.lastChild);
    newStat.classList.remove('is-hidden');
  });
}

const isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
if (isLoggedIn) {
  logOutAnchor.addEventListener('click', (event) => {
    event.preventDefault();
    axios.post('/api/v1/logout')
    .then((response) => {
      localStorage.clear();
      location.href = '/';
    })
    .catch((error) => console.log(error));
  });
}

navBarBurger.addEventListener('click', (event) => {
  event.preventDefault();
  navBarBurger.classList.toggle('is-active');
  navBarMenu.classList.toggle('is-active');
});

playGameButton.addEventListener('click', (event) => {
  event.preventDefault();
  window.location.href = '/game';
});

axios.get('/api/v1/stats')
  .then((response) => {
    showStats(response);
  })
  .catch((error) => {
    console.log(error);
  });