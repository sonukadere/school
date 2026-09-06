import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as questionService from '../services/question.service.js';
import { findMatchingQuestions as matchQuestionsService } from '../services/questionMatcher.service.js';
import { detectDuplicateQuestion } from '../services/duplicateDetector.service.js';

export const listQuestions = asyncHandler(async (req, res) => {
  const result = await questionService.listQuestions(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Questions fetched successfully.', result.data, result.pagination));
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.getQuestion(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Question fetched successfully.', question));
});

export const createQuestion = asyncHandler(async (req, res) => {
  const result = await questionService.createQuestion(req.body, req.user);
  if (result.warning) {
    return res
      .status(200)
      .json(new ApiResponse(200, result.warning, result));
  }
  res.status(201).json(new ApiResponse(201, 'Question created successfully.', result));
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.updateQuestion(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, 'Question updated successfully.', question));
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  await questionService.deleteQuestion(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Question deleted successfully.', null));
});

export const matchQuestions = asyncHandler(async (req, res) => {
  const questions = await matchQuestionsService(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, `Found ${questions.length} matching questions.`, questions));
});

export const checkDuplicate = asyncHandler(async (req, res) => {
  const result = await detectDuplicateQuestion(req.body.text, {
    classId: req.body.classId,
    subjectName: req.body.subjectName,
    threshold: req.body.threshold ? Number(req.body.threshold) : 0.80,
  });
  res.status(200).json(new ApiResponse(200, 'Duplicate check completed.', result));
});
