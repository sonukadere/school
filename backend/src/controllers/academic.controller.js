import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as homeworkService from '../services/homework.service.js';
import * as assignmentService from '../services/assignment.service.js';
import * as studyMaterialService from '../services/studyMaterial.service.js';
import * as leaveService from '../services/leave.service.js';

// Homework
export const listHomework = asyncHandler(async (req, res) => {
  const result = await homeworkService.listHomework(req.query, req.user);
  res.status(200).json(new ApiResponse(200, 'Homework fetched successfully.', result.data, result.pagination));
});

export const getHomework = asyncHandler(async (req, res) => {
  const item = await homeworkService.getHomeworkById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Homework details fetched.', item));
});

export const createHomework = asyncHandler(async (req, res) => {
  const item = await homeworkService.createHomework(req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Homework assigned successfully.', item));
});

export const updateHomework = asyncHandler(async (req, res) => {
  const item = await homeworkService.updateHomework(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Homework updated.', item));
});

export const deleteHomework = asyncHandler(async (req, res) => {
  const result = await homeworkService.deleteHomework(req.params.id);
  res.status(200).json(new ApiResponse(200, result.message, null));
});

// Assignment
export const listAssignments = asyncHandler(async (req, res) => {
  const result = await assignmentService.listAssignments(req.query, req.user);
  res.status(200).json(new ApiResponse(200, 'Assignments fetched successfully.', result.data, result.pagination));
});

export const getAssignment = asyncHandler(async (req, res) => {
  const item = await assignmentService.getAssignmentById(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Assignment details fetched.', item));
});

export const createAssignment = asyncHandler(async (req, res) => {
  const item = await assignmentService.createAssignment(req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Assignment created successfully.', item));
});

export const updateAssignment = asyncHandler(async (req, res) => {
  const item = await assignmentService.updateAssignment(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Assignment updated.', item));
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const result = await assignmentService.deleteAssignment(req.params.id);
  res.status(200).json(new ApiResponse(200, result.message, null));
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const submission = await assignmentService.submitAssignment(req.params.id, req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Assignment submitted successfully.', submission));
});

export const gradeSubmission = asyncHandler(async (req, res) => {
  const result = await assignmentService.gradeSubmission(req.params.id, req.params.submissionId, req.body);
  res.status(200).json(new ApiResponse(200, 'Submission graded successfully.', result));
});

// Study Material
export const listStudyMaterials = asyncHandler(async (req, res) => {
  const result = await studyMaterialService.listStudyMaterials(req.query, req.user);
  res.status(200).json(new ApiResponse(200, 'Study materials fetched.', result.data, result.pagination));
});

export const getStudyMaterial = asyncHandler(async (req, res) => {
  const item = await studyMaterialService.getStudyMaterialById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Study material details fetched.', item));
});

export const createStudyMaterial = asyncHandler(async (req, res) => {
  const item = await studyMaterialService.createStudyMaterial(req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Study material uploaded successfully.', item));
});

export const updateStudyMaterial = asyncHandler(async (req, res) => {
  const item = await studyMaterialService.updateStudyMaterial(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Study material updated.', item));
});

export const deleteStudyMaterial = asyncHandler(async (req, res) => {
  const result = await studyMaterialService.deleteStudyMaterial(req.params.id);
  res.status(200).json(new ApiResponse(200, result.message, null));
});

// Leave Request
export const listLeaveRequests = asyncHandler(async (req, res) => {
  const result = await leaveService.listLeaveRequests(req.query, req.user);
  res.status(200).json(new ApiResponse(200, 'Leave requests fetched.', result.data, result.pagination));
});

export const getLeaveRequest = asyncHandler(async (req, res) => {
  const item = await leaveService.getLeaveRequestById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Leave request details.', item));
});

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const item = await leaveService.createLeaveRequest(req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Leave request submitted successfully.', item));
});

export const reviewLeaveRequest = asyncHandler(async (req, res) => {
  const item = await leaveService.reviewLeaveRequest(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, `Leave request ${item.status.toLowerCase()}.`, item));
});
