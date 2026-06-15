const axios = require('axios');
const { CircuitBreaker, executeWithCircuitBreaker } = require('./externalApiHandler');
const { config } = require('../config');

// Global circuit breaker for LeetCode API
const leetcodeCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
});

/**
 * Fetch problem data from LeetCode with error isolation
 * @param {string} titleSlug - Problem URL slug
 * @returns {Promise<object>} Problem data or null if error
 */
async function fetchLeetCodeProblem(titleSlug) {
  const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        titleSlug
        difficulty
        acRate
        topicTags {
          name
        }
      }
    }
  `;

  // API call wrapped for execution
  const apiCall = async () => {
    const response = await axios.post(
      config.LEETCODE_API_URL || 'https://leetcode.com/graphql',
      { query, variables: { titleSlug } },
      {
        timeout: config.LEETCODE_TIMEOUT_MS || 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Validate response structure
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format: missing data field');
    }

    // Handle GraphQL errors
    if (response.data.errors) {
      throw new Error(
        `GraphQL error: ${response.data.errors.map(e => e.message).join(', ')}`
      );
    }

    return response.data.data.question;
  };

  // Execute with circuit breaker and retry logic
  const result = await executeWithCircuitBreaker(apiCall, leetcodeCircuitBreaker, {
    maxRetries: 2,
    retryDelay: 500,
  });

  if (!result.success) {
    console.error(
      `[LEETCODE_API] Failed to fetch ${titleSlug}: ${result.error.type} - ${result.error.message}`
    );
    return null;
  }

  return result.data;
}

/**
 * Get circuit breaker status for monitoring
 */
function getCircuitBreakerStatus() {
  return leetcodeCircuitBreaker.getStatus();
}

/**
 * Reset circuit breaker (admin function)
 */
function resetCircuitBreaker() {
  leetcodeCircuitBreaker.reset();
}

module.exports = {
  fetchLeetCodeProblem,
  getCircuitBreakerStatus,
  resetCircuitBreaker,
  leetcodeCircuitBreaker,
};
