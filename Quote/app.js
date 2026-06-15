const quoteText = document.getElementById("quote");
const authorText = document.getElementById("author");
const newBtn = document.getElementById("newQuote");
const copyBtn = document.getElementById("copyQuote");

const quotes = [
  { quote: "Don’t wait for opportunity. Create it.", author: "Unknown" },
  { quote: "Success is built on consistency, not motivation.", author: "Unknown" },
  { quote: "Small steps every day lead to big results.", author: "Unknown" },
  { quote: "Discipline beats talent when talent doesn’t work hard.", author: "Unknown" },
  { quote: "Dream big. Start small. Act now.", author: "Unknown" },
  { quote: "Your only limit is your mindset.", author: "Unknown" }
];

function showQuote() {
  const random = Math.floor(Math.random() * quotes.length);

  quoteText.textContent = `"${quotes[random].quote}"`;
  authorText.textContent = `— ${quotes[random].author}`;
}

newBtn.addEventListener("click", showQuote);

copyBtn.addEventListener("click", () => {
  const text = quoteText.textContent + " " + authorText.textContent;
  navigator.clipboard.writeText(text);

  copyBtn.textContent = "Copied!";
  setTimeout(() => copyBtn.textContent = "Copy", 1000);
});

// load first quote
showQuote();