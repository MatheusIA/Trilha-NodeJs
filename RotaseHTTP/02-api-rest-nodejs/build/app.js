"use strict";
const __create = Object.create;
const __defProp = Object.defineProperty;
const __getOwnPropDesc = Object.getOwnPropertyDescriptor;
const __getOwnPropNames = Object.getOwnPropertyNames;
const __getProtoOf = Object.getPrototypeOf;
const __hasOwnProp = Object.prototype.hasOwnProperty;
const __export = (target, all) => {
  for (const name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
const __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (const key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
const __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule
      ? __defProp(target, "default", { value: mod, enumerable: true })
      : target,
    mod,
  )
);
const __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/app.ts
const app_exports = {};
__export(app_exports, {
  app: () => app,
});
module.exports = __toCommonJS(app_exports);
const import_fastify = __toESM(require("fastify"));
const import_cookie = __toESM(require("@fastify/cookie"));

// src/routes/transactions.ts
const import_zod2 = require("zod");
const import_node_crypto = require("crypto");

// src/database.ts
const import_knex = require("knex");

// src/env/index.ts
const import_dotenv = require("dotenv");
const import_zod = require("zod");
if (process.env.NODE_ENV === "test") {
  (0, import_dotenv.config)({ path: ".env.test" });
} else {
  (0, import_dotenv.config)();
}
const envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z
    .enum(["development", "test", "production"])
    .default("production"),
  DATABASE_CLIENT: import_zod.z.enum(["sqlite", "pg"]).default("sqlite"),
  DATABASE_URL: import_zod.z.string(),
  PORT: import_zod.z.coerce.number().default(3333),
});
const _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error("Invalid environment variables !", _env.error.format());
  throw new Error("Invalid environment variables.");
}
const env = _env.data;

// src/database.ts
if (!process.env.DATABASE_URL) {
  throw new Error("Databa URL env not found");
}
const config2 = {
  client: env.DATABASE_CLIENT,
  connection:
    env.DATABASE_CLIENT === "sqlite"
      ? {
          filename: env.DATABASE_URL,
        }
      : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./db/migrations",
  },
};
const knex = (0, import_knex.knex)(config2);

// src/middlewares/check-session-id-exists.ts
async function checkSessionIdExists(request, reply) {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    return reply.status(401).send({
      error: "Unauthorized",
    });
  }
}

// src/routes/transactions.ts
async function transactionsRoutes(app2) {
  app2.addHook("preHandler", async (request) => {
    console.log(`[${request.method}] ${request.url}`);
  });
  app2.get(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;
      const transactions = await knex("transactions")
        .where("session_id", sessionId)
        .select();
      return { transactions };
    },
  );
  app2.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getTransactionParamsSchema = import_zod2.z.object({
        id: import_zod2.z.string().uuid(),
      });
      const { id } = getTransactionParamsSchema.parse(request.params);
      const { sessionId } = request.cookies;
      const transaction = await knex("transactions")
        .where({
          session_id: sessionId,
          id,
        })
        .first();
      return { transaction };
    },
  );
  app2.get(
    "/summary",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;
      const summary = await knex("transactions")
        .where("session_id", sessionId)
        .sum("amout", { as: "Amount" })
        .first();
      return { summary };
    },
  );
  app2.post("/", async (request, reply) => {
    const createTransacationBodySchema = import_zod2.z.object({
      title: import_zod2.z.string(),
      amout: import_zod2.z.number(),
      type: import_zod2.z.enum(["credit", "debit"]),
    });
    const { title, amout, type } = createTransacationBodySchema.parse(
      request.body,
    );
    let sessionId = request.cookies.sessionId;
    if (!sessionId) {
      sessionId = (0, import_node_crypto.randomUUID)();
      reply.cookie("sessionId", sessionId, {
        // colocando só o '/', significa que todas as minhas rotas, podem acessar
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        // Sequencia: segundos, minutos, dia, 7 dias
      });
    }
    await knex("transactions").insert({
      id: (0, import_node_crypto.randomUUID)(),
      title,
      amout: type === "credit" ? amout : amout * -1,
      session_id: sessionId,
    });
    return reply.status(201).send();
  });
}

// src/app.ts
var app = (0, import_fastify.default)();
app.register(import_cookie.default);
app.register(transactionsRoutes, {
  prefix: "transactions",
});
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    app,
  });
