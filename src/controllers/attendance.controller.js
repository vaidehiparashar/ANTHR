// src/controllers/attendance.controller.js
const prisma = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');
const { getIO } = require('../socket/socket');

const toDateOnly = (d) => {
  const date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const formatTime = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const calcHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return null;
  const diff = (new Date(clockOut) - new Date(clockIn)) / (1000 * 60 * 60);
  return Math.round(diff * 100) / 100;
};

const clockIn = async (req, res, next) => {
  try {
    const employeeId = req.employeeId;
    if (!employeeId) return errorResponse(res, 'Employee profile not found.', 404);

    const today = toDateOnly(new Date());
    const existing = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date: today } } });

    if (existing?.clockIn) return errorResponse(res, 'Already clocked in today.', 400);

    const now = new Date();
    const inTime = formatTime(now);

    // Determine if late (after 9:30 AM)
    const lateThreshold = new Date(today);
    lateThreshold.setHours(9, 30, 0);
    const isLate = now > lateThreshold;

    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: { clockIn: now, inTime, status: isLate ? 'LATE' : 'PRESENT', ipAddress: req.ip, location: req.body.location },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: { employeeId, date: today, clockIn: now, inTime, status: isLate ? 'LATE' : 'PRESENT', ipAddress: req.ip, location: req.body.location },
      });
    }

    // Real-time notification
    try {
      getIO().to(`employee_${employeeId}`).emit('attendance:clockIn', { employeeId, inTime, isLate });
    } catch (_) {}

    return successResponse(res, { ...attendance, inTime, isLate }, 'Clocked in successfully');
  } catch (err) { next(err); }
};

const clockOut = async (req, res, next) => {
  try {
    const employeeId = req.employeeId;
    if (!employeeId) return errorResponse(res, 'Employee profile not found.', 404);

    const today = toDateOnly(new Date());
    const attendance = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date: today } } });

    if (!attendance || !attendance.clockIn) return errorResponse(res, 'No clock-in found for today.', 400);
    if (attendance.clockOut) return errorResponse(res, 'Already clocked out today.', 400);

    const now = new Date();
    const outTime = formatTime(now);
    const totalHours = calcHours(attendance.clockIn, now);
    const overtime = totalHours > 8 ? Math.round((totalHours - 8) * 100) / 100 : 0;

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { clockOut: now, outTime, totalHours, overtime, status: totalHours < 4 ? 'HALF_DAY' : attendance.status },
    });

    try {
      getIO().to(`employee_${employeeId}`).emit('attendance:clockOut', { employeeId, outTime, totalHours, overtime });
    } catch (_) {}

    return successResponse(res, { ...updated, outTime, totalHours, overtime }, 'Clocked out successfully');
  } catch (err) { next(err); }
};

const getToday = async (req, res, next) => {
  try {
    const employeeId = req.employeeId;
    const today = toDateOnly(new Date());
    const attendance = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date: today } } });
    return successResponse(res, attendance || { status: 'NOT_CLOCKED_IN' }, 'Today attendance fetched');
  } catch (err) { next(err); }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { month, year } = req.query;
    const employeeId = req.employeeId;

    const where = { employeeId };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      where.date = { gte: start, lte: end };
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
      prisma.attendance.count({ where }),
    ]);

    // Stats
    const stats = {
      present: records.filter(r => r.status === 'PRESENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
      totalHours: records.reduce((sum, r) => sum + (parseFloat(r.totalHours) || 0), 0).toFixed(2),
    };

    return paginatedResponse(res, { records, stats }, buildPaginationMeta(total, page, limit), 'Attendance fetched');
  } catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { employeeId, departmentId, date, month, year, status } = req.query;

    const where = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (date) where.date = toDateOnly(new Date(date));
    if (month && year) {
      where.date = { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) };
    }
    if (departmentId) where.employee = { departmentId };

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where, skip, take: limit,
        include: { employee: { include: { user: { select: { firstName: true, lastName: true } }, department: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ]);

    return paginatedResponse(res, records, buildPaginationMeta(total, page, limit), 'Attendance records fetched');
  } catch (err) { next(err); }
};

const manualEntry = async (req, res, next) => {
  try {
    const { employeeId, date, clockIn: ci, clockOut: co, status, note } = req.body;
    const dateOnly = toDateOnly(new Date(date));

    const clockInDate = ci ? new Date(`${date}T${ci}`) : null;
    const clockOutDate = co ? new Date(`${date}T${co}`) : null;
    const totalHours = calcHours(clockInDate, clockOutDate);
    const inTime = clockInDate ? formatTime(clockInDate) : null;
    const outTime = clockOutDate ? formatTime(clockOutDate) : null;

    const attendance = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: dateOnly } },
      create: { employeeId, date: dateOnly, clockIn: clockInDate, clockOut: clockOutDate, inTime, outTime, totalHours, status: status || 'PRESENT', note, isManual: true, approvedBy: req.user.id },
      update: { clockIn: clockInDate, clockOut: clockOutDate, inTime, outTime, totalHours, status: status || 'PRESENT', note, isManual: true, approvedBy: req.user.id },
    });

    return successResponse(res, attendance, 'Attendance entry saved successfully');
  } catch (err) { next(err); }
};

const getSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);

    const summary = await prisma.attendance.groupBy({
      by: ['status'],
      where: { date: { gte: start, lte: end } },
      _count: true,
    });

    const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });

    return successResponse(res, { summary, totalEmployees, month: m, year: y }, 'Attendance summary fetched');
  } catch (err) { next(err); }
};

module.exports = { clockIn, clockOut, getToday, getMyAttendance, getAll, manualEntry, getSummary };
