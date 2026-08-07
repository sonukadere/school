import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res
    .status(200)
    .json(new ApiResponse(200, 'Login successful.', result));
});export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, 'User account created successfully.', user));
});

export const logout = asyncHandler(async (req, res) => {
  const payload = req.token;
  const expiresAtMs = payload?.exp ? payload.exp * 1000 : Date.now();
  await authService.logout(payload?.jti, expiresAtMs);
  res.status(200).json(new ApiResponse(200, 'Logged out successfully.', null));
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, 'Profile fetched successfully.', user));
});
