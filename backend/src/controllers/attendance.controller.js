import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as attendanceService from '../services/attendance.service.js';

export const listAttendances = asyncHandler(async (req, res) => {
  const result = await attendanceService.listAttendances(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Attendance records fetched successfully.', result.data, result.pagination));
});

export const getAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.getAttendance(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Attendance record fetched successfully.', attendance));
});

export const markAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.markAttendance(req.body, req.user.id);
  res.status(201).json(new ApiResponse(201, 'Attendance marked successfully.', attendance));
});

export const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const results = await attendanceService.bulkMarkAttendance(req.body, req.user.id);
  res
    .status(201)
    .json(new ApiResponse(201, `${results.length} attendance records marked successfully.`, results));
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.updateAttendance(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Attendance record updated successfully.', attendance));
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  await attendanceService.deleteAttendance(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Attendance record deleted successfully.', null));
});
