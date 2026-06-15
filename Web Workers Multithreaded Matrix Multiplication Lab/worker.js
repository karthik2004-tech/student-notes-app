self.onmessage = function (event) {
  const data = event.data;

  if (!data || data.type !== 'multiply') {
    return;
  }

  try {
    const aRows = data.aRows;
    const aCols = data.aCols;
    const bRows = data.bRows;
    const bCols = data.bCols;
    const matrixA = new Float64Array(data.matrixA);
    const matrixB = new Float64Array(data.matrixB);

    if (aCols !== bRows) {
      throw new Error(`Invalid dimensions: A columns ${aCols} must equal B rows ${bRows}.`);
    }

    if (aRows > 500 || aCols > 500 || bRows > 500 || bCols > 500) {
      throw new Error('Matrix dimensions exceed the safe 500×500 boundary.');
    }

    const result = new Float64Array(aRows * bCols);
    const startTime = performance.now();
    const progressInterval = Math.max(1, Math.floor(aRows / 12));

    for (let i = 0; i < aRows; i += 1) {
      const rowOffset = i * aCols;
      const outputOffset = i * bCols;

      for (let j = 0; j < bCols; j += 1) {
        let sum = 0;

        for (let k = 0; k < aCols; k += 1) {
          sum += matrixA[rowOffset + k] * matrixB[k * bCols + j];
        }

        result[outputOffset + j] = sum;
      }

      if ((i + 1) % progressInterval === 0 || i === aRows - 1) {
        self.postMessage({
          type: 'progress',
          percent: Math.round(((i + 1) / aRows) * 100),
          rowsCompleted: i + 1,
          messageId: data.messageId,
        });
      }
    }

    const durationMs = performance.now() - startTime;
    const opCount = aRows * bCols * aCols * 2;

    self.postMessage(
      {
        type: 'result',
        resultBuffer: result.buffer,
        durationMs,
        rows: aRows,
        cols: bCols,
        opCount,
        messageId: data.messageId,
      },
      [result.buffer]
    );
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message, messageId: data.messageId });
  }
};
