# report-service

A small backend web service that renders templated reports from client-supplied
templates. **This is an intentionally vulnerable demo application** used to
exercise JFrog Xray SCA + Contextual Analysis against CVE-2026-33937.

## The vulnerability (CVE-2026-33937)

- **Package:** `handlebars` (npm), **direct dependency**, pinned to `4.0.11`.
- **Affected range:** `>= 4.0.0, <= 4.7.8` (CWE-94 / CWE-843, CVSS 9.8 Critical).
- **Mechanics:** `Handlebars.compile()` and `Handlebars.precompile()` accept a
  pre-parsed AST object in addition to a template string. In the affected
  versions a `NumberLiteral` node's `value` is emitted verbatim into the
  generated JavaScript without quoting or sanitization. An attacker who can
  supply a crafted AST reaches arbitrary JavaScript execution (RCE on the
  server for `compile`, injected code in the precompiled output for
  `precompile`).

## Why it is Applicable

An application is applicable when untrusted input reaches `compile()` /
`precompile()` as an **object** rather than a validated string. In
[`server.js`](server.js) the raw JSON request body field `req.body.template` is
passed straight into both functions:

```js
app.post("/render", (req, res) => {
  const template = Handlebars.compile(req.body.template); // untrusted AST -> RCE
  res.send(template(req.body.context || {}));
});

app.post("/precompile", (req, res) => {
  res.json({ spec: Handlebars.precompile(req.body.template) });
});
```

No string-type validation is performed (that validation is the documented
workaround), so the vulnerable code path is genuinely reachable from external
input.

## Build

The npm app name and the Docker image name are the same: `report-service`.

```bash
npm install            # generates package-lock.json pinning handlebars@4.0.11
docker build -t report-service .
```

The image is intended to be scanned by Xray; it does not need to be run.

## Exploit reference

[`exploit/payload.json`](exploit/payload.json) contains a crafted AST payload
(a `NumberLiteral` whose `value` injects a `child_process.execSync('id')` call).
It is kept for documentation only and is not executed here. Conceptually:

```bash
curl -s -X POST http://localhost:3000/render \
  -H 'Content-Type: application/json' \
  --data @exploit/payload.json
```

## Fix guidance

Upgrade to `handlebars@4.7.10` or later (4.7.9 is bypassable via
CVE-2026-106446) and validate that the template argument is always a `string`,
never a plain object or JSON-deserialized value.
