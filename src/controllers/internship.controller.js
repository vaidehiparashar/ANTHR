// src/controllers/internship.controller.js
const prisma = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const internships = await prisma.internship.findMany({
      include: { employee: { include: { user: { select: { firstName: true, lastName: true, email: true } }, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, internships, 'Internships fetched');
  } catch (err) { next(err); }
};

const getMy = async (req, res, next) => {
  try {
    const internship = await prisma.internship.findUnique({ where: { employeeId: req.employeeId } });
    return successResponse(res, internship, 'Internship fetched');
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { employeeId, programName, institution, startDate, endDate, stipend, objectives } = req.body;
    const internship = await prisma.internship.create({
      data: { employeeId, programName, institution, startDate: new Date(startDate), endDate: new Date(endDate), stipend: stipend ? parseFloat(stipend) : null, objectives },
    });
    return successResponse(res, internship, 'Internship created', 201);
  } catch (err) { next(err); }
};

const { sendEmail } = require('../utils/email');

const update = async (req, res, next) => {
  try {
    const internship = await prisma.internship.update({ where: { id: req.params.id }, data: req.body });
    return successResponse(res, internship, 'Internship updated');
  } catch (err) { next(err); }
};

const sendBulkMail = async (req, res, next) => {
  try {
    const { internIds, subject, message } = req.body;
    if (!internIds || !internIds.length || !subject || !message) {
      return errorResponse(res, 'Missing required fields: internIds, subject, message');
    }

    const interns = await prisma.employee.findMany({
      where: { id: { in: internIds }, employmentType: 'INTERN' },
      include: { user: { select: { email: true, firstName: true } } },
    });

    const sentCount = 0;
    for (const intern of interns) {
      if (intern.user?.email) {
        // personalize message if needed
        const personalizedMsg = message.replace('{{name}}', intern.user.firstName);
        await sendEmail(intern.user.email, subject, personalizedMsg);
      }
    }

    return successResponse(res, { count: interns.length }, `Successfully sent ${interns.length} emails`);
  } catch (err) { next(err); }
};

module.exports = { getAll, getMy, create, update, sendBulkMail };
