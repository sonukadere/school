import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as settingService from '../services/setting.service.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings();
  res.status(200).json(new ApiResponse(200, 'Settings fetched successfully.', settings));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.updateSettings(req.body);
  res.status(200).json(new ApiResponse(200, 'Settings updated successfully.', settings));
});

export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.', errors: [] });
  }
  const publicPath = `/uploads/${req.file.filename}`;
  const settings = await settingService.updateLogo(publicPath);
  res.status(200).json(new ApiResponse(200, 'School logo uploaded successfully.', settings));
});
