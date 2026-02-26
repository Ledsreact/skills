#!/usr/bin/env node

/**
 * Fetches the latest Ledsreact OpenAPI spec and saves it to the assets folder.
 *
 * Usage:
 *   node get_latest_ledsreact_openapi_spec.js [--format yaml|json] [--output <path>]
 *
 * Defaults: format=yaml, output=../assets/ledsreact_openapi.<format>
 */

const { writeFileSync, mkdirSync } = require("fs");
const { resolve, dirname } = require("path");

const BASE = "https://open-api.eu.ledsreact.com";
const URLS = {
  yaml: `${BASE}/docs-yaml`,
  json: `${BASE}/docs-json`,
};

function parseArgs(argv) {
  const args = { format: "yaml", output: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--format" && argv[i + 1]) {
      args.format = argv[++i].toLowerCase();
    } else if (argv[i] === "--output" && argv[i + 1]) {
      args.output = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(
        "Usage: node get_latest_ledsreact_openapi_spec.js [--format yaml|json] [--output <path>]"
      );
      process.exit(0);
    }
  }
  if (!["yaml", "json"].includes(args.format)) {
    console.error(`Invalid format "${args.format}". Use "yaml" or "json".`);
    process.exit(1);
  }
  if (!args.output) {
    args.output = resolve(
      __dirname,
      "..",
      "assets",
      `ledsreact_openapi.${args.format}`
    );
  }
  return args;
}

async function main() {
  const { format, output } = parseArgs(process.argv);
  const url = URLS[format];

  console.log(`Fetching ${format.toUpperCase()} spec from ${url} ...`);

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${res.statusText}`);
    process.exit(1);
  }

  const body = await res.text();
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, body, "utf-8");
  console.log(`Saved to ${output} (${(body.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
