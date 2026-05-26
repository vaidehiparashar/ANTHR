// src/controllers/recruitment.controller.js
const prisma = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');

const getJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, departmentId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where, skip, take: limit,
        include: { department: true, position: true, _count: { select: { applications: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobPosting.count({ where }),
    ]);
    return paginatedResponse(res, jobs, buildPaginationMeta(total, page, limit), 'Jobs fetched');
  } catch (err) { next(err); }
};

const createJob = async (req, res, next) => {
  try {
    const { title, departmentId, positionId, description, requirements, responsibilities, employmentType, location, salaryMin, salaryMax, openings, deadline } = req.body;
    const count = await prisma.jobPosting.count();
    const job = await prisma.jobPosting.create({
      data: {
        jobCode: `JOB${String(count + 1).padStart(4, '0')}`,
        title, departmentId, positionId, description, requirements,
        responsibilities: responsibilities || '',
        employmentType: employmentType || 'FULL_TIME',
        location: location || 'Main Office',
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        openings: parseInt(openings) || 1,
        deadline: deadline ? new Date(deadline) : null,
        postedById: req.employeeId,
      },
      include: { department: true, position: true },
    });
    return successResponse(res, job, 'Job posting created', 201);
  } catch (err) { next(err); }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await prisma.jobPosting.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return successResponse(res, job, 'Job updated');
  } catch (err) { next(err); }
};

const getApplications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, jobPostingId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (jobPostingId) where.jobPostingId = jobPostingId;

    const [apps, total] = await Promise.all([
      prisma.application.findMany({
        where, skip, take: limit,
        include: { jobPosting: { include: { department: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);
    return paginatedResponse(res, apps, buildPaginationMeta(total, page, limit), 'Applications fetched');
  } catch (err) { next(err); }
};

const createApplication = async (req, res, next) => {
  try {
    const count = await prisma.application.count();
    const app = await prisma.application.create({
      data: { ...req.body, applicationNo: `APP${String(count + 1).padStart(4, '0')}` },
    });
    return successResponse(res, app, 'Application submitted', 201);
  } catch (err) { next(err); }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const app = await prisma.application.update({
      where: { id: req.params.id },
      data: { status: req.body.status, notes: req.body.notes },
    });
    return successResponse(res, app, 'Application status updated');
  } catch (err) { next(err); }
};

module.exports = { getJobs, createJob, updateJob, getApplications, createApplication, updateApplicationStatus };
