const matrixAInput = document.getElementById('matrixA');
const matrixBInput = document.getElementById('matrixB');
const resultMatrix = document.getElementById('resultMatrix');
const multiplyButton = document.getElementById('multiplyButton');
const benchmarkButton = document.getElementById('benchmarkButton');
const randomButton = document.getElementById('randomButton');
const clearButton = document.getElementById('clearButton');
const terminateButton = document.getElementById('terminateButton');
const statusLabel = document.getElementById('status');
const durationLabel = document.getElementById('durationLabel');
const sizeLabel = document.getElementById('sizeLabel');
const progressBar = document.getElementById('progressBar');
const opCountLabel = document.getElementById('opCountLabel');
const throughputLabel = document.getElementById('throughputLabel');
const heartbeatLabel = document.getElementById('heartbeatLabel');
const workerStateLabel = document.getElementById('workerState');

let worker = null;
let lastMessageId = 0;
let currentOpCount = 0;
let uiHeartbeatFrame = null;
let uiHeartbeatCount = 0;
let uiHeartbeatStart = 0;

function createWorker() {
  if (worker) {
    worker.terminate();
  }

  worker = new Worker('worker.js');
  worker.onmessage = handleWorkerMessage;
  worker.onerror = handleWorkerError;
  updateStatus('Worker initialized and ready.', false);
  updateWorkerState(false);
}

function handleWorkerMessage(event) {
  const message = event.data;

  if (message.type === 'progress') {
    progressBar.value = message.percent;
    updateStatus(`Worker processing ${message.percent}% of the matrix task...`, false);
    return;
  }

  if (message.type === 'result') {
    stopUiHeartbeat();
    updateWorkerState(false);
    progressBar.value = 100;

    const typedResult = new Float64Array(message.resultBuffer);
    resultMatrix.value = renderResult(typedResult, message.rows, message.cols);
    durationLabel.textContent = `Worker time: ${message.durationMs.toFixed(2)} ms`;
    sizeLabel.textContent = `Result size: ${message.rows} × ${message.cols}`;
    throughputLabel.textContent = formatThroughput(message.opCount, message.durationMs);
    updateStatus('Computation complete. UI stayed responsive throughout.', false);
    setControlsEnabled(true);
    return;
  }

  if (message.type === 'error') {
    stopUiHeartbeat();
    updateWorkerState(false);
    updateStatus(`Worker error: ${message.error}`, true);
    setControlsEnabled(true);
  }
}

function handleWorkerError(errorEvent) {
  stopUiHeartbeat();
  updateWorkerState(false);
  updateStatus(`Worker crashed: ${errorEvent.message}`, true);
  setControlsEnabled(true);
}

function updateStatus(text, isError) {
  statusLabel.textContent = text;
  statusLabel.style.color = isError ? '#fca5a5' : '#d3dae3';
}

function updateWorkerState(active) {
  workerStateLabel.textContent = active ? 'Active' : 'Idle';
  workerStateLabel.dataset.state = active ? 'active' : 'idle';
}

function setControlsEnabled(enabled) {
  multiplyButton.disabled = !enabled;
  benchmarkButton.disabled = !enabled;
  randomButton.disabled = !enabled;
  clearButton.disabled = !enabled;
}

function parseMatrix(text) {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[ ,]+/).map((value) => {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        throw new Error(`Invalid entry "${value}"`);
      }
      return number;
    }));

  if (rows.length === 0) {
    throw new Error('Matrix input cannot be empty.');
  }

  const columnCount = rows[0].length;
  if (columnCount === 0) {
    throw new Error('Matrix must contain at least one column.');
  }

  rows.forEach((row, index) => {
    if (row.length !== columnCount) {
      throw new Error(`Row ${index + 1} does not match expected column count ${columnCount}.`);
    }
  });

  return rows;
}

function buildFlatMatrix(rows, cols, matrix) {
  const buffer = new Float64Array(rows * cols);
  for (let row = 0; row < rows; row += 1) {
    const rowStart = row * cols;
    for (let col = 0; col < cols; col += 1) {
      buffer[rowStart + col] = matrix[row][col];
    }
  }
  return buffer;
}

function renderResult(flatMatrix, rows, cols) {
  const maxVisibleRows = Math.min(rows, 10);
  const maxVisibleCols = Math.min(cols, 10);
  const lines = [];

  for (let row = 0; row < maxVisibleRows; row += 1) {
    const rowStart = row * cols;
    const values = [];
    for (let col = 0; col < maxVisibleCols; col += 1) {
      values.push(flatMatrix[rowStart + col].toFixed(2));
    }
    if (cols > maxVisibleCols) {
      values.push('…');
    }
    lines.push(values.join(', '));
  }

  if (rows > maxVisibleRows) {
    lines.push(`… (${rows - maxVisibleRows} more rows)`);
  }

  lines.push(`\n[Showing ${maxVisibleRows}×${maxVisibleCols} corner of ${rows}×${cols}]`);
  return lines.join('\n');
}

function formatThroughput(opCount, durationMs) {
  if (!durationMs || durationMs <= 0) {
    return '--';
  }
  const gflops = opCount / (durationMs / 1000) / 1e9;
  return `${gflops.toFixed(2)} GFLOPS`;
}

function validateMatrixSizes(A, B) {
  const aRows = A.length;
  const aCols = A[0].length;
  const bRows = B.length;
  const bCols = B[0].length;

  if (aCols !== bRows) {
    throw new Error(`Column count of A (${aCols}) must equal row count of B (${bRows}).`);
  }

  if (aRows > 500 || aCols > 500 || bRows > 500 || bCols > 500) {
    throw new Error('Matrices larger than 500×500 are not allowed to protect browser memory.');
  }

  return { aRows, aCols, bRows, bCols };
}

function multiplyMatrices(matrixA, matrixB, dims) {
  try {
    if (!matrixA || !matrixB || !dims) {
      matrixA = parseMatrix(matrixAInput.value);
      matrixB = parseMatrix(matrixBInput.value);
      dims = validateMatrixSizes(matrixA, matrixB);
    }

    const { aRows, aCols, bRows, bCols } = dims;
    const flatA = buildFlatMatrix(aRows, aCols, matrixA);
    const flatB = buildFlatMatrix(bRows, bCols, matrixB);
    const opCount = aRows * bCols * aCols * 2;
    currentOpCount = opCount;

    if (!worker) {
      createWorker();
    }

    resultMatrix.value = '';
    progressBar.value = 0;
    opCountLabel.textContent = opCount.toLocaleString();
    durationLabel.textContent = 'Worker time: computing...';
    sizeLabel.textContent = `Pending result`;
    throughputLabel.textContent = '--';
    updateStatus(`Dispatching ${aRows}×${aCols} × ${bRows}×${bCols} to the worker...`, false);
    updateWorkerState(true);
    setControlsEnabled(false);
    startUiHeartbeat();

    worker.postMessage(
      {
        type: 'multiply',
        matrixA: flatA.buffer,
        matrixB: flatB.buffer,
        aRows,
        aCols,
        bRows,
        bCols,
        messageId: ++lastMessageId,
      },
      [flatA.buffer, flatB.buffer]
    );
  } catch (error) {
    stopUiHeartbeat();
    updateStatus(error.message, true);
    durationLabel.textContent = 'Worker time: --';
    sizeLabel.textContent = 'Result size: --';
    throughputLabel.textContent = '--';
    setControlsEnabled(true);
  }
}

function fillRandomSample() {
  const size = 100;
  const sampleA = [];
  const sampleB = [];

  for (let i = 0; i < size; i += 1) {
    sampleA.push(Array.from({ length: size }, () => Math.round(Math.random() * 20)));
  }

  for (let i = 0; i < size; i += 1) {
    sampleB.push(Array.from({ length: size }, () => Math.round(Math.random() * 20)));
  }

  matrixAInput.value = matrixToText(sampleA);
  matrixBInput.value = matrixToText(sampleB);
  updateStatus('Sample 100×100 matrices generated. Ready to multiply.', false);
}

function runBenchmark() {
  const benchmarkSize = 200;
  const sampleA = [];
  const sampleB = [];

  for (let i = 0; i < benchmarkSize; i += 1) {
    sampleA.push(Array.from({ length: benchmarkSize }, () => Math.random() * 10));
    sampleB.push(Array.from({ length: benchmarkSize }, () => Math.random() * 10));
  }

  updateStatus(`Running benchmark with ${benchmarkSize}×${benchmarkSize} matrices...`, false);
  multiplyMatrices(sampleA, sampleB, {
    aRows: benchmarkSize,
    aCols: benchmarkSize,
    bRows: benchmarkSize,
    bCols: benchmarkSize,
  });
}

function clearInputs() {
  matrixAInput.value = '';
  matrixBInput.value = '';
  resultMatrix.value = '';
  progressBar.value = 0;
  opCountLabel.textContent = '--';
  throughputLabel.textContent = '--';
  heartbeatLabel.textContent = '--';
  durationLabel.textContent = 'Worker time: --';
  sizeLabel.textContent = 'Result size: --';
  updateStatus('Inputs cleared. Ready for a new benchmark.', false);
}

function matrixToText(matrix) {
  return matrix.map((row) => row.join(', ')).join('\n');
}

function startUiHeartbeat() {
  uiHeartbeatCount = 0;
  uiHeartbeatStart = performance.now();

  function tick() {
    uiHeartbeatCount += 1;
    uiHeartbeatFrame = requestAnimationFrame(tick);
  }

  uiHeartbeatFrame = requestAnimationFrame(tick);
}

function stopUiHeartbeat() {
  if (uiHeartbeatFrame) {
    cancelAnimationFrame(uiHeartbeatFrame);
    uiHeartbeatFrame = null;
  }

  const elapsedMs = performance.now() - uiHeartbeatStart;
  const fps = elapsedMs ? (uiHeartbeatCount * 1000) / elapsedMs : 0;
  heartbeatLabel.textContent = `${Math.round(fps)} fps`;
}

multiplyButton.addEventListener('click', () => multiplyMatrices());
benchmarkButton.addEventListener('click', runBenchmark);
randomButton.addEventListener('click', fillRandomSample);
clearButton.addEventListener('click', clearInputs);
terminateButton.addEventListener('click', () => {
  if (!worker) {
    updateStatus('No worker is currently running.', true);
    return;
  }

  worker.terminate();
  worker = null;
  stopUiHeartbeat();
  updateWorkerState(false);
  updateStatus('Worker terminated. Create a new worker before computing again.', false);
  setControlsEnabled(true);
});

window.addEventListener('load', () => {
  if (!window.Worker) {
    updateStatus('Web Workers are not supported in this browser.', true);
    multiplyButton.disabled = true;
    benchmarkButton.disabled = true;
    randomButton.disabled = true;
    clearButton.disabled = true;
    terminateButton.disabled = true;
    return;
  }

  createWorker();
});
