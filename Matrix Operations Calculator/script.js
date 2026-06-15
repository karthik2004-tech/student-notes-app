const matricesDiv = document.getElementById("matrices");
const resultDiv = document.getElementById("result");
const sizeSelect = document.getElementById("sizeSelect");

function generateInputs() {
  matricesDiv.innerHTML = "";

  const size = parseInt(sizeSelect.value);

  const matrixA = document.createElement("div");
  matrixA.className = "matrix";
  matrixA.innerHTML = `<h3>Matrix A</h3>`;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      matrixA.innerHTML += `<input type="number" id="A-${i}-${j}" value="0">`;
    }
    matrixA.innerHTML += "<br>";
  }

  const matrixB = document.createElement("div");
  matrixB.className = "matrix";
  matrixB.innerHTML = `<h3>Matrix B</h3>`;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      matrixB.innerHTML += `<input type="number" id="B-${i}-${j}" value="0">`;
    }
    matrixB.innerHTML += "<br>";
  }

  matricesDiv.appendChild(matrixA);
  matricesDiv.appendChild(matrixB);
}

function getMatrix(prefix) {
  const size = parseInt(sizeSelect.value);
  const matrix = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(parseFloat(document.getElementById(`${prefix}-${i}-${j}`).value));
    }
    matrix.push(row);
  }
  return matrix;
}

function performOperation(type) {
  const A = getMatrix("A");
  const B = getMatrix("B");
  let result = "";

  switch (type) {
    case "add":
      result = matrixAdd(A, B);
      break;
    case "subtract":
      result = matrixSubtract(A, B);
      break;
    case "multiply":
      result = matrixMultiply(A, B);
      break;
    case "transposeA":
      result = transpose(A);
      break;
    case "transposeB":
      result = transpose(B);
      break;
    case "detA":
      result = determinant(A);
      break;
    case "detB":
      result = determinant(B);
      break;
  }

  renderResult(result);
}

function matrixAdd(A, B) {
  return A.map((row, i) => row.map((val, j) => val + B[i][j]));
}

function matrixSubtract(A, B) {
  return A.map((row, i) => row.map((val, j) => val - B[i][j]));
}

function matrixMultiply(A, B) {
  const size = A.length;
  const result = Array.from({ length: size }, () => Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

function transpose(M) {
  const size = M.length;
  const result = Array.from({ length: size }, () => Array(size).fill(0));
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result[j][i] = M[i][j];
    }
  }
  return result;
}

function determinant(M) {
  const size = M.length;
  if (size === 2) {
    return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  } else if (size === 3) {
    return (
      M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
      M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
      M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
    );
  }
}

function renderResult(result) {
  resultDiv.innerHTML = "<h3>Result</h3>";
  if (typeof result === "number") {
    resultDiv.innerHTML += `<p>${result}</p>`;
  } else {
    resultDiv.innerHTML += "<table>";
    result.forEach(row => {
      resultDiv.innerHTML += "<tr>" + row.map(val => `<td>${val}</td>`).join("") + "</tr>";
    });
    resultDiv.innerHTML += "</table>";
  }
}
