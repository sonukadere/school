import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as meService from '../services/me.service.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await meService.getMyProfile(req.user);
  res.status(200).json(new ApiResponse(200, 'Profile fetched successfully.', profile));
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const data = await meService.getMyAttendance(req.user);
  res.status(200).json(new ApiResponse(200, 'Attendance fetched successfully.', data));
});

export const getMyResults = asyncHandler(async (req, res) => {
  const data = await meService.getMyResults(req.user);
  res.status(200).json(new ApiResponse(200, 'Results fetched successfully.', data));
});

export const getMyFees = asyncHandler(async (req, res) => {
  const data = await meService.getMyFees(req.user);
  res.status(200).json(new ApiResponse(200, 'Fees fetched successfully.', data));
});

export const getMyExams = asyncHandler(async (req, res) => {
  const data = await meService.getMyExams(req.user);
  res.status(200).json(new ApiResponse(200, 'Exams fetched successfully.', data));
});

export const getMyTimetable = asyncHandler(async (req, res) => {
  const data = await meService.getMyTimetable(req.user);
  res.status(200).json(new ApiResponse(200, 'Timetable fetched successfully.', data));
});

export const getMyNotices = asyncHandler(async (req, res) => {
  const data = await meService.getMyNotices(req.user);
  res.status(200).json(new ApiResponse(200, 'Notices fetched successfully.', data));
});
