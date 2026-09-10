import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as timetableService from '../services/timetable.service.js';
import * as meService from '../services/me.service.js';

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

export const getWeeklyClassTimetable = asyncHandler(async (req, res) => {
  const result = await timetableService.getWeeklyClassTimetable(req.params.classId);
  res.status(200).json(new ApiResponse(200, 'Weekly class timetable fetched successfully.', result));
});

export const getWeeklyTeacherTimetable = asyncHandler(async (req, res) => {
  const result = await timetableService.getWeeklyTeacherTimetable(req.params.teacherId);
  res.status(200).json(new ApiResponse(200, 'Weekly teacher timetable fetched successfully.', result));
});

export const getMyTimetable = asyncHandler(async (req, res) => {
  const slots = await meService.getMyTimetable(req.user);
  res.status(200).json(new ApiResponse(200, 'My timetable fetched successfully.', slots));
});

// Period Controllers
export const listPeriods = asyncHandler(async (req, res) => {
  const periods = await timetableService.listPeriods();
  res.status(200).json(new ApiResponse(200, 'Periods fetched successfully.', periods));
});

export const createPeriod = asyncHandler(async (req, res) => {
  const period = await timetableService.createPeriod(req.body);
  res.status(201).json(new ApiResponse(201, 'Period created successfully.', period));
});

export const updatePeriod = asyncHandler(async (req, res) => {
  const period = await timetableService.updatePeriod(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Period updated successfully.', period));
});

export const deletePeriod = asyncHandler(async (req, res) => {
  await timetableService.deletePeriod(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Period deleted successfully.', null));
});

export const generatePeriods = asyncHandler(async (req, res) => {
  const periods = await timetableService.generatePeriods(req.body);
  res.status(200).json(new ApiResponse(200, 'Periods generated successfully.', periods));
});
