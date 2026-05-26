// src/controllers/employee.controller.js
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

const generateEmployeeId = async () => {
  const count = await prisma.employee.count();
  return `EMP${String(count + 1).padStart(4, '0')}`;
};

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, departmentId, status, employmentType } = req.query;

    const where = {};
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true, lastLoginAt: true } },
          department: true,
          position: true,
          manager: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return paginatedResponse(res, employees, buildPaginationMeta(total, page, limit), 'Employees fetched successfully');
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true, isActive: true, lastLoginAt: true, createdAt: true } },
        department: true,
        position: true,
        manager: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        subordinates: { include: { user: { select: { firstName: true, lastName: true } } } },
        leaveBalances: true,
        internship: true,
        documents: true,
      },
    });
    if (!employee) return errorResponse(res, 'Employee not found.', 404);
    return successResponse(res, employee, 'Employee fetched successfully');
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, role, departmentId, positionId, managerId, salary, hireDate, employmentType, workLocation, bankName, bankAccountNo, emergencyName, emergencyPhone, emergencyRelation } = req.body;

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return errorResponse(res, 'Email already registered.', 409);

    const hashedPw = await bcrypt.hash(password || 'Welcome@123', 12);
    const employeeId = await generateEmployeeId();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: email.toLowerCase(), password: hashedPw, firstName, lastName, phone, role: role || 'EMPLOYEE', isVerified: true },
      });

      const employee = await tx.employee.create({
        data: {
          employeeId,
          userId: user.id,
          departmentId,
          positionId,
          managerId: managerId || null,
          salary: parseFloat(salary),
          hireDate: new Date(hireDate),
          employmentType: employmentType || 'FULL_TIME',
          workLocation,
          bankName,
          bankAccountNo,
          emergencyName,
          emergencyPhone,
          emergencyRelation,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
          department: true,
          position: true,
        },
      });

      // Create default leave balances for current year
      const year = new Date().getFullYear();
      const leaveTypes = ['ANNUAL', 'SICK', 'EMERGENCY'];
      const leaveAllocation = { ANNUAL: 15, SICK: 10, EMERGENCY: 3 };
      await Promise.all(leaveTypes.map(lt =>
        tx.leaveBalance.create({
          data: { employeeId: employee.id, leaveType: lt, year, allocated: leaveAllocation[lt], used: 0, pending: 0, remaining: leaveAllocation[lt] },
        })
      ));

      return employee;
    });

    return successResponse(res, result, 'Employee created successfully', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar, departmentId, positionId, managerId, workLocation, bankName, bankAccountNo, bankRoutingNo, taxId, emergencyName, emergencyPhone, emergencyRelation, status, employmentType } = req.body;

    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!employee) return errorResponse(res, 'Employee not found.', 404);

    const [updatedEmployee] = await Promise.all([
      prisma.employee.update({
        where: { id: req.params.id },
        data: { departmentId, positionId, managerId, workLocation, bankName, bankAccountNo, bankRoutingNo, taxId, emergencyName, emergencyPhone, emergencyRelation, status, employmentType },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } }, department: true, position: true },
      }),
      prisma.user.update({
        where: { id: employee.userId },
        data: { firstName, lastName, phone, avatar },
      }),
    ]);

    return successResponse(res, updatedEmployee, 'Employee updated successfully');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!employee) return errorResponse(res, 'Employee not found.', 404);

    await prisma.employee.update({
      where: { id: req.params.id },
      data: { status: 'TERMINATED', terminationDate: new Date() },
    });
    await prisma.user.update({ where: { id: employee.userId }, data: { isActive: false } });

    return successResponse(res, null, 'Employee terminated successfully');
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const [total, active, onLeave, byDepartment, byEmploymentType] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.employee.groupBy({ by: ['departmentId'], _count: true }),
      prisma.employee.groupBy({ by: ['employmentType'], _count: true }),
    ]);

    return successResponse(res, { total, active, onLeave, byDepartment, byEmploymentType }, 'Stats fetched');
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, getStats };
