import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as dashboardService from '../services/dashboard.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getDashboard(req.user);
  res.status(200).json(new ApiResponse(200, 'Dashboard data fetched successfully.', dashboard));
});
