Vercel has never really sold Next.js as a backend framework. The story is full-stack React: Server Components for rendering, Server Actions for mutations, and Route Handlers as the thin escape hatch for everything the framework doesn't cover.

That story works beautifully — as long as your API exists to serve your own UI. It gets uncomfortable the moment you need a real REST API: a contract, versioning, generated reference docs, third-party consumers, and work that has to survive longer than the request that triggered it.

And yet, a lot of engineers build serious, REST-first backends inside Next.js on purpose. They disagree on plenty, but not on the premise: a route handler is a fine delivery mechanism, and everything behind it deserves the same rigor it would get in NestJS, Fastify, or Django. The subculture around that craft is opinionated, active, and clustered around a specific set of tools and communities. Here's the map.

## Hono on Next.js: the escape hatch

The most popular pattern is mounting Hono inside a catch-all route handler.

**The problem it solves.** As an API grows, `app/api/**/route.ts` file-based routing gets messy. There is no composable middleware chain, no dependency-injection story, and no clean way to generate an OpenAPI document from your handlers. You end up with a dozen files repeating the same auth guard, the same error mapping, and the same validation preamble.

**The pattern.** Catch every request in one route and hand it to Hono:

```ts
// app/api/[[...route]]/route.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

export const runtime = "nodejs";

const app = new OpenAPIHono().basePath("/api");

const getPost = createRoute({
  method: "get",
  path: "/posts/{id}",
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "A post" } },
});

app.openapi(getPost, (c) => {
  const { id } = c.req.valid("param");
  return c.json({ id, title: "Hello" }, 200);
});

export const GET = handle(app);
export const POST = handle(app);
```

With `@hono/zod-openapi` your request and response schemas *are* the OpenAPI document — there is no second spec to maintain — and you can serve a reference with Scalar or Swagger UI from a `GET /api/doc` route.

**Who hangs out here.** Hono's Discord is very active on edge runtime, middleware patterns, and mounting Hono inside Next.js. The people drawn to it want Express/Fastify-grade routing ergonomics while still deploying under Next.js.

**The honest caveat.** You are still deploying to a serverless function. Hono gives you a better router, composable middleware, and documentation for free — it doesn't change the execution model. Cold starts, per-request lifetimes, and function limits still apply.

## Contract-first: ts-rest and Next REST Framework

If you want tRPC's type safety without abandoning standard HTTP semantics, this is the camp for you.

**[ts-rest](https://ts-rest.com)** is the flagship. You define one contract — a single `DataContract.ts` built on Zod — and ts-rest generates typed Next.js route handlers on the server, typed client fetchers on the client (React Query included), and an OpenAPI/Swagger spec from the same source:

```ts
// contract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const contract = c.router({
  getPost: {
    method: "GET",
    path: "/posts/:id",
    responses: {
      200: z.object({ id: z.string(), title: z.string() }),
      404: z.object({ message: z.string() }),
    },
  },
});
```

The argument that wins people over: your contract and business logic stop being Next.js artifacts. If you ever lift the API out of Next.js into NestJS, Express, or Fastify, the contract — and every client built on it — moves with you untouched. That portability is the point.

**[Next REST Framework](https://github.com/blomqma/next-rest-framework)** takes the same idea with a different accent. It is explicitly inspired by FastAPI and Django REST Framework: typed request validation, consistent error formatting, and auto-generated Swagger UI / Redoc served from inside `app/api/`, all built specifically for Next.js.

Both projects have modest but dedicated communities. Conversations happen in each project's Discord and GitHub Discussions, with plenty of crossover on r/nextjs.

## The missing primitives: jobs, queues, and durable workflows

This is the real ceiling of Next.js as a backend, and the community around it is the loudest for a reason: serverless route handlers are request-scoped. There is no worker process quietly outliving the response, no reliable way to run a long job, and no built-in retry, throttling, or scheduling semantics.

Instead of pretending otherwise — or standing up a whole separate server just to hold background work — this camp buys the primitives:

- **Inngest** — durable, event-driven step functions with retries, rate limits, and multi-tenant queues, triggered directly from a route handler. Its Discord is one of the most active places where "Next.js as a backend" is the default assumption rather than the exception.
- **Trigger.dev** — long-running background jobs, AI orchestration, and async queues designed from the start for Next.js full-stack backends.
- **Upstash** — serverless Redis, QStash, and Kafka: the toolkit for pub/sub, distributed locking, and rate limiting inside API routes.

The shared worldview: keep route handlers as the trigger surface and the HTTP edge; push anything with retries, delays, or fan-out to a platform where durable execution is the product.

## Clean architecture and DDD in TypeScript

The last group isn't about a library at all. It's about where the code goes.

If you want the rigor usually associated with Java or .NET backends, Khalil Stemmler's writing — and his [Solid Book](https://solidbook.io) on Domain-Driven Design and Clean Architecture with TypeScript — is the reference point. It was originally written with Express in mind, but the layering maps directly onto Next.js. Many teams treat `app/api/**/route.ts` as nothing more than a delivery mechanism:

```
app/api/                  Presentation — HTTP adapters only
src/core/application/     Use cases, DTOs, orchestration
src/core/domain/          Entities, value objects, invariants
src/core/infrastructure/  Prisma / Drizzle / external APIs
```

The rule that makes it real: the domain layer never imports `Request`, `Response`, or Prisma. A route handler parses and validates input, calls a use case, and maps the result to a status code. Everything below the handler would look identical if the HTTP layer were swapped out tomorrow.

This blog is a small working example. Its backend follows the same shape: route handlers own HTTP concerns only, a service layer holds the business rules, and repositories own all Prisma access — so no route handler contains a query, and no repository leaks a raw database record into a response.

## Where to hang out and discuss

| Community | Where to join | Focus |
|---|---|---|
| **Hono** | [discord.gg/hono](https://discord.gg/hono) | Route handler architecture, OpenAPI, middleware |
| **r/nextjs** | [reddit.com/r/nextjs](https://www.reddit.com/r/nextjs/) | Search for ts-rest, "serious backend", and "Next.js architecture" threads |
| **Inngest** | [inngest.com/discord](https://www.inngest.com/discord) | Background tasks, event-driven architectures, queues |
| **T3 Stack** | [discord.gg/t3](https://discord.gg/t3) | Full-stack TypeScript architecture (tRPC, Next.js, Drizzle/Prisma) |
| **Vercel / Next.js** | [discord.gg/nextjs](https://discord.gg/nextjs) | `#api-routes`, `#backend`, `#databases` channels |

## How to choose

A short decision list, based on what you're missing:

- **Composable routing and OpenAPI with minimal ceremony** → mount Hono in a catch-all route handler.
- **A typed contract you can keep when the API outgrows Next.js** → ts-rest.
- **FastAPI-style validation and docs generated from schemas** → Next REST Framework.
- **Retries, queues, cron, long-running jobs** → Inngest or Trigger.dev.
- **Rate limiting, locks, pub/sub** → Upstash.
- **The whole thing staying readable in two years** → the clean-architecture layering, whichever of the above you pick.

None of this makes Next.js a bad choice for a backend; it makes it a choice you have to make deliberately. The subculture exists in the wide space between "route handlers are enough" and "we need a dedicated service" — and the craft is the same everywhere: keep the HTTP layer thin, keep the domain honest, and don't ask a request-scoped runtime to do a job's work.