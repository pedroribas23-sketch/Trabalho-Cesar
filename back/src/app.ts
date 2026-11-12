import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response
} from "express";
import cors, { type CorsOptions } from "cors";
import { ZodError } from "zod";
import type { Pool } from "pg";
import type { AppConfig } from "./config";
import {
  ApiError,
  authenticate,
  bearerToken,
  createAccount,
  createCoreContext,
  getSaveRoute,
  health,
  leaderboard,
  login,
  logout,
  me,
  putSave,
  serviceInfo,
  submitRun,
  type CoreContext
} from "./core";

interface CreateAppOptions {
  pool: Pool;
  config: AppConfig;
}

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function clientIp(req: Request): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function createApp(options: CreateAppOptions) {
  const { pool, config } = options;
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: "256kb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  const ctx: CoreContext = createCoreContext(pool, config);

  function send(res: Response, out: { status: number; body?: unknown }): void {
    if (out.status === 204 || out.body === undefined) {
      res.status(out.status).end();
      return;
    }
    res.status(out.status).json(out.body);
  }

  app.get("/", asyncHandler(async (_req, res) => {
    send(res, await serviceInfo());
  }));
  app.get("/health", asyncHandler(async (_req, res) => {
    send(res, await health(ctx));
  }));
  app.get("/api/health", asyncHandler(async (_req, res) => {
    send(res, await health(ctx));
  }));

  app.post("/api/accounts", asyncHandler(async (req, res) => {
    send(res, await createAccount(ctx, req.body, clientIp(req)));
  }));

  app.post("/api/accounts/login", asyncHandler(async (req, res) => {
    send(res, await login(ctx, req.body, clientIp(req)));
  }));

  app.post("/api/accounts/logout", asyncHandler(async (req, res) => {
    send(res, await logout(ctx, bearerToken(req.header("authorization"))));
  }));

  app.get("/api/me", asyncHandler(async (req, res) => {
    send(res, await me(ctx, bearerToken(req.header("authorization"))));
  }));

  app.get("/api/me/save", asyncHandler(async (req, res) => {
    send(res, await getSaveRoute(ctx, bearerToken(req.header("authorization"))));
  }));

  app.put("/api/me/save", asyncHandler(async (req, res) => {
    send(res, await putSave(ctx, bearerToken(req.header("authorization")), req.body, clientIp(req)));
  }));

  app.get("/api/leaderboard", asyncHandler(async (req, res) => {
    send(res, await leaderboard(ctx, req.query.limit));
  }));

  app.post("/api/runs", asyncHandler(async (req, res) => {
    send(res, await submitRun(ctx, bearerToken(req.header("authorization")), req.body, clientIp(req)));
  }));

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "not_found", message: "Rota não encontrada." } });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (res.headersSent) return;
    if (error instanceof ApiError) {
      if (error.retryAfterSeconds) {
        res.setHeader("Retry-After", String(error.retryAfterSeconds));
      }
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    if (error instanceof ZodError) {
      res.status(400).json({
        error: { code: "invalid_payload", message: error.issues[0]?.message || "Dados inválidos." }
      });
      return;
    }
    if (error && typeof error === "object" && (error as { type?: string }).type === "entity.parse.failed") {
      res.status(400).json({
        error: { code: "invalid_json", message: "JSON inválido no corpo da requisição." }
      });
      return;
    }
    if (error && typeof error === "object" && (error as { code?: string }).code === "23505") {
      res.status(409).json({
        error: {
          code: "account_exists",
          message: "Já existe uma conta com esse nome. Use a aba ENTRAR."
        }
      });
      return;
    }
    console.error("[api] erro não tratado:", error);
    res.status(500).json({ error: { code: "internal_error", message: "Erro interno do servidor." } });
  };
  app.use(errorHandler);

  // exposto para os testes e para o transporte Fetch reaproveitar o contexto
  app.locals.core = ctx;
  app.locals.authenticate = (token: string | null) => authenticate(ctx, token);

  return app;
}
