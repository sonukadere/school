import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as feeService from '../services/fee.service.js';

export const listFees = asyncHandler(async (req, res) => {
  const result = await feeService.listFees(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Fee records fetched successfully.', result.data, result.pagination));
});

export const getFee = asyncHandler(async (req, res) => {
  const fee = await feeService.getFee(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Fee record fetched successfully.', fee));
});

export const createFee = asyncHandler(async (req, res) => {
  const fee = await feeService.createFee(req.body);
  res.status(201).json(new ApiResponse(201, 'Fee record created successfully.', fee));
});

export const updateFee = asyncHandler(async (req, res) => {
  const fee = await feeService.updateFee(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Fee record updated successfully.', fee));
});

export const deleteFee = asyncHandler(async (req, res) => {
  await feeService.deleteFee(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Fee record deleted successfully.', null));
});
