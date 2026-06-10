let expression = '';
let historyData = [];

function appendToDisplay(value) {
  expression += value;
  document.getElementById('expression').textContent = expression;
  document.getElementById('result').textContent = '';
}

function clearAll() {
  expression = '';
  document.getElementById('expression').textContent = '';
  document.getElementById('result').textContent = '0';
}

function deleteLast() {
  expression = expression.slice(0, -1);
  document.getElementById('expression').textContent = expression;
}

function toggleSign() {
  if (expression === '') return;
  if (expression.startsWith('-')) {
    expression = expression.slice(1);
  } else {
    expression = '-' + expression;
  }
  document.getElementById('expression').textContent = expression;
}

function squareRoot() {
  if (expression === '') return;
  try {
    let val = eval(expression);
    let answer = Math.sqrt(val);
    saveHistory('√(' + expression + ')', answer);
    document.getElementById('expression').textContent = '√(' + expression + ') =';
    document.getElementById('result').textContent = answer;
    expression = String(answer);
  } catch (e) {
    document.getElementById('result').textContent = 'Error';
    expression = '';
  }
}

function square() {
  if (expression === '') return;
  try {
    let val = eval(expression);
    let answer = val * val;
    saveHistory('(' + expression + ')²', answer);
    document.getElementById('expression').textContent = '(' + expression + ')² =';
    document.getElementById('result').textContent = answer;
    expression = String(answer);
  } catch (e) {
    document.getElementById('result').textContent = 'Error';
    expression = '';
  }
}

function inverse() {
  if (expression === '') return;
  try {
    let val = eval(expression);
    let answer = 1 / val;
    saveHistory('1/(' + expression + ')', answer);
    document.getElementById('expression').textContent = '1/(' + expression + ') =';
    document.getElementById('result').textContent = answer;
    expression = String(answer);
  } catch (e) {
    document.getElementById('result').textContent = 'Error';
    expression = '';
  }
}

function calculate() {
  if (expression === '') return;
  try {
    let answer = eval(expression);
    saveHistory(expression, answer);
    document.getElementById('result').textContent = answer;
    document.getElementById('expression').textContent = expression + ' =';
    expression = String(answer);
  } catch (e) {
    document.getElementById('result').textContent = 'Error';
    expression = '';
  }
}

function saveHistory(expr, result) {
  historyData.unshift({ expr, result });
  if (historyData.length > 10) historyData.pop();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (historyData.length === 0) {
    list.innerHTML = '<p class="no-history">No calculations yet</p>';
    return;
  }
  list.innerHTML = historyData.map(item =>
    `<div class="history-item" onclick="useHistory('${item.result}')">
      <span>${item.expr} =</span> ${item.result}
    </div>`
  ).join('');
}

function clearHistory() {
  historyData = [];
  renderHistory();
}

function useHistory(value) {
  expression = String(value);
  document.getElementById('expression').textContent = expression;
  document.getElementById('result').textContent = '';
}