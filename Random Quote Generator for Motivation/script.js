const quotes = [
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Don’t let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream bigger. Do bigger.", author: "Unknown" },
  { text: "Success doesn’t just find you. You have to go out and get it.", author: "Unknown" }
];

function getRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

function showQuote() {
  const quote = getRandomQuote();
  document.getElementById("quote").innerText = `"${quote.text}"`;
  document.getElementById("author").innerText = `- ${quote.author}`;
}

function copyQuote() {
  const quoteText = document.getElementById("quote").innerText + " " + document.getElementById("author").innerText;
  navigator.clipboard.writeText(quoteText).then(() => {
    alert("Quote copied to clipboard!");
  });
}
