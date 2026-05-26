// src/controllers/document.controller.js
const prisma = require('../utils/prisma');
const { successResponse, errorResponse } = require('../utils/response');
const path = require('path');

const getDocuments = async (req, res, next) => {
  try {
    const docs = await prisma.document.findMany({
      where: { employeeId: req.params.employeeId },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, docs, 'Documents fetched');
  } catch (err) { next(err); }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded.', 400);
    const { title, type } = req.body;
    const doc = await prisma.document.create({
      data: {
        employeeId: req.params.employeeId,
        title,
        type,
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
    return successResponse(res, doc, 'Document uploaded', 201);
  } catch (err) { next(err); }
};

const deleteDocument = async (req, res, next) => {
  try {
    await prisma.document.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Document deleted');
  } catch (err) { next(err); }
};

module.exports = { getDocuments, uploadDocument, deleteDocument };
