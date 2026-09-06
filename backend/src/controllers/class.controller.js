import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as classService from '../services/class.service.js';

export const listClasses = asyncHandler(async (req, res) => {
  const result = await classService.listClasses(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Classes fetched successfully.', result.data, result.pagination));
});

export const getClass = asyncHandler(async (req, res) => {
  const cls = await classService.getClass(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Class fetched successfully.', cls));
});

export const createClass = asyncHandler(async (req, res) => {
  const cls = await classService.createClass(req.body);
  res.status(201).json(new ApiResponse(201, 'Class created successfully.', cls));
});

export const updateClass = asyncHandler(async (req, res) => {
  const cls = await classService.updateClass(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Class updated successfully.', cls));
});

export const deleteClass = asyncHandler(async (req, res) => {
  await classService.deleteClass(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Class deleted successfully.', null));
});
