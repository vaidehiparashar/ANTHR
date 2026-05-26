// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const hash = (pw) => bcrypt.hash(pw, 12);

async function main() {
  console.log('🌱 Seeding HR Antbox database...\n');

  // ── Departments ──────────────────────────────────────────────────────────
  console.log('📦 Creating departments...');
  const departments = await Promise.all([
    prisma.department.upsert({ where: { code: 'ENG' }, update: {}, create: { name: 'Engineering', code: 'ENG', description: 'Software development and architecture', budget: 500000 } }),
    prisma.department.upsert({ where: { code: 'HR' }, update: {}, create: { name: 'Human Resources', code: 'HR', description: 'People operations and talent management', budget: 150000 } }),
    prisma.department.upsert({ where: { code: 'FIN' }, update: {}, create: { name: 'Finance', code: 'FIN', description: 'Financial planning and accounting', budget: 200000 } }),
    prisma.department.upsert({ where: { code: 'MKT' }, update: {}, create: { name: 'Marketing', code: 'MKT', description: 'Brand and growth marketing', budget: 250000 } }),
    prisma.department.upsert({ where: { code: 'OPS' }, update: {}, create: { name: 'Operations', code: 'OPS', description: 'Business operations and support', budget: 180000 } }),
    prisma.department.upsert({ where: { code: 'SALES' }, update: {}, create: { name: 'Sales', code: 'SALES', description: 'Revenue generation and client relations', budget: 300000 } }),
    prisma.department.upsert({ where: { code: 'PROD' }, update: {}, create: { name: 'Product', code: 'PROD', description: 'Product management and strategy', budget: 220000 } }),
  ]);
  const [engDept, hrDept, finDept, mktDept, opsDept, salesDept, prodDept] = departments;

  // ── Positions ────────────────────────────────────────────────────────────
  console.log('💼 Creating positions...');
  const positions = await Promise.all([
    prisma.position.upsert({ where: { code: 'CTO' }, update: {}, create: { title: 'Chief Technology Officer', code: 'CTO', minSalary: 15000, maxSalary: 25000 } }),
    prisma.position.upsert({ where: { code: 'SWE-SR' }, update: {}, create: { title: 'Senior Software Engineer', code: 'SWE-SR', minSalary: 8000, maxSalary: 14000 } }),
    prisma.position.upsert({ where: { code: 'SWE-JR' }, update: {}, create: { title: 'Junior Software Engineer', code: 'SWE-JR', minSalary: 4000, maxSalary: 7000 } }),
    prisma.position.upsert({ where: { code: 'HRM' }, update: {}, create: { title: 'HR Manager', code: 'HRM', minSalary: 5000, maxSalary: 9000 } }),
    prisma.position.upsert({ where: { code: 'HR-SPEC' }, update: {}, create: { title: 'HR Specialist', code: 'HR-SPEC', minSalary: 3500, maxSalary: 6000 } }),
    prisma.position.upsert({ where: { code: 'FIN-MGR' }, update: {}, create: { title: 'Finance Manager', code: 'FIN-MGR', minSalary: 6000, maxSalary: 10000 } }),
    prisma.position.upsert({ where: { code: 'ACCT' }, update: {}, create: { title: 'Accountant', code: 'ACCT', minSalary: 3500, maxSalary: 6000 } }),
    prisma.position.upsert({ where: { code: 'MKT-MGR' }, update: {}, create: { title: 'Marketing Manager', code: 'MKT-MGR', minSalary: 5500, maxSalary: 9000 } }),
    prisma.position.upsert({ where: { code: 'DSGN' }, update: {}, create: { title: 'UI/UX Designer', code: 'DSGN', minSalary: 4000, maxSalary: 7500 } }),
    prisma.position.upsert({ where: { code: 'PM' }, update: {}, create: { title: 'Product Manager', code: 'PM', minSalary: 7000, maxSalary: 12000 } }),
    prisma.position.upsert({ where: { code: 'SALES-REP' }, update: {}, create: { title: 'Sales Representative', code: 'SALES-REP', minSalary: 3000, maxSalary: 6000 } }),
    prisma.position.upsert({ where: { code: 'INTERN' }, update: {}, create: { title: 'Intern', code: 'INTERN', minSalary: 800, maxSalary: 1500 } }),
  ]);

  // ── Users & Employees ────────────────────────────────────────────────────
  console.log('👥 Creating users and employees...');

  const employeeData = [
    { email: 'admin@hrantbox.com', firstName: 'Alexandra', lastName: 'Chen', role: 'SUPER_ADMIN', deptIdx: 0, posIdx: 0, salary: 20000, employeeId: 'EMP0001', hireDate: '2020-01-15' },
    { email: 'hr.manager@hrantbox.com', firstName: 'Marcus', lastName: 'Johnson', role: 'HR_ADMIN', deptIdx: 1, posIdx: 3, salary: 7500, employeeId: 'EMP0002', hireDate: '2020-03-01' },
    { email: 'hr.specialist@hrantbox.com', firstName: 'Sofia', lastName: 'Martinez', role: 'HR_ADMIN', deptIdx: 1, posIdx: 4, salary: 5000, employeeId: 'EMP0003', hireDate: '2021-06-15', managerIdx: 1 },
    { email: 'cto@hrantbox.com', firstName: 'David', lastName: 'Park', role: 'MANAGER', deptIdx: 0, posIdx: 0, salary: 18000, employeeId: 'EMP0004', hireDate: '2020-02-01' },
    { email: 'employee@hrantbox.com', firstName: 'Emily', lastName: 'Rodriguez', role: 'EMPLOYEE', deptIdx: 0, posIdx: 1, salary: 11000, employeeId: 'EMP0005', hireDate: '2021-01-10', managerIdx: 3 },
    { email: 'senior.dev2@hrantbox.com', firstName: 'James', lastName: 'Wilson', role: 'EMPLOYEE', deptIdx: 0, posIdx: 1, salary: 10500, employeeId: 'EMP0006', hireDate: '2021-04-05', managerIdx: 3 },
    { email: 'junior.dev1@hrantbox.com', firstName: 'Priya', lastName: 'Sharma', role: 'EMPLOYEE', deptIdx: 0, posIdx: 2, salary: 5500, employeeId: 'EMP0007', hireDate: '2022-08-01', managerIdx: 4 },
    { email: 'junior.dev2@hrantbox.com', firstName: 'Lucas', lastName: 'Brown', role: 'EMPLOYEE', deptIdx: 0, posIdx: 2, salary: 5200, employeeId: 'EMP0008', hireDate: '2022-11-15', managerIdx: 4 },
    { email: 'fin.manager@hrantbox.com', firstName: 'Rachel', lastName: 'Thompson', role: 'MANAGER', deptIdx: 2, posIdx: 5, salary: 9000, employeeId: 'EMP0009', hireDate: '2020-05-01' },
    { email: 'accountant@hrantbox.com', firstName: 'Kevin', lastName: 'Lee', role: 'EMPLOYEE', deptIdx: 2, posIdx: 6, salary: 5000, employeeId: 'EMP0010', hireDate: '2021-09-01', managerIdx: 8 },
    { email: 'mkt.manager@hrantbox.com', firstName: 'Olivia', lastName: 'Davis', role: 'MANAGER', deptIdx: 3, posIdx: 7, salary: 8500, employeeId: 'EMP0011', hireDate: '2020-07-15' },
    { email: 'designer@hrantbox.com', firstName: 'Noah', lastName: 'Anderson', role: 'EMPLOYEE', deptIdx: 3, posIdx: 8, salary: 6500, employeeId: 'EMP0012', hireDate: '2022-02-01', managerIdx: 10 },
    { email: 'product.manager@hrantbox.com', firstName: 'Isabella', lastName: 'Taylor', role: 'MANAGER', deptIdx: 6, posIdx: 9, salary: 10000, employeeId: 'EMP0013', hireDate: '2021-03-01' },
    { email: 'sales.rep1@hrantbox.com', firstName: 'Ethan', lastName: 'White', role: 'EMPLOYEE', deptIdx: 5, posIdx: 10, salary: 4500, employeeId: 'EMP0014', hireDate: '2022-05-01' },
    { email: 'intern1@hrantbox.com', firstName: 'Aisha', lastName: 'Patel', role: 'INTERN', deptIdx: 0, posIdx: 11, salary: 1200, employeeId: 'EMP0015', hireDate: '2024-01-15', employmentType: 'INTERN' },
    { email: 'recruiter@hrantbox.com', firstName: 'Benjamin', lastName: 'Garcia', role: 'RECRUITER', deptIdx: 1, posIdx: 4, salary: 5500, employeeId: 'EMP0016', hireDate: '2022-01-10', managerIdx: 1 },
  ];

  // Procedurally generate 84 additional mock employees to reach ~100 total
  const firstNames = ['John','Emma','Michael','Sarah','William','Jessica','David','Ashley','James','Amanda','Robert','Melissa','Joseph','Nicole','Daniel','Stephanie','Matthew','Elizabeth','Andrew','Rebecca','Brian','Lauren','Joshua','Megan','Kevin','Rachel','Brian','Hannah','George','Tyler'];
  const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson'];
  
  for (let i = 17; i <= 100; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const deptIdx = Math.floor(Math.random() * 7); // 0 to 6
    const posIdx = Math.floor(Math.random() * 12); // 0 to 11
    // Filter reasonable positions for normal employees
    const allowedPos = [1, 2, 4, 6, 8, 10]; // SWE-SR, SWE-JR, HR-SPEC, ACCT, DSGN, SALES-REP
    const safePosIdx = allowedPos[Math.floor(Math.random() * allowedPos.length)];
    
    employeeData.push({
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@hrantbox.com`,
      firstName: fName,
      lastName: lName,
      role: 'EMPLOYEE',
      deptIdx: deptIdx,
      posIdx: safePosIdx,
      salary: Number(positions[safePosIdx].minSalary) + Math.floor(Math.random() * 2000),
      employeeId: `EMP${String(i).padStart(4, '0')}`,
      hireDate: new Date(Date.now() - Math.floor(Math.random() * 3 * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      managerIdx: 3 // Default reporting to CTO for simplicity in mock
    });
  }


  const createdEmployees = [];
  for (const data of employeeData) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      const emp = await prisma.employee.findUnique({ where: { userId: existing.id } });
      createdEmployees.push(emp);
      continue;
    }

    const pw = await hash('Password@123');
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: pw,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isVerified: true,
        isActive: true,
      },
    });

    const emp = await prisma.employee.create({
      data: {
        employeeId: data.employeeId,
        userId: user.id,
        departmentId: departments[data.deptIdx].id,
        positionId: positions[data.posIdx].id,
        managerId: data.managerIdx !== undefined ? createdEmployees[data.managerIdx]?.id || null : null,
        salary: data.salary,
        hireDate: new Date(data.hireDate),
        employmentType: data.employmentType || 'FULL_TIME',
        status: 'ACTIVE',
        workLocation: 'Main Office',
        bankName: 'First National Bank',
        bankAccountNo: `ACC${Math.floor(Math.random() * 9000000 + 1000000)}`,
        emergencyName: 'Emergency Contact',
        emergencyPhone: '+1-555-0100',
        emergencyRelation: 'Spouse',
      },
    });

    createdEmployees.push(emp);
  }

  console.log(`  ✅ Created ${createdEmployees.length} employees`);

  // Set department heads
  await prisma.department.update({ where: { id: engDept.id }, data: { headId: createdEmployees[3].id } });
  await prisma.department.update({ where: { id: hrDept.id }, data: { headId: createdEmployees[1].id } });
  await prisma.department.update({ where: { id: finDept.id }, data: { headId: createdEmployees[8].id } });
  await prisma.department.update({ where: { id: mktDept.id }, data: { headId: createdEmployees[10].id } });

  // ── Leave Policies ───────────────────────────────────────────────────────
  console.log('📅 Creating leave policies...');
  const leavePolicies = [
    { leaveType: 'ANNUAL', daysAllowed: 15, carryForward: true, maxCarryDays: 5, isPaid: true },
    { leaveType: 'SICK', daysAllowed: 10, carryForward: false, isPaid: true },
    { leaveType: 'EMERGENCY', daysAllowed: 3, carryForward: false, isPaid: true },
    { leaveType: 'MATERNITY', daysAllowed: 90, carryForward: false, isPaid: true },
    { leaveType: 'PATERNITY', daysAllowed: 10, carryForward: false, isPaid: true },
    { leaveType: 'UNPAID', daysAllowed: 30, carryForward: false, isPaid: false },
  ];

  for (const policy of leavePolicies) {
    await prisma.leavePolicy.upsert({ where: { leaveType: policy.leaveType }, update: {}, create: policy });
  }

  // ── Leave Balances ───────────────────────────────────────────────────────
  console.log('⚖️  Creating leave balances...');
  const year = new Date().getFullYear();
  for (const emp of createdEmployees) {
    if (!emp) continue;
    const balances = [
      { leaveType: 'ANNUAL', allocated: 15, used: Math.floor(Math.random() * 5), pending: 0 },
      { leaveType: 'SICK', allocated: 10, used: Math.floor(Math.random() * 3), pending: 0 },
      { leaveType: 'EMERGENCY', allocated: 3, used: 0, pending: 0 },
    ];
    for (const b of balances) {
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveType_year: { employeeId: emp.id, leaveType: b.leaveType, year } },
        update: {},
        create: { employeeId: emp.id, leaveType: b.leaveType, year, allocated: b.allocated, used: b.used, pending: b.pending, remaining: b.allocated - b.used - b.pending },
      });
    }
  }

  // ── Attendance Records (last 30 days) ────────────────────────────────────
  console.log('🕐 Creating attendance records...');
  const today = new Date();
  let attendanceCount = 0;

  for (const emp of createdEmployees) {
    if (!emp) continue;
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const existing = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId: emp.id, date: dateOnly } } });
      if (existing) continue;

      const rand = Math.random();
      let status, clockIn, clockOut, totalHours;

      if (rand < 0.80) { // 80% present
        const inHour = 8 + (Math.random() < 0.15 ? 1 : 0); // 15% late
        const inMin = Math.floor(Math.random() * 60);
        const outHour = 17 + Math.floor(Math.random() * 3);
        const outMin = Math.floor(Math.random() * 60);

        clockIn = new Date(date.getFullYear(), date.getMonth(), date.getDate(), inHour, inMin);
        clockOut = new Date(date.getFullYear(), date.getMonth(), date.getDate(), outHour, outMin);
        totalHours = (clockOut - clockIn) / (1000 * 60 * 60);
        status = inHour > 9 || (inHour === 9 && inMin > 30) ? 'LATE' : 'PRESENT';
      } else if (rand < 0.90) {
        status = 'ON_LEAVE';
      } else {
        status = 'ABSENT';
      }

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: dateOnly,
          clockIn: clockIn || null,
          clockOut: clockOut || null,
          inTime: clockIn ? clockIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
          outTime: clockOut ? clockOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
          totalHours: totalHours ? Math.round(totalHours * 100) / 100 : null,
          overtime: totalHours && totalHours > 8 ? Math.round((totalHours - 8) * 100) / 100 : 0,
          status,
        },
      });
      attendanceCount++;
    }
  }
  console.log(`  ✅ Created ${attendanceCount} attendance records`);

  // ── Leave Requests ───────────────────────────────────────────────────────
  console.log('🏖️  Creating leave requests...');
  const leaveRequests = [
    { empIdx: 4, type: 'ANNUAL', start: '2025-02-10', end: '2025-02-14', status: 'APPROVED', reason: 'Family vacation' },
    { empIdx: 5, type: 'SICK', start: '2025-03-03', end: '2025-03-04', status: 'APPROVED', reason: 'Medical appointment' },
    { empIdx: 6, type: 'ANNUAL', start: '2025-04-21', end: '2025-04-25', status: 'PENDING', reason: 'Personal travel' },
    { empIdx: 7, type: 'EMERGENCY', start: '2025-05-01', end: '2025-05-01', status: 'APPROVED', reason: 'Family emergency' },
    { empIdx: 9, type: 'SICK', start: '2025-01-15', end: '2025-01-17', status: 'APPROVED', reason: 'Flu' },
    { empIdx: 11, type: 'ANNUAL', start: '2025-06-02', end: '2025-06-06', status: 'PENDING', reason: 'Holiday' },
  ];

  for (const lr of leaveRequests) {
    const emp = createdEmployees[lr.empIdx];
    if (!emp) continue;
    const start = new Date(lr.start);
    const end = new Date(lr.end);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

    await prisma.leaveRequest.create({
      data: {
        employeeId: emp.id,
        leaveType: lr.type,
        startDate: start,
        endDate: end,
        totalDays: days,
        reason: lr.reason,
        status: lr.status,
        approvedById: lr.status === 'APPROVED' ? createdEmployees[1].id : null,
        approvedAt: lr.status === 'APPROVED' ? new Date() : null,
      },
    });
  }
  console.log(`  ✅ Created ${leaveRequests.length} leave requests`);

  // ── Payroll Records ──────────────────────────────────────────────────────
  console.log('💰 Creating payroll records...');
  const payMonths = [{ m: 1, y: 2025 }, { m: 2, y: 2025 }, { m: 3, y: 2025 }, { m: 4, y: 2025 }];
  let payrollCount = 0;

  for (const { m, y } of payMonths) {
    for (const emp of createdEmployees) {
      if (!emp) continue;
      const existingPayroll = await prisma.payroll.findUnique({ where: { employeeId_month_year: { employeeId: emp.id, month: m, year: y } } });
      if (existingPayroll) continue;

      // Get employee data
      const empData = employeeData[createdEmployees.indexOf(emp)];
      const basic = empData?.salary || 5000;
      const allowances = basic * 0.10;
      const bonus = m === 3 ? basic * 0.05 : 0; // Q1 bonus in March
      const gross = basic + allowances + bonus;
      const tax = gross > 8000 ? gross * 0.22 : gross > 4000 ? gross * 0.18 : gross * 0.12;
      const pf = basic * 0.05;
      const health = 150;
      const totalDed = tax + pf + health;
      const net = gross - totalDed;

      const payroll = await prisma.payroll.create({
        data: {
          payrollNumber: `PAY-${y}${String(m).padStart(2, '0')}-${emp.id.slice(-4).toUpperCase()}`,
          employeeId: emp.id,
          month: m,
          year: y,
          basicSalary: basic,
          allowances,
          overtime: 0,
          bonus,
          grossSalary: gross,
          taxDeduction: Math.round(tax * 100) / 100,
          providentFund: Math.round(pf * 100) / 100,
          healthInsurance: health,
          otherDeductions: 0,
          totalDeductions: Math.round(totalDed * 100) / 100,
          netSalary: Math.round(net * 100) / 100,
          status: 'PAID',
          paidAt: new Date(y, m, 1),
          paymentMethod: 'BANK_TRANSFER',
          transactionRef: `TXN${Date.now().toString(36).toUpperCase()}`,
        },
      });
      payrollCount++;
    }
  }
  console.log(`  ✅ Created ${payrollCount} payroll records`);

  // ── Job Postings ─────────────────────────────────────────────────────────
  console.log('📋 Creating job postings...');
  const jobPostings = [
    {
      title: 'Senior Full Stack Engineer',
      deptIdx: 0, posIdx: 1,
      description: 'We are looking for an experienced full-stack engineer to join our growing engineering team.',
      requirements: '5+ years of experience with React, Node.js, PostgreSQL. Strong understanding of system design.',
      responsibilities: 'Design and implement scalable backend services. Lead technical initiatives. Mentor junior engineers.',
      employmentType: 'FULL_TIME', location: 'San Francisco, CA', isRemote: true,
      salaryMin: 8000, salaryMax: 14000, openings: 2, status: 'OPEN',
    },
    {
      title: 'Product Designer (UI/UX)',
      deptIdx: 3, posIdx: 8,
      description: 'Join our design team to create beautiful and intuitive user experiences.',
      requirements: '3+ years UI/UX design experience. Proficiency in Figma. Strong portfolio.',
      responsibilities: 'Create wireframes and prototypes. Conduct user research. Collaborate with engineers.',
      employmentType: 'FULL_TIME', location: 'New York, NY', isRemote: false,
      salaryMin: 4000, salaryMax: 7500, openings: 1, status: 'OPEN',
    },
    {
      title: 'Sales Account Executive',
      deptIdx: 5, posIdx: 10,
      description: 'Drive revenue growth by managing and expanding our client portfolio.',
      requirements: '2+ years B2B sales experience. Strong communication skills. CRM proficiency.',
      responsibilities: 'Manage sales pipeline. Close enterprise deals. Maintain client relationships.',
      employmentType: 'FULL_TIME', location: 'Chicago, IL', isRemote: false,
      salaryMin: 3000, salaryMax: 6000, openings: 3, status: 'OPEN',
    },
    {
      title: 'Junior Software Engineer',
      deptIdx: 0, posIdx: 2,
      description: 'Great opportunity for early-career engineers to grow in a fast-paced startup environment.',
      requirements: '1+ year experience. Knowledge of JavaScript/TypeScript. Eagerness to learn.',
      responsibilities: 'Develop features under senior guidance. Write unit tests. Participate in code reviews.',
      employmentType: 'FULL_TIME', location: 'Remote', isRemote: true,
      salaryMin: 4000, salaryMax: 7000, openings: 2, status: 'FILLED',
    },
  ];

  const createdJobs = [];
  for (const j of jobPostings) {
    const job = await prisma.jobPosting.create({
      data: {
        jobCode: `JOB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        title: j.title,
        departmentId: departments[j.deptIdx].id,
        positionId: positions[j.posIdx].id,
        description: j.description,
        requirements: j.requirements,
        responsibilities: j.responsibilities,
        employmentType: j.employmentType,
        location: j.location,
        isRemote: j.isRemote,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        openings: j.openings,
        status: j.status,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postedById: createdEmployees[15]?.id,
      },
    });
    createdJobs.push(job);
  }

  // ── Applications ─────────────────────────────────────────────────────────
  console.log('📨 Creating applications...');
  const applicants = [
    { firstName: 'Alex', lastName: 'Kim', email: 'alex.kim@email.com', status: 'INTERVIEW_SCHEDULED', jobIdx: 0, years: 6, salary: 12000 },
    { firstName: 'Jordan', lastName: 'Smith', email: 'jordan.smith@email.com', status: 'SCREENING', jobIdx: 0, years: 4, salary: 9000 },
    { firstName: 'Taylor', lastName: 'Brown', email: 'taylor.brown@email.com', status: 'APPLIED', jobIdx: 0, years: 5, salary: 11000 },
    { firstName: 'Morgan', lastName: 'Davis', email: 'morgan.davis@email.com', status: 'OFFER_EXTENDED', jobIdx: 1, years: 3, salary: 6500 },
    { firstName: 'Casey', lastName: 'Wilson', email: 'casey.wilson@email.com', status: 'INTERVIEWED', jobIdx: 1, years: 4, salary: 7000 },
    { firstName: 'Riley', lastName: 'Johnson', email: 'riley.johnson@email.com', status: 'APPLIED', jobIdx: 2, years: 2, salary: 5000 },
    { firstName: 'Avery', lastName: 'Martinez', email: 'avery.martinez@email.com', status: 'REJECTED', jobIdx: 0, years: 1, salary: 7000 },
    { firstName: 'Quinn', lastName: 'Anderson', email: 'quinn.anderson@email.com', status: 'OFFER_ACCEPTED', jobIdx: 3, years: 1, salary: 5500 },
  ];

  for (const app of applicants) {
    await prisma.application.create({
      data: {
        applicationNo: `APP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
        jobPostingId: createdJobs[app.jobIdx].id,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        phone: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`,
        coverLetter: `I am excited to apply for this position at Antbox Technologies. With ${app.years} years of experience, I believe I can contribute significantly to your team.`,
        currentEmployer: 'Previous Company Inc.',
        currentSalary: app.salary * 0.85,
        expectedSalary: app.salary,
        noticePeriod: 30,
        yearsExperience: app.years,
        status: app.status,
        source: ['LinkedIn', 'Indeed', 'Referral', 'Company Website'][Math.floor(Math.random() * 4)],
        assignedToId: createdEmployees[15]?.id,
      },
    });
  }
  console.log(`  ✅ Created ${applicants.length} applications`);

  // ── Internship ───────────────────────────────────────────────────────────
  console.log('🎓 Creating internship records...');
  const internEmployee = createdEmployees[14]; // Aisha Patel
  if (internEmployee) {
    const existingIntern = await prisma.internship.findUnique({ where: { employeeId: internEmployee.id } });
    if (!existingIntern) {
      await prisma.internship.create({
        data: {
          employeeId: internEmployee.id,
          programName: 'Software Engineering Internship Program',
          institution: 'MIT - Massachusetts Institute of Technology',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-07-15'),
          supervisorId: createdEmployees[4]?.id,
          stipend: 1200,
          status: 'ACTIVE',
          objectives: 'Gain hands-on experience in full-stack development, participate in real-world projects, and develop professional software engineering skills.',
        },
      });
    }
  }

  // ── Holidays ─────────────────────────────────────────────────────────────
  console.log('🎉 Creating holidays...');
  const holidays = [
    { name: "New Year's Day", date: `${year}-01-01` },
    { name: "Martin Luther King Jr. Day", date: `${year}-01-20` },
    { name: "Presidents Day", date: `${year}-02-17` },
    { name: "Memorial Day", date: `${year}-05-26` },
    { name: "Independence Day", date: `${year}-07-04` },
    { name: "Labor Day", date: `${year}-09-01` },
    { name: "Thanksgiving Day", date: `${year}-11-27` },
    { name: "Christmas Day", date: `${year}-12-25` },
  ];

  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: { id: h.name.replace(/\s+/g, '_').toLowerCase() },
      update: {},
      create: { id: h.name.replace(/\s+/g, '_').toLowerCase(), name: h.name, date: new Date(h.date) },
    }).catch(() => prisma.holiday.create({ data: { name: h.name, date: new Date(h.date) } }));
  }

  // ── Announcements ────────────────────────────────────────────────────────
  console.log('📢 Creating announcements...');
  await prisma.announcement.createMany({
    data: [
      { title: 'Welcome to HR Antbox!', content: 'We are thrilled to launch our new HR management system. All employees can now manage attendance, leaves, and payroll through this platform.', isPinned: true, isPublished: true, authorId: createdEmployees[1]?.id },
      { title: 'Q1 2025 All-Hands Meeting', content: 'Join us for our quarterly all-hands meeting on March 28th at 2:00 PM. All departments will present their quarterly results and upcoming initiatives.', isPinned: false, isPublished: true, authorId: createdEmployees[0]?.id },
      { title: 'Updated Leave Policy for 2025', content: 'Please review the updated leave policy for 2025. Annual leave has been increased from 12 to 15 days. The new policy is effective from January 1st, 2025.', isPinned: false, isPublished: true, authorId: createdEmployees[1]?.id },
      { title: 'Office Closed - Public Holiday', content: 'Please note that the office will be closed on May 26th for Memorial Day. Normal operations resume on May 27th.', isPinned: false, isPublished: true, authorId: createdEmployees[1]?.id },
    ],
    skipDuplicates: true,
  });

  // ── Notifications ────────────────────────────────────────────────────────
  console.log('🔔 Creating notifications...');
  for (const emp of createdEmployees) {
    if (!emp) continue;
    await prisma.notification.createMany({
      data: [
        { type: 'ANNOUNCEMENT', priority: 'MEDIUM', title: 'Welcome to HR Antbox!', message: 'Your HR management platform is ready. Explore attendance tracking, leave management, and payroll features.', recipientId: emp.id, isRead: false },
        { type: 'PAYROLL_PROCESSED', priority: 'HIGH', title: 'Payroll Processed for April 2025', message: 'Your payroll for April 2025 has been processed and payment will be made by May 1st.', recipientId: emp.id, isRead: true, readAt: new Date() },
      ],
      skipDuplicates: true,
    });
  }

  // ── Salary Revisions ─────────────────────────────────────────────────────
  console.log('💱 Creating salary revision history...');
  for (const emp of createdEmployees.slice(4, 8)) {
    if (!emp) continue;
    const empData = employeeData[createdEmployees.indexOf(emp)];
    if (!empData) continue;
    await prisma.salaryRevision.create({
      data: {
        employeeId: emp.id,
        oldSalary: empData.salary * 0.88,
        newSalary: empData.salary,
        effectiveDate: new Date('2025-01-01'),
        reason: 'Annual performance review - merit increase',
        approvedById: createdEmployees[1]?.id,
      },
    });
  }

  console.log('\n✅ Seeding completed successfully!\n');
  console.log('━'.repeat(50));
  console.log('🔐 Demo Credentials:');
  console.log('━'.repeat(50));
  console.log('Super Admin:  admin@hrantbox.com / Password@123');
  console.log('HR Admin:     hr.manager@hrantbox.com / Password@123');
  console.log('HR Specialist:hr.specialist@hrantbox.com / Password@123');
  console.log('Manager (CTO):cto@hrantbox.com / Password@123');
  console.log('Employee:     employee@hrantbox.com / Password@123');
  console.log('Intern:       intern1@hrantbox.com / Password@123');
  console.log('Recruiter:    recruiter@hrantbox.com / Password@123');
  console.log('━'.repeat(50));
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
