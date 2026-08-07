import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as eventService from '../services/event.service.js';

export const listEvents = asyncHandler(async (req, res) => {
  const result = await eventService.listEvents(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, 'Events fetched successfully.', result.data, result.pagination));
});

export const getEvent = asyncHandler(async (req, res) => {
  const event = await eventService.getEvent(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Event fetched successfully.', event));
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body);
  res.status(201).json(new ApiResponse(201, 'Event created successfully.', event));
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Event updated successfully.', event));
});

export const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Event deleted successfully.', null));
});
