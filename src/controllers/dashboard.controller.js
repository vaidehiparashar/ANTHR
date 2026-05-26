// src/controllers/dashboard.controller.js
const prisma = require('../utils/prisma');
const { successResponse } = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const [
      totalEmployees,
      activeEmployees,
      todayPresent,
      todayAbsent,
      pendingLeaves,
      openJobs,
      totalApplicationsThisMonth,
      activeInterns,
      payrollThisMonth,
      recentHires,
      upcomingLeaves,
      departmentHeadcount,
      attendanceTrend,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.attendance.count({ where: { date: todayOnly, status: { in: ['PRESENT', 'LATE'] } } }),
      prisma.attendance.count({ where: { date: todayOnly, status: 'ABSENT' } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.jobPosting.count({ where: { status: 'OPEN' } }),
      prisma.application.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.internship.count({ where: { status: 'ACTIVE' } }),
      prisma.payroll.aggregate({ where: { month, year, status: { in: ['PROCESSED', 'PAID'] } }, _sum: { netSalary: true }, _count: true }),
      prisma.employee.findMany({
        where: { hireDate: { gte: new Date(today.getFullYear(), today.getMonth() - 1, 1) } },
        take: 5,
        orderBy: { hireDate: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, avatar: true } }, department: true, position: true },
      }),
      prisma.leaveRequest.findMany({
        where: { status: 'APPROVED', startDate: { gte: todayOnly }, endDate: { gte: todayOnly } },
        take: 10,
        orderBy: { startDate: 'asc' },
        include: { employee: { include: { user: { select: { firstName: true, lastName: true } } } } },
      }),
      prisma.department.findMany({
        include: { _count: { select: { employees: { where: { status: 'ACTIVE' } } } } },
        orderBy: { name: 'asc' },
      }),
      // Last 7 days attendance trend
      prisma.$queryRaw`
        SELECT
          DATE(date) as day,
          COUNT(CASE WHEN status IN ('PRESENT', 'LATE') THEN 1 END) as present,
          COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) as absent,
          COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late
        FROM attendances
        WHERE date >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(date)
        ORDER BY day ASC
      `,
    ]);

    const attendanceRate = activeEmployees > 0
      ? Math.round((todayPresent / activeEmployees) * 100)
      : 0;

    return successResponse(res, {
      summary: {
        totalEmployees,
        activeEmployees,
        todayPresent,
        todayAbsent,
        attendanceRate,
        pendingLeaves,
        openJobs,
        totalApplicationsThisMonth,
        activeInterns,
      },
      payroll: {
        month,
        year,
        totalProcessed: payrollThisMonth._count,
        totalNetPay: payrollThisMonth._sum.netSalary ? Number(payrollThisMonth._sum.netSalary) : 0,
      },
      recentHires,
      upcomingLeaves,
      departmentHeadcount: departmentHeadcount.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        headcount: d._count.employees,
      })),
      attendanceTrend: attendanceTrend.map(d => ({
        day: d.day,
        present: Number(d.present),
        absent: Number(d.absent),
        late: Number(d.late),
      })),
    }, 'Dashboard data fetched');
  } catch (err) { next(err); }
};

const getEmployeeDashboard = async (req, res, next) => {
  try {
    const employeeId = req.employeeId;
    if (!employeeId) return res.status(404).json({ success: false, message: 'Employee profile not found' });

    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    const [
      todayAttendance,
      leaveBalances,
      pendingLeaves,
      recentPayroll,
      notifications,
      monthAttendanceSummary,
    ] = await Promise.all([
      prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date: todayOnly } } }),
      prisma.leaveBalance.findMany({ where: { employeeId, year } }),
      prisma.leaveRequest.count({ where: { employeeId, status: 'PENDING' } }),
      prisma.payroll.findFirst({ where: { employeeId }, orderBy: [{ year: 'desc' }, { month: 'desc' }] }),
      prisma.notification.findMany({ where: { recipientId: employeeId, isRead: false }, take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          employeeId,
          date: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
            lte: today,
          },
        },
        _count: true,
      }),
    ]);

    return successResponse(res, {
      todayAttendance,
      leaveBalances,
      pendingLeaves,
      recentPayroll,
      unreadNotifications: notifications.length,
      monthAttendanceSummary,
    }, 'Employee dashboard fetched');
  } catch (err) { next(err); }
};

module.exports = { getDashboard, getEmployeeDashboard };
