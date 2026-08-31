import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as timetableService from '../services/timetable.service.js';

export const listTimetables = asyncHandler(async (req, res) => {
  const result = await timetableService.listTimetables(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Timetable entries fetched successfully.', result.data, result.pagination));
});

export const getTimetable = asyncHandler(async (req, res) => {
  const timetable = await timetableService.getTimetable(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Timetable entry fetched successfully.', timetable));
});

export const createTimetable = asyncHandler(async (req, res) => {
  const timetable = await timetableService.createTimetable(req.body);
  res.status(201).json(new ApiResponse(201, 'Timetable entry created successfully.', timetable));
});

export const updateTimetable = asyncHandler(async (req, res) => {
  const timetable = await timetableService.updateTimetable(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Timetable entry updated successfully.', timetable));
});

export const deleteTimetable = asyncHandler(async (req, res) => {
  await timetableService.deleteTimetable(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Timetable entry deleted successfully.', null));
});
