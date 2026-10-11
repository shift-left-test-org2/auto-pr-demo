"use strict";

// Backend report-rendering service.
// handlebars is a direct dependency and is used directly here.
const express = require("express");
const Handlebars = require("handlebars");

const app = express();
app.use(express.json());

// Renders a report from a client-supplied template and context.
// The template comes straight from the untrusted JSON request body and is
// passed as-is to Handlebars.compile. Handlebars accepts a pre-parsed AST
// object in addition to a string, so an attacker-controlled object reaches
// the compiler (CVE-2026-33937).
app.post("/render", (req, res) => {
  const template = Handlebars.compile(req.body.template);
  res.send(template(req.body.context || {}));
});

// Precompiles a client-supplied template for client-side rendering.
// Same untrusted input reaches Handlebars.precompile (CVE-2026-33937).
app.post("/precompile", (req, res) => {
  res.json({ spec: Handlebars.precompile(req.body.template) });
});

app.get("/health", (_req, res) => res.send("ok"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`report-service listening on ${port}`));
