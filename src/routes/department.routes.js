// src/routes/department.routes.js
const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { employees: { where: { status: 'ACTIVE' } } } },
        head: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, departments, 'Departments fetched');
  } catch (err) { next(err); }
});

router.post('/', authorize('SUPER_ADMIN', 'HR_ADMIN'), async (req, res, next) => {
  try {
    const { name, code, description, budget } = req.body;
    const dept = await prisma.department.create({
      data: { name, code: code.toUpperCase(), description, budget: budget ? parseFloat(budget) : null },
    });
    return successResponse(res, dept, 'Department created', 201);
  } catch (err) { next(err); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'HR_ADMIN'), async (req, res, next) => {
  try {
    const { name, description, budget, headId } = req.body;
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: { name, description, budget: budget ? parseFloat(budget) : undefined, headId: headId || null },
    });
    return successResponse(res, dept, 'Department updated');
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const empCount = await prisma.employee.count({ where: { departmentId: req.params.id, status: 'ACTIVE' } });
    if (empCount > 0) return errorResponse(res, 'Cannot delete department with active employees.', 400);
    await prisma.department.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Department deleted');
  } catch (err) { next(err); }
});

module.exports = router;
