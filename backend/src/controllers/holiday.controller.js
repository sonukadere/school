import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as holidayService from '../services/holiday.service.js';

export const listHolidays = asyncHandler(async (req, res) => {
  const result = await holidayService.listHolidays(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, 'Holidays fetched successfully.', result.data, result.pagination));
});

export const getHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.getHoliday(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Holiday fetched successfully.', holiday));
});

export const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.createHoliday(req.body);
  res.status(201).json(new ApiResponse(201, 'Holiday created successfully.', holiday));
});

export const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await holidayService.updateHoliday(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Holiday updated successfully.', holiday));
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  await holidayService.deleteHoliday(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Holiday deleted successfully.', null));
});
