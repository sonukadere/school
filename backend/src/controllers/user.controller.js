import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';
import { ROLES, ROLE_LABELS } from '../constants/index.js';

export const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, 'Users fetched successfully.', result.data, result.pagination));
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.status(200).json(new ApiResponse(200, 'User fetched successfully.', user));
});

export const getRoleOptions = asyncHandler(async (req, res) => {
  const roles = Object.values(ROLES).map((role) => ({
    value: role,
    label: ROLE_LABELS[role] || role,
  }));
  res.status(200).json(new ApiResponse(200, 'Roles fetched successfully.', roles));
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(new ApiResponse(201, 'User account created successfully.', user));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'User account updated successfully.', user));
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(200).json(new ApiResponse(200, 'User account deleted successfully.', null));
});
