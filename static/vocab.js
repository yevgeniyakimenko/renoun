const playGameButton = document.querySelector('.play-game-button');
const navBarBurger = document.querySelector('.navbar-burger');
const navBarMenu = document.querySelector('.navbar-menu');
const logOutAnchor = document.querySelector('.logout-anchor');

const vocabHeading = document.querySelector('.vocab-heading');

const dropDownBtnSpan1 = document.querySelector('.dropdown-button-span-1');
const dropDownBtnSpan2 = document.querySelector('.dropdown-button-span-2');
const dropDown1 = document.querySelector('.page-number-dropdown-1');
const dropDown2 = document.querySelector('.page-number-dropdown-2');
const prevBtn1 = document.querySelector('.pg-prev-1');
const prevBtn2 = document.querySelector('.pg-prev-2');
const nextBtn1 = document.querySelector('.pg-next-1');
const nextBtn2 = document.querySelector('.pg-next-2');

const firstHalf = document.querySelector('.tbody-1');
const secondHalf = document.querySelector('.tbody-2');

let pageNumber = 1;
let numberOfPages = 1;
let orderByTimesUsed = true;
let descending = true;
let usernameAdded = false;

function cleanTablesAndDropdowns() {
  for (let index = firstHalf.childNodes.length - 1; index >= 0; index--) {
    const node = firstHalf.childNodes[index];
    node.remove();
  }

  for (let index = secondHalf.childNodes.length - 1; index >= 0; index--) {
    const node = secondHalf.childNodes[index];
    node.remove();
  }

  for (let index = dropDown1.childNodes.length - 1; index >= 0; index--) {
    const node = dropDown1.childNodes[index];
    node.remove();
  }

  for (let index = dropDown2.childNodes.length - 1; index >= 0; index--) {
    const node = dropDown2.childNodes[index];
    node.remove();
  }
}

function fillDropDown(data) {
  const { numberOfPages } = data;

  dropDownBtnSpan1.innerHTML = pageNumber;
  dropDownBtnSpan2.innerHTML = pageNumber;

  for (let index = 1; index <= numberOfPages; index++) {
    const pageNAnchor1 = document.createElement('a');
    pageNAnchor1.innerHTML = index;
    pageNAnchor1.classList.add('dropdown-item');

    const pageNAnchor2 = pageNAnchor1.cloneNode(true);

    if (index === pageNumber) {
      pageNAnchor1.classList.add('is-active');
      pageNAnchor2.classList.add('is-active');
    } else {
      pageNAnchor1.addEventListener('click', (event) => {
        cleanTablesAndDropdowns();
        pageNumber = +(pageNAnchor1.innerHTML);
        fetchVocab();
      });

      pageNAnchor2.addEventListener('click', (event) => {
        cleanTablesAndDropdowns();
        pageNumber = +(pageNAnchor1.innerHTML);
        fetchVocab();
      });
    }

    dropDown1.appendChild(pageNAnchor1);
    dropDown2.appendChild(pageNAnchor2);
  }
}

function showVocab(data) {
  const { username, vocabSize, pageSize, list } = data;

  if (!usernameAdded) {
    const span = document.createElement('span');
    span.classList.add('has-text-weight-semibold');
    span.innerHTML = username;
    vocabHeading.appendChild(span);
    usernameAdded = true;
  }

  document.querySelector('.total').innerHTML = vocabSize;
  const to = ((+pageSize) * (+pageNumber)) > vocabSize ? vocabSize : (+pageSize) * (+pageNumber);
  const from = (+pageSize) * (+pageNumber) - (+pageSize) + 1;
  document.querySelector('.from').innerHTML = from;
  document.querySelector('.to').innerHTML = to;

  numberOfPages = Math.ceil(vocabSize / pageSize);
  fillDropDown({ numberOfPages });

  const halfSize = Math.ceil(list.length / 2);

  for (let index = 0; index < halfSize; index++) {
    const element = list[index];
    const { word_entry, times_used } = element;

    const tr = document.createElement('tr');
    const th = document.createElement('th');
    const tdWord = document.createElement('td');
    const tdTimesUsed = document.createElement('td');

    th.innerHTML = index + from;
    tdWord.innerHTML = word_entry;
    tdTimesUsed.innerHTML = times_used;

    tr.appendChild(th);
    tr.appendChild(tdWord);
    tr.appendChild(tdTimesUsed);

    firstHalf.appendChild(tr);
  }

  for (let index = halfSize; index < list.length; index++) {
    const element = list[index];
    const { word_entry, times_used } = element;

    const tr = document.createElement('tr');
    const th = document.createElement('th');
    const tdWord = document.createElement('td');
    const tdTimesUsed = document.createElement('td');

    th.innerHTML = index + from;
    tdWord.innerHTML = word_entry;
    tdTimesUsed.innerHTML = times_used;

    tr.appendChild(th);
    tr.appendChild(tdWord);
    tr.appendChild(tdTimesUsed);

    secondHalf.appendChild(tr);
  }
}

function fetchVocab() {
  console.log({pageNumber});
  axios.put('/api/v1/vocab', { pageNumber, orderByTimesUsed, descending })
  .then((response) => {
    console.log(response.data);
    showVocab(response.data);
  })
  .catch((error) => {
    console.log(error);
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

document.querySelector('.drd-1').addEventListener('click', (event) => {
  event.preventDefault();
  document.querySelector('.drd-1').classList.toggle('is-active');
});

document.querySelector('.drd-2').addEventListener('click', (event) => {
  event.preventDefault();
  document.querySelector('.drd-2').classList.toggle('is-active');
});

prevBtn1.addEventListener('click', (event) => {
  if (pageNumber === 1) {
    return;
  }

  cleanTablesAndDropdowns();
  pageNumber -= 1;
  fetchVocab();
});

prevBtn2.addEventListener('click', (event) => {
  if (pageNumber === 1) {
    return;
  }

  cleanTablesAndDropdowns();
  pageNumber -= 1;
  fetchVocab();
});

nextBtn1.addEventListener('click', (event) => {
  if (pageNumber === numberOfPages) {
    return;
  }

  cleanTablesAndDropdowns();
  pageNumber += 1;
  fetchVocab();
});

nextBtn2.addEventListener('click', (event) => {
  if (pageNumber === numberOfPages) {
    return;
  }

  cleanTablesAndDropdowns();
  pageNumber += 1;
  fetchVocab();
});

fetchVocab({});