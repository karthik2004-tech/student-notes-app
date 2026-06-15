let snippets = JSON.parse(localStorage.getItem("snippets")) || [];

function addSnippet() {
  const title = document.getElementById("titleInput").value.trim();
  const language = document.getElementById("languageInput").value;
  const code = document.getElementById("codeInput").value.trim();

  if (!title || !code) {
    alert("Please enter a title and code!");
    return;
  }

  const snippet = { title, language, code };
  snippets.push(snippet);
  localStorage.setItem("snippets", JSON.stringify(snippets));

  document.getElementById("titleInput").value = "";
  document.getElementById("codeInput").value = "";

  renderSnippets();
}

function renderSnippets() {
  const list = document.getElementById("snippetsList");
  list.innerHTML = "";

  snippets.forEach((snippet, index) => {
    const card = document.createElement("div");
    card.className = "snippet-card";

    card.innerHTML = `
      <div class="snippet-header">
        <h3>${snippet.title} (${snippet.language})</h3>
        <button onclick="copySnippet(${index})">Copy</button>
      </div>
      <pre><code class="${snippet.language}">${escapeHtml(snippet.code)}</code></pre>
    `;

    list.appendChild(card);
  });

  // Apply syntax highlighting
  document.querySelectorAll("pre code").forEach(block => {
    hljs.highlightElement(block);
  });
}

function copySnippet(index) {
  const snippet = snippets[index];
  navigator.clipboard.writeText(snippet.code).then(() => {
    alert("Snippet copied to clipboard!");
  });
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;");
}

// Initial render
renderSnippets();
