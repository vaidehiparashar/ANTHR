// src/routes/recruitment.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/recruitment.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Job Postings
router.get('/jobs', ctrl.getJobs);
router.post('/jobs', authorize('SUPER_ADMIN', 'HR_ADMIN', 'RECRUITER'), ctrl.createJob);
router.put('/jobs/:id', authorize('SUPER_ADMIN', 'HR_ADMIN', 'RECRUITER'), ctrl.updateJob);

// Applications
router.get('/applications', authorize('SUPER_ADMIN', 'HR_ADMIN', 'RECRUITER'), ctrl.getApplications);
router.post('/applications', ctrl.createApplication);
router.patch('/applications/:id/status', authorize('SUPER_ADMIN', 'HR_ADMIN', 'RECRUITER'), ctrl.updateApplicationStatus);

module.exports = router;
