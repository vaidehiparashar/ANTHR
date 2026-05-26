// src/controllers/department.controller.js
const prisma = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, departments, 'Departments fetched');
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        head: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        employees: { include: { user: { select: { firstName: true, lastName: true, email: true, avatar: true } }, position: true } },
      },
    });
    if (!dept) return errorResponse(res, 'Department not found.', 404);
    return successResponse(res, dept, 'Department fetched');
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const dept = await prisma.department.create({ data: req.body });
    return successResponse(res, dept, 'Department created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const dept = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
    return successResponse(res, dept, 'Department updated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const count = await prisma.employee.count({ where: { departmentId: req.params.id } });
    if (count > 0) return errorResponse(res, 'Cannot delete department with active employees.', 400);
    await prisma.department.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Department deleted');
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
