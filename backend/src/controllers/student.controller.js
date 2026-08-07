import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as studentService from '../services/student.service.js';

export const listStudents = asyncHandler(async (req, res) => {
  const result = await studentService.listStudents(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Students fetched successfully.', result.data, result.pagination));
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await studentService.getStudent(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Student fetched successfully.', student));
});

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body);
  res.status(201).json(new ApiResponse(201, 'Student created successfully.', student));
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Student updated successfully.', student));
});

export const deleteStudent = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Student deleted successfully.', null));
});
