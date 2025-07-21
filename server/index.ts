import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import compression from "compression";

// Database URL should be provided via environment variables
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const app = express();

// Add compression middleware for better performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req: any, res: any) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// CORS configuration for Chrome extension and external sites
app.use(cors({
  origin: [
    'chrome-extension://*',
    'moz-extension://*',
    /^https?:\/\/localhost:\d+$/,
    /^https?:\/\/.*\.replit\.app$/,
    /^https?:\/\/.*\.replit\.dev$/,
    /^https?:\/\/.*\.vercel\.app$/,
    /^https?:\/\/.*\.railway\.app$/,
    /^https?:\/\/.*\.netlify\.app$/,
    // Job sites where the extension operates
    'https://www.linkedin.com',
    'https://linkedin.com',
    'https://www.indeed.com',
    'https://indeed.com',
    'https://www.glassdoor.com',
    'https://glassdoor.com',
    'https://www.monster.com',
    'https://monster.com',
    'https://www.ziprecruiter.com',
    'https://ziprecruiter.com',
    'https://stackoverflow.com',
    'https://www.stackoverflow.com',
    'https://angel.co',
    'https://www.angel.co',
    'https://wellfound.com',
    'https://www.wellfound.com',
    ...(process.env.PRODUCTION_DOMAIN ? [process.env.PRODUCTION_DOMAIN] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Performance monitoring middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      // Log slow requests for optimization
      if (duration > 500) {
        console.warn(`🐌 SLOW REQUEST: ${logLine}`);
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
