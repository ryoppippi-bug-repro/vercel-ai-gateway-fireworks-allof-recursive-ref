# Vercel AI Gateway: Fireworks returns 400 for a recursive `$ref` wrapped in `allOf`

Issue: _link added after filing_

Through Vercel AI Gateway, `deepseek/deepseek-v4.1-flash-1017-ultrafast` (served only by Fireworks) rejects a tool whose `parameters` contain a **recursive** `$ref` wrapped in a one-arm `allOf`:

```json
"child": { "allOf": [{ "$ref": "#/definitions/node" }] }
```

The request fails with a bare `Request failed with HTTP status 400.` and no upstream error message.

This is the shape zod 4 emits for draft-07 (what the AI SDK sends) for any optional recursive property, so any AI SDK tool with an optional recursive field fails on this route.

## Expected

HTTP 200. `{ allOf: [X] }` is equivalent to `X`, and [Fireworks' docs](https://docs.fireworks.ai/guides/function-calling) list `allOf`, draft-07 `definitions` and recursive `$ref` as supported in tool `parameters`.

## Actual

| Command | Host | Schema | Result |
| --- | --- | --- | --- |
| `pnpm repro` | fireworks | `{ allOf: [{ $ref }] }` (recursive) | **HTTP 400** |
| `pnpm repro:plain` | fireworks | `{ $ref }` (recursive) | HTTP 200 |
| `pnpm repro:baseten` | baseten (`deepseek/deepseek-v4.1-flash-1017`) | `{ allOf: [{ $ref }] }` (recursive) | HTTP 200 |

The same request with BYOK and system credentials both return 400 (Gateway's `providerAttempts` shows two Fireworks attempts with `statusCode: 400`).

## Run

```sh
export AI_GATEWAY_API_KEY=...   # a Vercel AI Gateway key
pnpm repro            # 400
pnpm repro:plain      # 200
pnpm repro:baseten    # 200
```

No dependencies: `repro.mjs` calls `https://ai-gateway.vercel.sh/v1/chat/completions` with `fetch`.

## Versions

- Node.js 24.21.0
- pnpm 12.16.1
- Observed 2026-11-08
