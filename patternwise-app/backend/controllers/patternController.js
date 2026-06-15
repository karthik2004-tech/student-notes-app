const patterns = require('../data/patterns.json');
const { fetchLeetCodeProblem } = require('../utils/leetcode');
const { formatSuccess, formatError, ErrorCodes } = require('../utils/responseFormatter');

/**
 * GET /api/patterns
 * Returns all DSA patterns with explicit response contract
 */
exports.getPatterns = (req, res) => {
  try {
    const response = formatSuccess(patterns);
    res.status(200).json(response);
  } catch (err) {
    console.error('Error in getPatterns:', err);
    const response = formatError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to retrieve patterns',
      { error: err.message }
    );
    res.status(500).json(response);
  }
};

/**
 * GET /api/patterns/:id
 * Returns specific pattern with LeetCode problem statistics
 * Isolates external API failures using Promise.allSettled for graceful degradation
 * Implements graceful fallback if LeetCode API fails for individual problems
 */
exports.getPatternDetails = async (req, res) => {
  const { id } = req.params;

  // Validate pattern ID format
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    const response = formatError(
      ErrorCodes.INVALID_PATTERN_ID,
      'Invalid pattern ID provided',
      { id }
    );
    return res.status(400).json(response);
  }

  // Find pattern
  const pattern = patterns.find(p => p.id === id);

  if (!pattern) {
    const response = formatError(
      ErrorCodes.PATTERN_NOT_FOUND,
      `Pattern with id '${id}' not found`,
      { id }
    );
    return res.status(404).json(response);
  }

  try {
    // Fetch problem stats with error isolation
    // Use Promise.allSettled to handle individual problem failures without failing entire request
    // Fetch problem stats with graceful fallback for failures
    const problemsWithStats = await Promise.allSettled(
      pattern.problems.map(async (slug) => {
        const stats = await fetchLeetCodeProblem(slug);
        if (stats) {
          return {
            ...stats,
            titleSlug: slug
          };
        } else {
          // Fallback: Return structured unknown problem data
          return {
            questionId: 'unknown',
            titleSlug: slug,
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            difficulty: 'Unknown',
            acRate: 0,
            topicTags: []
          };
        }
      })
    );

    // Process results: extract fulfilled values and track failures
    const failedProblems = [];
    const problems = problemsWithStats
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // External API call rejected
          failedProblems.push({
            titleSlug: pattern.problems[index],
            error: result.reason?.message || 'Unknown error'
          });

          // Return fallback for failed problem
          return {
            questionId: 'unknown',
            titleSlug: pattern.problems[index],
            title: pattern.problems[index]
              .replace(/-/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase()),
            difficulty: 'Unknown',
            acRate: 0,
            topicTags: [],
            _fetchFailed: true // Flag for client to know this is fallback
          };
        }
      });

    const fullPattern = {
      ...pattern,
      problems
    };

    // If some problems failed, return with warning but include partial data
    if (failedProblems.length > 0) {
      console.warn(
        `[PATTERN_DETAILS] Partial failure for pattern ${id}: ${failedProblems.length} problems failed`
      );

      const response = formatError(
        ErrorCodes.PARTIAL_DATA_FAILURE,
        'Successfully fetched pattern but some problems had data fetch issues',
        {
          failedProblems,
          patternId: id,
          totalProblems: pattern.problems.length,
          successfulProblems: problems.length - failedProblems.length,
          note: 'Pattern returned with fallback data for failed problems'
        }
      );

      // Include partial data even in error response
      response.data = fullPattern;
      return res.status(200).json(response);
    }

    // All problems fetched successfully
    const response = formatSuccess(fullPattern);
    res.status(200).json(response);
  } catch (err) {
    // Unexpected error (shouldn't happen with Promise.allSettled, but just in case)
    console.error(`[PATTERN_DETAILS] Unexpected error for pattern ${id}:`, err.message);

    const response = formatError(
      ErrorCodes.LEETCODE_FETCH_FAILED,
      'Failed to fetch problem statistics from LeetCode',
      {
        patternId: id,
        error: err.message
      }
    );
    res.status(500).json(response);
  }
};
