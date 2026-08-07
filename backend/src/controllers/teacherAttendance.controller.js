import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as teacherAttendanceService from '../services/teacherAttendance.service.js';

export const listTeacherAttendances = asyncHandler(async (req, res) => {
  const result = await teacherAttendanceService.listTeacherAttendances(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, 'Teacher attendance records fetched successfully.', result.data, result.pagination));
});

export const getTeacherAttendance = asyncHandler(async (req, res) => {
  const attendance = await teacherAttendanceService.getTeacherAttendance(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Teacher attendance record fetched successfully.', attendance));
});

export const markTeacherAttendance = asyncHandler(async (req, res) => {
  const attendance = await teacherAttendanceService.markTeacherAttendance(req.body);
  res.status(201).json(new ApiResponse(201, 'Teacher attendance marked successfully.', attendance));
});

export const bulkMarkTeacherAttendance = asyncHandler(async (req, res) => {
  const results = await teacherAttendanceService.bulkMarkTeacherAttendance(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, `${results.length} teacher attendance records marked successfully.`, results));
});

export const updateTeacherAttendance = asyncHandler(async (req, res) => {
  const attendance = await teacherAttendanceService.updateTeacherAttendance(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Teacher attendance record updated successfully.', attendance));
});

export const deleteTeacherAttendance = asyncHandler(async (req, res) => {
  await teacherAttendanceService.deleteTeacherAttendance(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Teacher attendance record deleted successfully.', null));
});
