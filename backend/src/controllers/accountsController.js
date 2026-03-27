const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const path = require('path');
const User = require('../models/userModel');
const { sanitizeUserForResponse } = require('../utils/userHelpers');
const {
  buildDefaultBreakdown,
  deriveBreakdown,
  deriveGithubInsights,
  deriveScores,
} = require('../utils/scoring');

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

const buildTokens = (userId) => ({
  access: jwt.sign({ id: userId }, process.env.JWT_SECRET || 'changeme', { expiresIn: ACCESS_TOKEN_EXPIRY }),
  refresh: jwt.sign({ id: userId }, process.env.JWT_SECRET || 'changeme', { expiresIn: REFRESH_TOKEN_EXPIRY }),
});

const respondWithTokens = (res, user) => {
  const tokens = buildTokens(user.id);
  res.status(200).json({ access: tokens.access, refresh: tokens.refresh, user: sanitizeUserForResponse(user) });
};

const signup = asyncHandler(async (req, res) => {
  const { email, password, full_name, username, role = 'student', organization_name } = req.body;

  if (!email || !password || !username) {
    res.status(400);
    throw new Error('Email, username, and password are required');
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingEmail) {
    res.status(409);
    throw new Error('A user with that email already exists');
  }
  const existingUsername = await User.findOne({ username: username.trim() });
  if (existingUsername) {
    res.status(409);
    throw new Error('A user with that username already exists');
  }

  const hashed = await bcrypt.hash(password, 10);
  const resumePath = req.file ? req.file.path : undefined;
  const normalizedRole = ['student', 'recruiter', 'university'].includes(role) ? role : 'student';
  const approvalStatus = normalizedRole === 'student' ? 'approved' : 'pending';
  const skillsList = req.body.student_skills
    ? req.body.student_skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];

  const user = await User.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    full_name,
    organization_name,
    role: normalizedRole,
    approval_status: approvalStatus,
    approved_at: approvalStatus === 'approved' ? new Date() : undefined,
    resume_path: resumePath,
    student_skills: skillsList,
    scores: deriveScores({
      profile_verified: false,
      student_skills: skillsList,
      linkedin_skill_count: Number(req.body.linkedin_skill_count) || 0,
      github_link: req.body.github_link,
      leetcode_link: req.body.leetcode_link,
    }),
    breakdown: buildDefaultBreakdown(),
  });

  respondWithTokens(res, user);
});

const login = asyncHandler(async (req, res) => {
  const identifier = (req.body.email || req.body.username || req.body.identifier || '').trim();
  const { password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email or username and password are required' });
  }

  const normalizedIdentifier = identifier.toLowerCase();
  const user = await User.findOne({
    $or: [
      { email: normalizedIdentifier },
      { username: identifier },
      { username: normalizedIdentifier },
    ],
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (user.approval_status === 'pending') {
    return res.status(403).json({
      error: 'Your account is pending admin approval. Try again after approval.',
      approval_status: 'pending',
    });
  }

  if (user.approval_status === 'rejected') {
    return res.status(403).json({
      error: 'Your account request was rejected. Contact support or resubmit.',
      approval_status: 'rejected',
    });
  }

  respondWithTokens(res, user);
});

const getProfile = (req, res) => {
  const user = sanitizeUserForResponse(req.user);
  if (req.user.resume_path) {
    user.resume_document = {
      filename: path.basename(req.user.resume_path),
      download_path: '/api/skills/resume/',
    };
  }
  res.json({ user });
};

const updateProfile = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  const whitelist = [
    'full_name',
    'gender',
    'phone_number',
    'college',
    'course',
    'branch',
    'year_of_study',
    'cgpa',
    'student_skills',
    'github_link',
    'leetcode_link',
    'linkedin_link',
    'linkedin_headline',
    'linkedin_experience_count',
    'linkedin_skill_count',
    'linkedin_cert_count',
    'linkedin_about',
    'codechef_link',
    'hackerrank_link',
    'codeforces_link',
    'gfg_link',
  ];

  const numericKeys = ['cgpa', 'linkedin_experience_count', 'linkedin_skill_count', 'linkedin_cert_count'];
  whitelist.forEach((key) => {
    if (updates[key] !== undefined) {
      req.user[key] = numericKeys.includes(key)
        ? Number(updates[key]) || 0
        : updates[key];
    }
  });

  if (typeof updates.student_skills === 'string') {
    req.user.student_skills = updates.student_skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  } else if (Array.isArray(updates.student_skills)) {
    req.user.student_skills = updates.student_skills;
  }

  req.user.scores = deriveScores(req.user);
  req.user.breakdown = deriveBreakdown(req.user.scores);
  await req.user.save();

  respondWithTokens(res, req.user);
});

const dashboard = (req, res) => {
  const user = sanitizeUserForResponse(req.user);
  res.json({
    user,
    scores: req.user.scores || deriveScores(req.user),
    breakdown: req.user.breakdown || buildDefaultBreakdown(),
    github_insights: deriveGithubInsights(req.user),
  });
};

const recalculate = asyncHandler(async (req, res) => {
  const updatedScores = deriveScores(req.user);
  req.user.scores = updatedScores;
  req.user.breakdown = deriveBreakdown(updatedScores);
  req.user.last_analyzed_at = new Date();
  await req.user.save();

  res.json({
    user: sanitizeUserForResponse(req.user),
    scores: updatedScores,
    breakdown: req.user.breakdown,
    github_insights: deriveGithubInsights(req.user),
  });
});

const scoreReport = asyncHandler(async (req, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="skillverify-score-report.pdf"');

  doc.fontSize(20).fillColor('#0f172a').text('SkillSense AI Score Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${req.user.full_name || req.user.username}`);
  doc.text(`Role: ${req.user.role}`);
  doc.text(`Email: ${req.user.email}`);
  doc.moveDown();

  const scores = req.user.scores || deriveScores(req.user);
  Object.entries(scores).forEach(([key, value]) => {
    doc.fontSize(12).text(`${key.replace(/_/g, ' ')}: ${Math.round(value)}`);
  });
  doc.moveDown();

  doc.fontSize(12).text('GitHub Insights:', { underline: true });
  const insights = deriveGithubInsights(req.user);
  doc.text(`Top Languages: ${insights.top_languages.map(([lang]) => lang).join(', ') || 'N/A'}`);
  doc.text(`Original repos: ${insights.original}`);
  doc.text(`Forked repos: ${insights.forked}`);
  doc.text(`Fork ratio: ${Math.round(insights.fork_ratio * 100)}%`);

  doc.pipe(res);
  doc.end();
});

const logout = (req, res) => {
  res.json({ message: 'Logged out' });
};

module.exports = {
  signup,
  login,
  dashboard,
  recalculate,
  scoreReport,
  getProfile,
  updateProfile,
  logout,
};
