import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as parentService from '../services/parent.service.js';

export const listParents = asyncHandler(async (req, res) => {
  const result = await parentService.listParents(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, 'Parents fetched successfully.', result.data, result.pagination));
});

export const getParent = asyncHandler(async (req, res) => {
  const parent = await parentService.getParent(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Parent fetched successfully.', parent));
});

export const createParent = asyncHandler(async (req, res) => {
  const parent = await parentService.createParent(req.body);
  res.status(201).json(new ApiResponse(201, 'Parent created successfully.', parent));
});

export const updateParent = asyncHandler(async (req, res) => {
  const parent = await parentService.updateParent(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Parent updated successfully.', parent));
});

export const deleteParent = asyncHandler(async (req, res) => {
  await parentService.deleteParent(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Parent deleted successfully.', null));
});
