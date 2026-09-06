import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as markService from '../services/mark.service.js';

export const listMarks = asyncHandler(async (req, res) => {
  const result = await markService.listMarks(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Marks fetched successfully.', result.data, result.pagination));
});

export const getMark = asyncHandler(async (req, res) => {
  const mark = await markService.getMark(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Mark record fetched successfully.', mark));
});

export const createMark = asyncHandler(async (req, res) => {
  const mark = await markService.createMark(req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Mark record created successfully.', mark));
});

export const bulkCreateMarks = asyncHandler(async (req, res) => {
  const results = await markService.bulkCreateMarks(req.body, req.user);
  res
    .status(201)
    .json(new ApiResponse(201, `${results.length} mark records saved successfully.`, results));
});

export const updateMark = asyncHandler(async (req, res) => {
  const mark = await markService.updateMark(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, 'Mark record updated successfully.', mark));
});

export const deleteMark = asyncHandler(async (req, res) => {
  await markService.deleteMark(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Mark record deleted successfully.', null));
});
