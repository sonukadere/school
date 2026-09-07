import * as payrollService from '../services/payroll.service.js';

export async function listSalaryStructures(req, res, next) {
  try {
    const result = await payrollService.getTeacherSalaryStructures(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function saveSalaryStructure(req, res, next) {
  try {
    const saved = await payrollService.saveTeacherSalaryStructure(req.body, req.user);
    res.status(200).json({ success: true, message: 'Teacher salary structure updated successfully.', data: saved });
  } catch (err) {
    next(err);
  }
}

export async function generateMonthlyPayroll(req, res, next) {
  try {
    const result = await payrollService.generateMonthlyPayroll(req.body, req.user);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function listPayroll(req, res, next) {
  try {
    const result = await payrollService.listPayroll(req.query, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getPayrollById(req, res, next) {
  try {
    const result = await payrollService.getPayrollById(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function markSalaryPaid(req, res, next) {
  try {
    const result = await payrollService.markSalaryPaid(req.params.id, req.body, req.user);
    res.json({ success: true, message: 'Salary disbursed successfully.', ...result });
  } catch (err) {
    next(err);
  }
}

export async function getPayslip(req, res, next) {
  try {
    const result = await payrollService.getPayslip(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPayrollReports(req, res, next) {
  try {
    const result = await payrollService.getPayrollReports(req.query, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
