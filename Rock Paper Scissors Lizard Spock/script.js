const resultDiv = document.getElementById("result");
const scoreDiv = document.getElementById("score");

let wins = 0, losses = 0, draws = 0;

const rules = {
  rock: ["scissors", "lizard"],
  paper: ["rock", "spock"],
  scissors: ["paper", "lizard"],
  lizard: ["paper", "spock"],
  spock: ["scissors", "rock"]
};

function play(playerChoice) {
  const choices = Object.keys(rules);
  const computerChoice = choices[Math.floor(Math.random() * choices.length)];

  let outcome = "";
  if (playerChoice === computerChoice) {
    outcome = "It's a draw!";
    draws++;
  } else if (rules[playerChoice].includes(computerChoice)) {
    outcome = `You win! ${capitalize(playerChoice)} beats ${capitalize(computerChoice)}.`;
    wins++;
  } else {
    outcome = `You lose! ${capitalize(computerChoice)} beats ${capitalize(playerChoice)}.`;
    losses++;
  }

  resultDiv.textContent = outcome;
  scoreDiv.textContent = `Wins: ${wins} | Losses: ${losses} | Draws: ${draws}`;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
