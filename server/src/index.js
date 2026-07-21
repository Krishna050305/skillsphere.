import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import matchingRouter from './routes/matching.routes.js';
import gigRouter from './routes/gig.routes.js';
import proposalRouter from './routes/proposal.routes.js';
import cookieParser from 'cookie-parser';
import { initTrendingSkillsJob } from './jobs/trendingSkills.job.js';
import { initDeadlineRemindersJob } from './jobs/deadlineReminders.job.js';
import { initSockets } from './sockets/index.js';
import messageRouter from './routes/message.routes.js';
import reviewRouter from './routes/review.routes.js';
import notificationRouter from './routes/notification.routes.js';
import paymentRouter from './routes/payment.routes.js';
import disputeRouter from './routes/dispute.routes.js';
import adminRouter from './routes/admin.routes.js';
import freelancerRouter from './routes/freelancer.routes.js';
import { authLimiter } from './middleware/rateLimiter.js';


// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io initialization
initSockets(httpServer);


// Middleware
app.use(helmet());

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', userRouter);
app.use('/api/gigs', gigRouter);
app.use('/api/proposals', proposalRouter);
app.use('/api/messages', messageRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/disputes', disputeRouter);
app.use('/api/admin', adminRouter);
app.use('/api/freelancer', freelancerRouter);
app.use('/api', matchingRouter);

// Base route fallback
app.use('*', (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} Not Found`);
  res.status(404);
  next(err);
});

// Global Error Handler
app.use(errorHandler);


// Start Server & DB Connection
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  // Start daily trending skills cron job scheduler
  initTrendingSkillsJob();
  // Start daily milestone deadline reminders job
  initDeadlineRemindersJob();

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
});
