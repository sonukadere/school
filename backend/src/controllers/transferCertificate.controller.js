import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as tcService from '../services/transferCertificate.service.js';

export const listTransferCertificates = asyncHandler(async (req, res) => {
  const result = await tcService.listTransferCertificates(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Transfer certificates fetched successfully.', result.data, result.pagination));
});

export const getTransferCertificate = asyncHandler(async (req, res) => {
  const tc = await tcService.getTransferCertificate(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Transfer certificate fetched successfully.', tc));
});

export const getStudentTransferCertificate = asyncHandler(async (req, res) => {
  const tc = await tcService.getStudentTransferCertificate(req.params.studentId, req.user);
  res.status(200).json(new ApiResponse(200, 'Student transfer certificate fetched successfully.', tc));
});

export const createTransferCertificate = asyncHandler(async (req, res) => {
  const tc = await tcService.createTransferCertificate(req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Transfer certificate generated successfully.', tc));
});

export const updateTransferCertificate = asyncHandler(async (req, res) => {
  const tc = await tcService.updateTransferCertificate(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, 'Transfer certificate updated successfully.', tc));
});

export const deleteTransferCertificate = asyncHandler(async (req, res) => {
  await tcService.deleteTransferCertificate(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Transfer certificate cancelled successfully.', null));
});
