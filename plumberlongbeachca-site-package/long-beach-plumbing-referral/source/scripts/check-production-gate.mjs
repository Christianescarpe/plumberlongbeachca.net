import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productionErrors } from "../src/gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const current = JSON.parse(fs.readFileSync(path.join(root, "site.config.json"), "utf8"));
const previewErrors = productionErrors({ ...current, mode: "production" });
if (previewErrors.length < 5) {
  console.error("Expected the shipped config to fail production checks");
  process.exit(1);
}

function run(args) {
  return spawnSync(process.execPath, [path.join(root, "src/build.mjs"), ...args], { encoding: "utf8" });
}

const refused = run(["--production"]);
if (refused.status === 0) {
  console.error("Production build of the shipped config should fail");
  process.exit(1);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lb-gate-"));
const bad = structuredClone(current);
bad.mode = "production";
bad.phone = { display: "(555) 010-0000", e164: "+15550100000", verified: true };
fs.writeFileSync(path.join(dir, "bad.json"), JSON.stringify(bad));
const badRun = run(["--production", "--config", path.join(dir, "bad.json"), "--out", path.join(dir, "bad-out")]);
if (badRun.status === 0) {
  console.error("Fictional 555 number was accepted");
  process.exit(1);
}

const good = {
  mode: "production",
  basePath: "",
  brand: {
    publicName: "Harbor Referral Desk",
    nameStatus: "approved",
    approvedBrand: "Harbor Referral Desk",
    nameApproved: true,
    operatorLegalName: "Example Operator LLC",
    operatorStatus: "verified",
  },
  domain: { hostname: "launch-gate.invalid", verified: true },
  phone: { display: "(310) 555-1000", e164: "+13105551000", verified: true },
  hours: {
    summary: "Weekdays 8:00 a.m. to 5:00 p.m.",
    timezone: "America/Los_Angeles",
    verified: true,
    afterHoursStatement: "none",
    afterHoursRoutingConfirmed: false,
  },
  coverage: {
    residentialZipsVerified: true,
    nearbyCitiesVerified: true,
    specialtiesVerified: true,
    commercialAcceptanceVerified: true,
    billableTermsVerified: true,
    acknowledgementNote: "Fixture acknowledgement for the gate test only.",
  },
  compliance: { californiaReferralReview: true, privacyReview: true, publishApproved: true },
};
fs.writeFileSync(path.join(dir, "good.json"), JSON.stringify(good));
const goodOut = path.join(dir, "good-out");
const goodRun = run(["--production", "--config", path.join(dir, "good.json"), "--out", goodOut, "--allow-reserved-test-domain"]);
if (goodRun.status !== 0) {
  console.error(goodRun.stdout);
  console.error(goodRun.stderr);
  console.error("Fully acknowledged fixture should build");
  process.exit(1);
}
const home = fs.readFileSync(path.join(goodOut, "index.html"), "utf8");
if (!home.includes('href="tel:+13105551000"')) {
  console.error("Production fixture did not emit its tel link");
  process.exit(1);
}
if (!home.includes("https://launch-gate.invalid/")) {
  console.error("Production fixture did not emit a canonical");
  process.exit(1);
}
if (home.includes("noindex")) {
  console.error("Production fixture stayed noindex");
  process.exit(1);
}
const blocked = { ...good, domain: { hostname: "launch-gate.invalid", verified: true } };
fs.writeFileSync(path.join(dir, "blocked.json"), JSON.stringify(blocked));
const blockedRun = run(["--production", "--config", path.join(dir, "blocked.json"), "--out", path.join(dir, "blocked-out")]);
if (blockedRun.status === 0) {
  console.error(".invalid domain was accepted without the test override");
  process.exit(1);
}

fs.rmSync(dir, { recursive: true, force: true });
console.log(`Production gate checks passed. Shipped config is refused (${previewErrors.length} reasons). Fixture output was deleted.`);
