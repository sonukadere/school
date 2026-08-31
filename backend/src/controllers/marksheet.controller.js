import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as marksheetService from '../services/marksheet.service.js';

export const getStudentMarksheet = asyncHandler(async (req, res) => {
  const { studentId, examId } = req.params;
  const marksheet = await marksheetService.generateStudentMarksheet(studentId, examId, req.user);
  res.status(200).json(new ApiResponse(200, 'Marksheet generated successfully.', marksheet));
});

export const getStudentMarksheets = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const marksheets = await marksheetService.getStudentMarksheets(studentId, req.user);
  res.status(200).json(new ApiResponse(200, 'Student marksheets fetched successfully.', marksheets));
});

export const getClassMarksheets = asyncHandler(async (req, res) => {
  const { classId, examId } = req.params;
  const marksheets = await marksheetService.getClassMarksheets(classId, examId, req.user);
  res.status(200).json(new ApiResponse(200, 'Class marksheets generated successfully.', marksheets));
});
