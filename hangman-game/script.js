const WORDS = {
  Animals: [
    { word: "elephant", hint: "Largest land animal with a trunk" },
    { word: "penguin", hint: "A bird that cannot fly but can swim" },
    { word: "giraffe", hint: "Has the longest neck of any animal" },
    { word: "kangaroo", hint: "Australian animal with a pouch" },
    { word: "cheetah", hint: "Fastest land animal on Earth" },
    { word: "dolphin", hint: "Intelligent marine mammal" },
    { word: "crocodile", hint: "Large reptile found near rivers" },
  ],
  Technology: [
    { word: "javascript", hint: "Popular programming language for web" },
    { word: "keyboard", hint: "Input device for typing" },
    { word: "algorithm", hint: "Step by step problem solving method" },
    { word: "database", hint: "Organized collection of data" },
    { word: "browser", hint: "Software to access the internet" },
    { word: "compiler", hint: "Converts code to machine language" },
    { word: "network", hint: "Connected system of computers" },
  ],
  Countries: [
    { word: "brazil", hint: "Largest country in South America" },
    { word: "australia", hint: "Country that is also a continent" },
    { word: "canada", hint: "Second largest country in the world" },
    { word: "germany", hint: "Country known for engineering and cars" },
    { word: "japan", hint: "Land of the Rising Sun" },
    { word: "egypt", hint: "Country famous for pyramids" },
    { word: "argentina", hint: "Home of Lionel Messi" },
  ],
  Sports: [
    { word: "cricket", hint: "Popular bat and ball game in India" },
    { word: "football", hint: "Most popular sport in the world" },
    { word: "badminton", hint: "Played with a shuttlecock" },
    { word: "swimming", hint: "Sport done in water" },
    { word: "basketball", hint: "Played with a hoop 10 feet high" },
    { word: "volleyball", hint: "Played over a net with 6 players" },
    { word: "marathon", hint: "A 42km running race" },
  ],
  Science: [
    { word: "gravity", hint: "Force that pulls objects toward Earth" },
    { word: "photosynthesis", hint: "How plants make food from sunlight" },
    { word: "molecule", hint: "Smallest unit of a chemical compound" },
    { word: "nucleus", hint: "Control center of a cell" },
    { word: "evolution", hint: "Theory by Charles Darwin" },
    { word: "electricity", hint: "Flow of electric charge" },
    { word: "atmosphere", hint: "Layer of gases surrounding Earth" },
  ]
};

const BODY_PARTS = ['p-head', 'p-body', 'p-larm', 'p-rarm', 'p-lleg', 'p-rleg'];

let currentWord = '';
let currentHint = '';
let currentCategory = '';
let guessedLetters = [];
let wrongLetters = [];
let livesLeft = 6;
let gameOver = false;
let wins = 0;
let losses = 0;
let streak = 0;

function startNewGame() {
  guessedLetters = [];
  wrongLetters = [];
  livesLeft = 6;
  gameOver = false;

  const categories = Object.keys(WORDS);
  currentCategory = categories[Math.floor(Math.random() * categories.length)];
  const wordList = WORDS[currentCategory];
  const chosen = wordList[Math.floor(Math.random() * wordList.length)];
  currentWord = chosen.word.toLowerCase();
  currentHint = chosen.hint;

  document.getElementById('categoryBadge').textContent = currentCategory;
  document.getElementById('hintText').textContent = currentHint;
  document.getElementById('livesLeft').textContent = livesLeft;
  document.getElementById('wrongLetters').textContent = '—';
  document.getElementById('message').classList.add('hidden');

  BODY_PARTS.forEach(id => {
    document.getElementById(id).classList.remove('visible');
    document.getElementById(id).classList.add('hidden');
  });

  for (let i = 1; i <= 6; i++) {
    const life = document.getElementById('life' + i);
    life.classList.remove('lost');
  }

  buildKeyboard();
  renderWord();
}

function buildKeyboard() {
  const keyboard = document.getElementById('keyboard');
  keyboard.innerHTML = '';
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'key';
    btn.textContent = letter;
    btn.id = 'key-' + letter;
    btn.onclick = () => guessLetter(letter);
    keyboard.appendChild(btn);
  });
}

function renderWord() {
  const display = document.getElementById('wordDisplay');
  display.innerHTML = '';
  currentWord.split('').forEach(letter => {
    const box = document.createElement('div');
    if (letter === ' ') {
      box.className = 'letter-box space';
    } else {
      box.className = 'letter-box';
      if (guessedLetters.includes(letter)) {
        box.textContent = letter;
      }
    }
    display.appendChild(box);
  });
}

function guessLetter(letter) {
  if (gameOver || guessedLetters.includes(letter) || wrongLetters.includes(letter)) return;

  const key = document.getElementById('key-' + letter);
  key.disabled = true;

  if (currentWord.includes(letter)) {
    guessedLetters.push(letter);
    key.classList.add('correct');
    renderWord();

    const allGuessed = currentWord.split('').every(l => l === ' ' || guessedLetters.includes(l));
    if (allGuessed) {
      gameOver = true;
      wins++;
      streak++;
      document.getElementById('winsCount').textContent = wins;
      document.getElementById('streakNum').textContent = streak;
      showMessage('win');
    }
  } else {
    wrongLetters.push(letter);
    key.classList.add('wrong');
    livesLeft--;

    const partIndex = 6 - livesLeft - 1;
    document.getElementById(BODY_PARTS[partIndex]).classList.remove('hidden');
    document.getElementById(BODY_PARTS[partIndex]).classList.add('visible');

    document.getElementById('life' + (livesLeft + 1)).classList.add('lost');
    document.getElementById('livesLeft').textContent = livesLeft;
    document.getElementById('wrongLetters').textContent = wrongLetters.join('  ') || '—';

    if (livesLeft === 0) {
      gameOver = true;
      losses++;
      streak = 0;
      document.getElementById('lossCount').textContent = losses;
      document.getElementById('streakNum').textContent = streak;
      showMessage('lose');
    }
  }
}

function showMessage(type) {
  const msg = document.getElementById('message');
  msg.classList.remove('hidden');

  if (type === 'win') {
    document.getElementById('msgIcon').textContent = '🎉';
    document.getElementById('msgText').textContent = 'You Won!';
    document.getElementById('msgWord').textContent = 'The word was: ' + currentWord.toUpperCase();
  } else {
    document.getElementById('msgIcon').textContent = '💀';
    document.getElementById('msgText').textContent = 'Game Over!';
    document.getElementById('msgWord').textContent = 'The word was: ' + currentWord.toUpperCase();
    currentWord.split('').forEach(l => {
      if (l !== ' ' && !guessedLetters.includes(l)) {
        const boxes = document.getElementById('wordDisplay').children;
        Array.from(boxes).forEach(box => {
          if (box.textContent === '' && !box.classList.contains('space')) {
            box.style.color = '#f87171';
          }
        });
      }
    });
    renderWord();
    document.querySelectorAll('.letter-box').forEach((box, i) => {
      const letter = currentWord.replace(/ /g, '')[i];
      if (!guessedLetters.includes(currentWord[i])) {
        box.style.color = '#f87171';
      }
    });
  }
}

startNewGame();