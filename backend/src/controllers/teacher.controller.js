import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as teacherService from '../services/teacher.service.js';

export const listTeachers = asyncHandler(async (req, res) => {
  const result = await teacherService.listTeachers(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Teachers fetched successfully.', result.data, result.pagination));
});

export const getTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacher(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Teacher fetched successfully.', teacher));
});

export const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacher(req.body);
  res.status(201).json(new ApiResponse(201, 'Teacher created successfully.', teacher));
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.updateTeacher(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Teacher updated successfully.', teacher));
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  await teacherService.deleteTeacher(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Teacher deleted successfully.', null));
});
