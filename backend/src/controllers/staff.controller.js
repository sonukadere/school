import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as staffService from '../services/staff.service.js';

export const listStaff = asyncHandler(async (req, res) => {
  const result = await staffService.listStaff(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, 'Staff members fetched successfully.', result.data, result.pagination));
});

export const getStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.getStaff(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Staff member fetched successfully.', staff));
});

export const createStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.createStaff(req.body);
  res.status(201).json(new ApiResponse(201, 'Staff member created successfully.', staff));
});

export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.updateStaff(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Staff member updated successfully.', staff));
});

export const deleteStaff = asyncHandler(async (req, res) => {
  await staffService.deleteStaff(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Staff member deleted successfully.', null));
});
