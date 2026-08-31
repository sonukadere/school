import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as noticeService from '../services/notice.service.js';

export const listNotices = asyncHandler(async (req, res) => {
  const result = await noticeService.listNotices(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Notices fetched successfully.', result.data, result.pagination));
});

export const getNotice = asyncHandler(async (req, res) => {
  const notice = await noticeService.getNotice(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Notice fetched successfully.', notice));
});

export const createNotice = asyncHandler(async (req, res) => {
  const notice = await noticeService.createNotice(req.body);
  res.status(201).json(new ApiResponse(201, 'Notice created successfully.', notice));
});

export const updateNotice = asyncHandler(async (req, res) => {
  const notice = await noticeService.updateNotice(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Notice updated successfully.', notice));
});

export const deleteNotice = asyncHandler(async (req, res) => {
  await noticeService.deleteNotice(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Notice deleted successfully.', null));
});
