// src/controllers/leave.controller.js
const prisma = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');
const { createNotification } = require('../services/notification.service');
const { getIO } = require('../socket/socket');

const getWorkingDays = (start, end) => {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const requestLeave = async (req, res, next) => {
  try {
    const employeeId = req.employeeId;
    if (!employeeId) return errorResponse(res, 'Employee profile not found.', 404);

    const { leaveType, startDate, endDate, reason, isUrgent } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) return errorResponse(res, 'Start date cannot be after end date.', 400);

    const totalDays = getWorkingDays(start, end);
    if (totalDays === 0) return errorResponse(res, 'No working days in selected range.', 400);

    // Check balance
    const year = start.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({ where: { employeeId_leaveType_year: { employeeId, leaveType, year } } });

    if (balance && balance.remaining < totalDays) {
      return errorResponse(res, `Insufficient leave balance. Available: ${balance.remaining} days, Requested: ${totalDays} days.`, 400);
    }

    // Check overlapping
    const overlap = await prisma.leaveRequest.findFirst({
      where: { employeeId, status: { in: ['PENDING', 'APPROVED'] }, OR: [{ startDate: { lte: end }, endDate: { gte: start } }] },
    });
    if (overlap) return errorResponse(res, 'You already have a leave request for this period.', 409);

    const leaveRequest = await prisma.leaveRequest.create({
      data: { employeeId, leaveType, startDate: start, endDate: end, totalDays, reason, isUrgent: !!isUrgent },
    });

    // Update pending balance
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: balance.pending + totalDays, remaining: balance.remaining - totalDays },
      });
    }

    // Notify manager
    const employee = await prisma.employee.findUnique({ where: { id: employeeId }, include: { manager: true, user: true } });
    if (employee?.manager) {
      await createNotification({
        type: 'LEAVE_REQUEST',
        priority: isUrgent ? 'HIGH' : 'MEDIUM',
        title: 'New Leave Request',
        message: `${employee.user.firstName} ${employee.user.lastName} has requested ${totalDays} day(s) of ${leaveType} leave.`,
        senderId: employeeId,
        recipientId: employee.manager.id,
        data: { leaveRequestId: leaveRequest.id },
      });
    }

    return successResponse(res, leaveRequest, 'Leave request submitted successfully', 201);
  } catch (err) { next(err); }
};

const getMyLeaves = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, leaveType } = req.query;
    const where = { employeeId: req.employeeId };
    if (status) where.status = status;
    if (leaveType) where.leaveType = leaveType;

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.leaveRequest.count({ where }),
    ]);

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId: req.employeeId, year: new Date().getFullYear() },
    });

    return paginatedResponse(res, { requests, balances }, buildPaginationMeta(total, page, limit), 'Leave data fetched');
  } catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { status, leaveType, departmentId, employeeId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (leaveType) where.leaveType = leaveType;
    if (employeeId) where.employeeId = employeeId;
    if (departmentId) where.employee = { departmentId };

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where, skip, take: limit,
        include: { employee: { include: { user: { select: { firstName: true, lastName: true, avatar: true } }, department: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return paginatedResponse(res, requests, buildPaginationMeta(total, page, limit), 'Leave requests fetched');
  } catch (err) { next(err); }
};

const approveLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, rejectReason } = req.body; // action: 'approve' | 'reject'

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { include: { user: true, manager: true } } },
    });

    if (!leaveRequest) return errorResponse(res, 'Leave request not found.', 404);
    if (leaveRequest.status !== 'PENDING') return errorResponse(res, 'Leave request is not in pending state.', 400);

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: newStatus, approvedById: req.employeeId, approvedAt: new Date(), rejectReason: rejectReason || null },
    });

    // Update balance
    const balance = await prisma.leaveBalance.findUnique({
      where: { employeeId_leaveType_year: { employeeId: leaveRequest.employeeId, leaveType: leaveRequest.leaveType, year: new Date(leaveRequest.startDate).getFullYear() } },
    });

    if (balance) {
      if (newStatus === 'APPROVED') {
        await prisma.leaveBalance.update({ where: { id: balance.id }, data: { used: balance.used + leaveRequest.totalDays, pending: Math.max(0, balance.pending - leaveRequest.totalDays) } });
      } else {
        await prisma.leaveBalance.update({ where: { id: balance.id }, data: { pending: Math.max(0, balance.pending - leaveRequest.totalDays), remaining: balance.remaining + leaveRequest.totalDays } });
      }
    }

    // Notify employee
    const emp = leaveRequest.employee;
    await createNotification({
      type: newStatus === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      priority: 'HIGH',
      title: `Leave ${newStatus === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: newStatus === 'APPROVED'
        ? `Your ${leaveRequest.leaveType} leave request has been approved.`
        : `Your ${leaveRequest.leaveType} leave request was rejected. Reason: ${rejectReason || 'Not specified'}`,
      recipientId: leaveRequest.employeeId,
      data: { leaveRequestId: id },
    });

    try {
      getIO().to(`employee_${leaveRequest.employeeId}`).emit('leave:updated', { status: newStatus, leaveRequestId: id });
    } catch (_) {}

    return successResponse(res, updated, `Leave request ${newStatus.toLowerCase()} successfully`);
  } catch (err) { next(err); }
};

const cancelLeave = async (req, res, next) => {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
    if (!leaveRequest) return errorResponse(res, 'Leave request not found.', 404);
    if (leaveRequest.employeeId !== req.employeeId) return errorResponse(res, 'Unauthorized.', 403);
    if (!['PENDING'].includes(leaveRequest.status)) return errorResponse(res, 'Cannot cancel this leave request.', 400);

    await prisma.leaveRequest.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });

    const balance = await prisma.leaveBalance.findUnique({
      where: { employeeId_leaveType_year: { employeeId: leaveRequest.employeeId, leaveType: leaveRequest.leaveType, year: new Date(leaveRequest.startDate).getFullYear() } },
    });
    if (balance) {
      await prisma.leaveBalance.update({ where: { id: balance.id }, data: { pending: Math.max(0, balance.pending - leaveRequest.totalDays), remaining: balance.remaining + leaveRequest.totalDays } });
    }

    return successResponse(res, null, 'Leave request cancelled');
  } catch (err) { next(err); }
};

const getBalances = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId || req.employeeId;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({ where: { employeeId, year } });
    return successResponse(res, balances, 'Leave balances fetched');
  } catch (err) { next(err); }
};

const { sendEmail } = require('../utils/email');

const processMonthlyLeaves = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const employees = await prisma.employee.findMany({
      include: { user: { select: { email: true, firstName: true } } },
    });

    let emailsSentZeroLeaves = 0;
    let leavesCancelled = 0;

    for (const emp of employees) {
      if (!emp.user?.email) continue;

      // Count approved leaves in this month
      const approvedLeaves = await prisma.leaveRequest.count({
        where: {
          employeeId: emp.id,
          status: 'APPROVED',
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
        },
      });

      if (approvedLeaves === 0) {
        // Send 0 leaves email
        const subject = 'Monthly Leave Balance Reminder';
        const message = `Hi ${emp.user.firstName},<br><br>You have taken 0 leaves this month. Remember to utilize your leave balances to maintain a healthy work-life balance!<br><br>HR Team`;
        await sendEmail(emp.user.email, subject, message);
        emailsSentZeroLeaves++;
      } else {
        // Cancel any pending leaves in this month
        const pendingLeaves = await prisma.leaveRequest.findMany({
          where: {
            employeeId: emp.id,
            status: 'PENDING',
            startDate: { lte: endOfMonth },
            endDate: { gte: startOfMonth },
          },
        });

        for (const req of pendingLeaves) {
          await prisma.leaveRequest.update({
            where: { id: req.id },
            data: { status: 'REJECTED', rejectReason: 'Automated: Already utilized a leave this month.' },
          });

          // Restore balance
          const balance = await prisma.leaveBalance.findUnique({
            where: { employeeId_leaveType_year: { employeeId: emp.id, leaveType: req.leaveType, year: now.getFullYear() } },
          });
          if (balance) {
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: { pending: Math.max(0, balance.pending - req.totalDays), remaining: balance.remaining + req.totalDays },
            });
          }

          // Email employee
          const subject = 'Leave Request Auto-Cancelled';
          const message = `Hi ${emp.user.firstName},<br><br>Your pending ${req.leaveType} leave request has been automatically cancelled because you have already utilized a leave this month.<br><br>HR Team`;
          await sendEmail(emp.user.email, subject, message);
          leavesCancelled++;
        }
      }
    }

    return successResponse(res, { emailsSentZeroLeaves, leavesCancelled }, 'Monthly leave processing completed.');
  } catch (err) { next(err); }
};

const sendBulkMail = async (req, res, next) => {
  try {
    const { leaveIds, subject, message } = req.body;
    if (!leaveIds || !Array.isArray(leaveIds) || leaveIds.length === 0) {
      return errorResponse(res, 'No leave requests selected', 400);
    }
    
    const leaves = await prisma.leaveRequest.findMany({
      where: { id: { in: leaveIds } },
      include: { employee: { include: { user: true } } }
    });

    for (const leave of leaves) {
      if (leave.employee?.user?.email) {
        const personalizedMsg = message.replace(/{{name}}/g, leave.employee.user.firstName);
        await sendEmail(leave.employee.user.email, subject, personalizedMsg);
      }
    }
    
    return successResponse(res, null, 'Emails sent successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { requestLeave, getMyLeaves, getAll, approveLeave, cancelLeave, getBalances, processMonthlyLeaves, sendBulkMail };
