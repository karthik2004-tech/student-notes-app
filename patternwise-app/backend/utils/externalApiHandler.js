/**
 * External API Error Handler & Circuit Breaker
 * Isolates external API failures and provides fallback strategies
 */

/**
 * Error classification for external API failures
 */
const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_RESPONSE_ERROR: 'INVALID_RESPONSE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Circuit breaker state
 */
const CircuitState = {
  CLOSED: 'CLOSED', // Normal operation
  OPEN: 'OPEN', // Failing, reject requests
  HALF_OPEN: 'HALF_OPEN', // Testing if service recovered
};

/**
 * Classify API error based on response
 * @param {Error} error - Error object
 * @returns {object} { type, retriable, statusCode, message }
 */
function classifyError(error) {
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return {
      type: ErrorTypes.NETWORK_ERROR,
      retriable: true,
      statusCode: 0,
      message: 'Network connection failed',
    };
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      type: ErrorTypes.TIMEOUT_ERROR,
      retriable: true,
      statusCode: 0,
      message: 'Request timeout',
    };
  }

  // HTTP response errors
  if (error.response) {
    const status = error.response.status;

    // Rate limiting
    if (status === 429) {
      return {
        type: ErrorTypes.RATE_LIMIT_ERROR,
        retriable: true,
        statusCode: 429,
        message: 'Rate limited by external API',
      };
    }

    // Authentication errors
    if (status === 401 || status === 403) {
      return {
        type: ErrorTypes.AUTHENTICATION_ERROR,
        retriable: false,
        statusCode: status,
        message: 'Authentication failed',
      };
    }

    // Not found errors
    if (status === 404) {
      return {
        type: ErrorTypes.NOT_FOUND_ERROR,
        retriable: false,
        statusCode: 404,
        message: 'Resource not found',
      };
    }

    // Server errors
    if (status >= 500) {
      return {
        type: ErrorTypes.SERVER_ERROR,
        retriable: true,
        statusCode: status,
        message: `External API server error (${status})`,
      };
    }

    // Other HTTP errors
    if (status >= 400) {
      return {
        type: ErrorTypes.INVALID_RESPONSE_ERROR,
        retriable: false,
        statusCode: status,
        message: `HTTP error (${status})`,
      };
    }
  }

  // Invalid response format
  if (error.message.includes('Cannot read') || error.message.includes('undefined')) {
    return {
      type: ErrorTypes.INVALID_RESPONSE_ERROR,
      retriable: false,
      statusCode: 0,
      message: 'Invalid response format from external API',
    };
  }

  // Unknown error
  return {
    type: ErrorTypes.UNKNOWN_ERROR,
    retriable: true,
    statusCode: 0,
    message: error.message || 'Unknown external API error',
  };
}

/**
 * Simple Circuit Breaker for external API calls
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5; // Failures before opening
    this.successThreshold = options.successThreshold || 2; // Successes before closing
    this.timeout = options.timeout || 60000; // Time in open state before half-open
    this.lastFailureTime = null;
    this.failureCount = 0;
    this.successCount = 0;
    this.state = CircuitState.CLOSED;
  }

  /**
   * Check if request should proceed
   * @returns {object} { allowed: boolean, state: string, message: string }
   */
  canExecute() {
    if (this.state === CircuitState.CLOSED) {
      return { allowed: true, state: this.state };
    }

    if (this.state === CircuitState.OPEN) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure > this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        return {
          allowed: true,
          state: CircuitState.HALF_OPEN,
          message: 'Testing if service recovered',
        };
      }

      return {
        allowed: false,
        state: this.state,
        message: `Circuit open. Retry after ${Math.ceil((this.timeout - timeSinceFailure) / 1000)}s`,
      };
    }

    // HALF_OPEN - allow to test
    return { allowed: true, state: this.state, message: 'Testing recovery' };
  }

  /**
   * Record successful call
   */
  recordSuccess() {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.log('[CIRCUIT_BREAKER] Circuit closed - service recovered');
      }
    }
  }

  /**
   * Record failed call
   * @param {boolean} retriable - Whether error is retriable
   */
  recordFailure(retriable = true) {
    if (!retriable) {
      return; // Non-retriable errors don't affect circuit
    }

    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.warn(
        `[CIRCUIT_BREAKER] Circuit opened after ${this.failureCount} failures`
      );
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      console.warn('[CIRCUIT_BREAKER] Circuit reopened during recovery test');
    }
  }

  /**
   * Reset circuit breaker
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Get circuit status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Execute API call with error handling and circuit breaker
 * @param {function} apiCall - Async function to call
 * @param {object} circuitBreaker - CircuitBreaker instance
 * @param {object} options - Configuration options
 * @returns {object} { success: boolean, data: any, error: object }
 */
async function executeWithCircuitBreaker(
  apiCall,
  circuitBreaker,
  options = {}
) {
  const maxRetries = options.maxRetries || 2;
  const retryDelay = options.retryDelay || 500;

  // Check circuit breaker
  const canExecute = circuitBreaker.canExecute();
  if (!canExecute.allowed) {
    return {
      success: false,
      data: null,
      error: {
        type: 'CIRCUIT_BREAKER_OPEN',
        message: canExecute.message,
        retriable: true,
      },
    };
  }

  // Attempt API call with retries
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await apiCall();
      circuitBreaker.recordSuccess();
      return { success: true, data, error: null };
    } catch (error) {
      lastError = error;
      const classification = classifyError(error);

      // Non-retriable error or final attempt
      if (!classification.retriable || attempt === maxRetries) {
        circuitBreaker.recordFailure(classification.retriable);
        return {
          success: false,
          data: null,
          error: {
            type: classification.type,
            message: classification.message,
            retriable: classification.retriable,
            statusCode: classification.statusCode,
            attempt: attempt + 1,
            totalAttempts: maxRetries + 1,
          },
        };
      }

      // Retry with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      console.warn(
        `[API_HANDLER] Attempt ${attempt + 1} failed (${classification.type}). Retrying in ${delay}ms...`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    data: null,
    error: {
      type: 'MAX_RETRIES_EXCEEDED',
      message: 'Max retries exceeded',
      retriable: true,
    },
  };
}

module.exports = {
  ErrorTypes,
  CircuitState,
  CircuitBreaker,
  classifyError,
  executeWithCircuitBreaker,
};
