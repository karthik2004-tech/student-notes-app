const Joi = require('joi');

/**
 * Response Schema Definitions for PatternWise API
 * Ensures all API responses follow consistent contracts
 */

// Problem schema (LeetCode problem with stats)
const problemSchema = Joi.object({
  questionId: Joi.string().required(),
  title: Joi.string().required(),
  titleSlug: Joi.string().required(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard', 'Unknown').required(),
  acRate: Joi.number().min(0).max(100).required(),
  topicTags: Joi.array().items(
    Joi.object({
      name: Joi.string().required()
    })
  ).optional()
});

// Pattern schema (DSA pattern with problems)
const patternSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  difficulty: Joi.string().required(),
  estimatedTime: Joi.string().required(),
  intuition: Joi.string().required(),
  whenToUse: Joi.array().items(Joi.string()).required(),
  commonMistakes: Joi.array().items(Joi.string()).required(),
  template: Joi.string().required(),
  problems: Joi.array().items(problemSchema).required()
});

// Success response envelope
const successResponseSchema = Joi.object({
  status: Joi.string().valid('success').required(),
  data: Joi.alternatives().try(
    Joi.array().items(patternSchema),
    patternSchema
  ).required(),
  meta: Joi.object({
    timestamp: Joi.date().required(),
    version: Joi.string().required()
  }).required()
});

// Error response envelope
const errorResponseSchema = Joi.object({
  status: Joi.string().valid('error').required(),
  error: Joi.object({
    code: Joi.string().required(),
    message: Joi.string().required(),
    details: Joi.object().optional()
  }).required(),
  meta: Joi.object({
    timestamp: Joi.date().required(),
    version: Joi.string().required()
  }).required()
});

module.exports = {
  problemSchema,
  patternSchema,
  successResponseSchema,
  errorResponseSchema
};
