const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const accountsRoutes = require('./routes/accountsRoutes');
const skillsRoutes = require('./routes/skillsRoutes');
const contentRoutes = require('./routes/contentRoutes');
const aiInterviewRoutes = require('./routes/aiInterviewRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const universityRoutes = require('./routes/universityRoutes');
const codeAnalysisRoutes = require('./routes/codeAnalysisRoutes');
const progressRoutes = require('./routes/progressRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const { ensureSampleUsers } = require('./utils/seedSampleUsers');

[
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
].forEach((envPath) => {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
});

const app = express();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const parseOrigin = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};
const buildAllowedOrigins = (value) => {
  const parsed = parseOrigin(value);
  if (!parsed) {
    return [];
  }

  const allowed = new Set([parsed.origin]);
  if (['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    const localPorts = new Set([parsed.port, '4173', '5173', '8080'].filter(Boolean));
    for (const host of ['localhost', '127.0.0.1']) {
      for (const port of localPorts) {
        allowed.add(`${parsed.protocol}//${host}:${port}`);
      }
    }
  }

  return [...allowed];
};
const allowedOrigins = new Set(buildAllowedOrigins(frontendUrl));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
  const requestOrigin = `${req.protocol}://${req.get('host')}`;

  try {
    const frontend = new URL(frontendUrl);
    if (frontend.origin !== requestOrigin) {
      return res.redirect(frontendUrl);
    }
  } catch (error) {
    // Ignore malformed FRONTEND_URL values and fall back to a helpful payload.
  }

  return res.json({
    name: 'SkillSense AI API',
    status: 'ok',
    health: '/health',
    frontend: frontendUrl,
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/accounts', accountsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/skills', codeAnalysisRoutes);
app.use('/api/skills', progressRoutes);
app.use('/api/skills', aiInterviewRoutes);
app.use('/api/skills', recruiterRoutes);
app.use('/api/skills', universityRoutes);
app.use('/api/content', contentRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await ensureSampleUsers();
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  });
