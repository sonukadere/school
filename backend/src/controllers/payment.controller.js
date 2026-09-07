import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import * as paymentService from '../services/payment.service.js';
import { prisma } from '../config/database.js';
import { notDeleted } from '../utils/helpers.js';

export const listPayments = asyncHandler(async (req, res) => {
  const result = await paymentService.listPayments(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Payment records retrieved successfully.', result.data, result.pagination));
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPayment(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Payment details retrieved successfully.', payment));
});

export const recordPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.recordPayment(req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Payment recorded successfully.', result));
});

export const updatePayment = asyncHandler(async (req, res) => {
  const updated = await paymentService.updatePayment(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, 'Payment record updated successfully.', updated));
});

export const cancelPayment = asyncHandler(async (req, res) => {
  const cancelled = await paymentService.cancelPayment(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Payment record cancelled successfully.', cancelled));
});

export const getPaymentReceipt = asyncHandler(async (req, res) => {
  const receipt = await paymentService.getPaymentReceipt(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Payment receipt retrieved successfully.', receipt));
});

export const listPendingFees = asyncHandler(async (req, res) => {
  const result = await paymentService.listPendingFees(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Pending fees retrieved successfully.', result.data, result.pagination));
});

export const getPaymentReports = asyncHandler(async (req, res) => {
  const reports = await paymentService.getPaymentReports(req.query, req.user);
  res.status(200).json(new ApiResponse(200, 'Payment reports retrieved successfully.', reports));
});

export const getStudentFeeLedger = asyncHandler(async (req, res) => {
  const ledger = await paymentService.getStudentFeeLedger(req.params.studentId, req.user);
  res.status(200).json(new ApiResponse(200, 'Student fee ledger retrieved successfully.', ledger));
});

// Fee Structure endpoints
export const listFeeStructures = asyncHandler(async (req, res) => {
  const result = await paymentService.listFeeStructures(req.query, req.user);
  res
    .status(200)
    .json(new ApiResponse(200, 'Fee structures retrieved successfully.', result.data, result.pagination));
});

export const createFeeStructure = asyncHandler(async (req, res) => {
  const created = await paymentService.createFeeStructure(req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Fee structure created successfully.', created));
});

export const updateFeeStructure = asyncHandler(async (req, res) => {
  const updated = await paymentService.updateFeeStructure(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, 'Fee structure updated successfully.', updated));
});

export const deleteFeeStructure = asyncHandler(async (req, res) => {
  await paymentService.deleteFeeStructure(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, 'Fee structure deleted successfully.', null));
});

// Schools list (for Super Admin filter)
export const listSchools = asyncHandler(async (req, res) => {
  let schools = await prisma.school.findMany({
    where: notDeleted(),
    orderBy: { name: 'asc' },
  });

  if (!schools.length) {
    const setting = await prisma.setting.findFirst();
    schools = [
      {
        id: 'SCH001',
        code: 'SCH001',
        name: setting?.schoolName || 'Daily Day Academy',
        logo: setting?.schoolLogo || '/logo.svg',
        address: setting?.address,
      },
    ];
  }

  res.status(200).json(new ApiResponse(200, 'Schools fetched successfully.', schools));
});

export const assignFeeStructureToClass = asyncHandler(async (req, res) => {
  const result = await paymentService.assignFeeStructureToClass(req.body, req.user);
  res.status(201).json(new ApiResponse(201, result.message, result));
});

export const assignFeeToStudent = asyncHandler(async (req, res) => {
  const invoice = await paymentService.assignFeeToStudent(req.body, req.user);
  res.status(201).json(new ApiResponse(201, 'Student fee invoice created successfully.', invoice));
});

export const getFinanceSummary = asyncHandler(async (req, res) => {
  const summary = await paymentService.getFinanceSummary(req.query, req.user);
  res.status(200).json(new ApiResponse(200, 'Finance summary fetched successfully.', summary));
});

