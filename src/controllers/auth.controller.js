// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const isGmail = email.toLowerCase().trim().endsWith('@gmail.com');

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        employee: {
          include: { department: true, position: true },
        },
      },
    });

    // Auto-create Gmail users
    if (!user && isGmail) {
      const dept = await prisma.department.findFirst();
      const pos = await prisma.position.findFirst();
      
      if (!dept || !pos) {
        return errorResponse(res, 'Database not seeded yet. Cannot auto-create user.', 500);
      }

      const hashedPassword = await bcrypt.hash(password || 'password123', 12);
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          firstName: email.split('@')[0],
          lastName: 'Guest',
          role: 'EMPLOYEE',
          isActive: true,
          isVerified: true,
          employee: {
            create: {
              employeeId: `EMP-${Math.floor(Math.random() * 10000)}`,
              departmentId: dept.id,
              positionId: pos.id,
              status: 'ACTIVE',
              hireDate: new Date(),
              salary: 50000,
              currency: 'USD'
            }
          }
        },
        include: {
          employee: {
            include: { department: true, position: true },
          },
        },
      });
    }

    if (!user) return errorResponse(res, 'Invalid email or password.', 401);
    if (!user.isActive) return errorResponse(res, 'Account is deactivated. Contact HR.', 403);

    // Skip password check for Gmail users to make it completely open
    if (!isGmail) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return errorResponse(res, 'Invalid email or password.', 401);
    }

    const { accessToken, refreshToken } = generateTokenPair(user);

    // Store refresh token hash
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh, lastLoginAt: new Date() },
    });

    const { password: _, refreshToken: __, ...userSafe } = user;

    return successResponse(res, {
      user: userSafe,
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required.', 400);

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return errorResponse(res, 'Invalid or expired refresh token.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { employee: true },
    });

    if (!user || !user.refreshToken) return errorResponse(res, 'Refresh token not found.', 401);

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) return errorResponse(res, 'Invalid refresh token.', 401);

    const tokens = generateTokenPair(user);
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: hashedRefresh } });

    return successResponse(res, tokens, 'Token refreshed successfully');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
            manager: { include: { user: { select: { firstName: true, lastName: true, email: true, avatar: true } } } },
          },
        },
      },
    });
    const { password, refreshToken, ...safe } = user;
    return successResponse(res, safe, 'Profile fetched successfully');
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return errorResponse(res, 'Current password is incorrect.', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    return successResponse(res, null, 'Password changed successfully');
  } catch (err) { next(err); }
};

module.exports = { login, refreshToken, logout, getMe, changePassword };
