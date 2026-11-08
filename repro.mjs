// Sends one tool whose input schema has a recursive `$ref` through Vercel AI Gateway.
// argv[2] wrapped (default): the recursive ref is wrapped in a one-arm `allOf`, as zod's draft-07 output emits it.
// argv[2] plain: the same ref without the wrapper.
// argv[3] picks the Gateway host (default fireworks).
const shape = process.argv[2] ?? "wrapped";
const provider = process.argv[3] ?? "fireworks";
const model = provider === "fireworks" ? "deepseek/deepseek-v4.1-flash-1017-ultrafast" : "deepseek/deepseek-v4.1-flash-1017";
const self = { $ref: "#/definitions/node" };

const parameters = {
  type: "object",
  properties: { root: { $ref: "#/definitions/node" } },
  definitions: {
    node: {
      type: "object",
      properties: {
        id: { type: "string" },
        child: shape === "plain" ? self : { allOf: [self] },
      },
    },
  },
};

const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` },
  body: JSON.stringify({
    model,
    max_tokens: 16,
    messages: [{ role: "user", content: "hi" }],
    tools: [{ type: "function", function: { name: "tree", description: "tree", parameters } }],
    providerOptions: { gateway: { only: [provider] } },
  }),
});
console.log(`${provider} ${model} shape=${shape} -> HTTP ${res.status}`);
if (!res.ok) console.log((await res.text()).slice(0, 600));
