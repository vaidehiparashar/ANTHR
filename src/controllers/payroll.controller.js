// src/controllers/payroll.controller.js
const prisma = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

const getMyPayroll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [records, total] = await Promise.all([
      prisma.payroll.findMany({
        where: { employeeId: req.employeeId },
        skip, take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.payroll.count({ where: { employeeId: req.employeeId } }),
    ]);
    return paginatedResponse(res, records, buildPaginationMeta(total, page, limit), 'Payroll fetched');
  } catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { month, year, status, employeeId } = req.query;
    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const [records, total] = await Promise.all([
      prisma.payroll.findMany({
        where, skip, take: limit,
        include: { employee: { include: { user: { select: { firstName: true, lastName: true } }, department: true } } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.payroll.count({ where }),
    ]);
    return paginatedResponse(res, records, buildPaginationMeta(total, page, limit), 'Payroll records fetched');
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: req.params.id },
      include: { employee: { include: { user: { select: { firstName: true, lastName: true, email: true } }, department: true, position: true } } },
    });
    if (!payroll) return errorResponse(res, 'Payroll record not found.', 404);
    return successResponse(res, payroll, 'Payroll fetched');
  } catch (err) { next(err); }
};

const processPayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year, allowances = 0, overtime = 0, bonus = 0, taxDeduction = 0, providentFund = 0, healthInsurance = 0, otherDeductions = 0, notes } = req.body;

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return errorResponse(res, 'Employee not found.', 404);

    const existing = await prisma.payroll.findUnique({ where: { employeeId_month_year: { employeeId, month: parseInt(month), year: parseInt(year) } } });
    if (existing) return errorResponse(res, 'Payroll already processed for this period.', 409);

    const basicSalary = parseFloat(employee.salary);
    const grossSalary = basicSalary + parseFloat(allowances) + parseFloat(overtime) + parseFloat(bonus);
    const totalDeductions = parseFloat(taxDeduction) + parseFloat(providentFund) + parseFloat(healthInsurance) + parseFloat(otherDeductions);
    const netSalary = grossSalary - totalDeductions;

    const count = await prisma.payroll.count();
    const payroll = await prisma.payroll.create({
      data: {
        payrollNumber: `PAY${String(count + 1).padStart(6, '0')}`,
        employeeId, month: parseInt(month), year: parseInt(year),
        basicSalary, allowances: parseFloat(allowances), overtime: parseFloat(overtime),
        bonus: parseFloat(bonus), grossSalary, taxDeduction: parseFloat(taxDeduction),
        providentFund: parseFloat(providentFund), healthInsurance: parseFloat(healthInsurance),
        otherDeductions: parseFloat(otherDeductions), totalDeductions, netSalary,
        status: 'PROCESSED', processedById: req.employeeId, notes,
      },
      include: { employee: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
    return successResponse(res, payroll, 'Payroll processed', 201);
  } catch (err) { next(err); }
};

const updatePayrollStatus = async (req, res, next) => {
  try {
    const { status, transactionRef, paymentMethod } = req.body;
    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { status, transactionRef, paymentMethod, paidAt: status === 'PAID' ? new Date() : undefined },
    });
    return successResponse(res, payroll, 'Payroll status updated');
  } catch (err) { next(err); }
};

module.exports = { getMyPayroll, getAll, getOne, processPayroll, updatePayrollStatus };
