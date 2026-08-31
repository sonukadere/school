import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as examService from '../services/exam.service.js';

export const listExams = asyncHandler(async (req, res) => {
  const result = await examService.listExams(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Exams fetched successfully.', result.data, result.pagination));
});

export const getExam = asyncHandler(async (req, res) => {
  const exam = await examService.getExam(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Exam fetched successfully.', exam));
});

export const createExam = asyncHandler(async (req, res) => {
  const exam = await examService.createExam(req.body);
  res.status(201).json(new ApiResponse(201, 'Exam created successfully.', exam));
});

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await examService.updateExam(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Exam updated successfully.', exam));
});

export const deleteExam = asyncHandler(async (req, res) => {
  await examService.deleteExam(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Exam deleted successfully.', null));
});
