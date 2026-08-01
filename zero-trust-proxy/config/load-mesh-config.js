// Loads and validates the mesh topology (services, RBAC policy, allowed
// regions) from a single JSON file instead of hardcoding it across
// auth/identity-registry.js, proxy/index.js, and policy/rbac-map.js.
//
// Secrets are never stored in this file — each service entry names the
// env var holding its secret (secretEnv), and the actual value is read
// from process.env at load time, same as before this file existed.

const fs = require("fs");
const path = require("path");

const DEFAULT_CONFIG_PATH = path.join(__dirname, "..", "mesh.config.json");

function loadMeshConfig(configPath = process.env.MESH_CONFIG_PATH || DEFAULT_CONFIG_PATH) {
  let raw;
  try {
    raw = fs.readFileSync(configPath, "utf8");
  } catch (err) {
    throw new Error(`failed to read mesh config at '${configPath}': ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`mesh config at '${configPath}' is not valid JSON: ${err.message}`);
  }

  validate(parsed, configPath);

  const serviceNames = Object.keys(parsed.services);

  const secrets = {};
  const hosts = {};
  for (const name of serviceNames) {
    const entry = parsed.services[name];
    secrets[name] = process.env[entry.secretEnv];
    hosts[name] = (entry.urlEnv && process.env[entry.urlEnv]) || entry.url;
  }

  return {
    serviceNames,
    secrets,
    hosts,
    rbac: parsed.rbac,
    allowedRegions: parsed.allowedRegions,
  };
}

function validate(config, configPath) {
  if (!config || typeof config !== "object") {
    throw new Error(`mesh config at '${configPath}' must be a JSON object`);
  }
  if (!config.services || typeof config.services !== "object" || Array.isArray(config.services)) {
    throw new Error(`mesh config at '${configPath}' is missing a "services" object`);
  }
  if (Object.keys(config.services).length === 0) {
    throw new Error(`mesh config at '${configPath}' must declare at least one service`);
  }

  const serviceNames = new Set(Object.keys(config.services));

  for (const [name, entry] of Object.entries(config.services)) {
    if (!entry || typeof entry !== "object") {
      throw new Error(`service '${name}' in mesh config must be an object`);
    }
    if (!entry.secretEnv || typeof entry.secretEnv !== "string") {
      throw new Error(`service '${name}' in mesh config is missing a "secretEnv" (name of the env var holding its secret)`);
    }
    if (!entry.url || typeof entry.url !== "string") {
      throw new Error(`service '${name}' in mesh config is missing a "url" (default/fallback target URL)`);
    }
  }

  if (!config.rbac || typeof config.rbac !== "object" || Array.isArray(config.rbac)) {
    throw new Error(`mesh config at '${configPath}' is missing an "rbac" object`);
  }

  for (const [caller, targets] of Object.entries(config.rbac)) {
    if (!serviceNames.has(caller)) {
      throw new Error(`mesh config "rbac" references unknown caller service '${caller}' (not declared in "services")`);
    }
    if (!Array.isArray(targets)) {
      throw new Error(`mesh config "rbac" entry for '${caller}' must be an array of target service names`);
    }
    for (const target of targets) {
      if (!serviceNames.has(target)) {
        throw new Error(`mesh config "rbac" for '${caller}' references unknown target service '${target}' (not declared in "services")`);
      }
    }
  }

  if (!Array.isArray(config.allowedRegions) || config.allowedRegions.length === 0) {
    throw new Error(`mesh config at '${configPath}' must declare a non-empty "allowedRegions" array`);
  }
}

module.exports = { loadMeshConfig, DEFAULT_CONFIG_PATH };
