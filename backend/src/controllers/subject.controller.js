import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as subjectService from '../services/subject.service.js';

export const listSubjects = asyncHandler(async (req, res) => {
  const result = await subjectService.listSubjects(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, 'Subjects fetched successfully.', result.data, result.pagination));
});

export const getSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.getSubject(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Subject fetched successfully.', subject));
});

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(req.body);
  res.status(201).json(new ApiResponse(201, 'Subject created successfully.', subject));
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.updateSubject(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Subject updated successfully.', subject));
});

export const deleteSubject = asyncHandler(async (req, res) => {
  await subjectService.deleteSubject(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Subject deleted successfully.', null));
});
