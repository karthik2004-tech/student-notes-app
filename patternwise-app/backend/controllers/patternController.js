const patterns = require('../data/patterns.json');
const { fetchLeetCodeProblem } = require('../utils/leetcode');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { getHttpStatusCode } = require('../config/httpStatusMap');

exports.getPatterns = (req, res) => {
  const response = formatSuccess(patterns, 'SUCCESS');
  res.status(response.statusCode).json(response);
};

exports.getPatternDetails = async (req, res) => {
  const { id } = req.params;
  const pattern = patterns.find(p => p.id === id);
  
  if (!pattern) {
    const response = formatError(
      'Pattern not found',
      'PATTERN_NOT_FOUND',
      null,
      { patternId: id }
    );
    return res.status(response.statusCode).json(response);
  }

  try {
    // Fetch actual problem stats from LeetCode
    const problemsWithStats = await Promise.all(
      pattern.problems.map(async (slug) => {
        const stats = await fetchLeetCodeProblem(slug);
        if (stats) {
          return {
            ...stats,
            titleSlug: slug
          };
        } else {
          return {
            titleSlug: slug,
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            difficulty: 'Unknown',
            acRate: 0
          };
        }
      })
    );

    const fullPattern = {
      ...pattern,
      problems: problemsWithStats
    };

    const response = formatSuccess(fullPattern, 'SUCCESS');
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = formatError(
      'Failed to fetch pattern details',
      'EXTERNAL_API_FAILURE',
      null,
      { error: err.message }
    );
    res.status(response.statusCode).json(response);
  }
};
