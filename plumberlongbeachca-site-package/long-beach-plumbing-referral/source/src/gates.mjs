const BLOCKED_HOSTS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "localhost",
  "test.com",
]);

function badText(value) {
  return /placeholder|tbd|\btodo\b|pending|your brand|yourdomain|changeme|xxx+|555[-\s.]?01|000-000|lorem/i.test(String(value || ""));
}

function hostnameErrors(hostname, allowReservedTestDomain) {
  const errors = [];
  const host = String(hostname || "").trim().toLowerCase();
  if (!host) errors.push("domain hostname is empty");
  if (host.includes("://") || host.includes("/")) errors.push("domain must be a bare hostname");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) errors.push("domain hostname is not a plausible DNS name");
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".example")) {
    errors.push("domain is a placeholder or reserved example name");
  }
  if (host.endsWith(".invalid") && !allowReservedTestDomain) {
    errors.push("domain uses the reserved .invalid suffix");
  }
  if (badText(host)) errors.push("domain hostname contains placeholder language");
  return errors;
}

export function productionErrors(config, options = {}) {
  const errors = [];
  const allowReservedTestDomain = options.allowReservedTestDomain === true || config?.domain?.allowReservedTestDomain === true;
  if (!config || config.mode !== "production") errors.push("mode must be production");
  const brand = config?.brand || {};
  const domain = config?.domain || {};
  const phone = config?.phone || {};
  const hours = config?.hours || {};
  const coverage = config?.coverage || {};
  const compliance = config?.compliance || {};

  if (!brand.nameApproved) errors.push("brand.nameApproved is not true");
  if (!brand.approvedBrand || badText(brand.approvedBrand) || String(brand.approvedBrand).trim().length < 2) {
    errors.push("approved brand is missing or placeholder");
  }
  if (brand.publicName !== brand.approvedBrand) {
    errors.push("publicName must match the approved brand before production");
  }
  if (brand.operatorStatus !== "verified") errors.push("operatorStatus must be verified");
  if (!brand.operatorLegalName || badText(brand.operatorLegalName) || String(brand.operatorLegalName).trim().length < 3) {
    errors.push("operator legal name is missing or placeholder");
  }

  if (!domain.verified) errors.push("domain.verified is not true");
  errors.push(...hostnameErrors(domain.hostname, allowReservedTestDomain));

  if (!phone.verified) errors.push("phone.verified is not true");
  if (!/^\+1[2-9]\d{9}$/.test(phone.e164 || "")) errors.push("phone.e164 must be a real +1 NANP number");
  const digits = String(phone.display || "").replace(/\D/g, "");
  const national = String(phone.e164 || "").replace(/\D/g, "").replace(/^1/, "");
  if (!phone.display || badText(phone.display)) errors.push("phone display is missing or placeholder");
  if (digits.endsWith(national) === false || national.length !== 10) errors.push("phone display does not match e164");
  if (/^(\+1)?5{3}/.test(String(phone.e164 || "")) || digits.includes("55501")) {
    errors.push("phone looks like a reserved fictional number");
  }

  if (!hours.verified) errors.push("hours.verified is not true");
  if (hours.timezone !== "America/Los_Angeles") errors.push("hours.timezone must be America/Los_Angeles");
  if (!hours.summary || badText(hours.summary) || String(hours.summary).trim().length < 12) {
    errors.push("hours summary is missing or placeholder");
  }
  const impliesAlways = /24\s*\/\s*7|24-hour|around the clock|all hours|any time/i.test(hours.summary || "");
  if (hours.afterHoursStatement !== "confirmed" && hours.afterHoursStatement !== "none") {
    errors.push("hours.afterHoursStatement must be confirmed or none");
  }
  if (impliesAlways && hours.afterHoursStatement !== "confirmed") {
    errors.push("hours summary implies after-hours coverage that is not confirmed");
  }
  if (hours.afterHoursStatement === "confirmed" && hours.afterHoursRoutingConfirmed !== true) {
    errors.push("after-hours routing must be confirmed before the site says so");
  }

  for (const key of [
    "residentialZipsVerified",
    "nearbyCitiesVerified",
    "specialtiesVerified",
    "commercialAcceptanceVerified",
    "billableTermsVerified",
  ]) {
    if (coverage[key] !== true) errors.push(`coverage.${key} is not true`);
  }
  if (!coverage.acknowledgementNote || String(coverage.acknowledgementNote).trim().length < 12) {
    errors.push("coverage acknowledgement note is missing");
  }

  for (const key of ["californiaReferralReview", "privacyReview", "publishApproved"]) {
    if (compliance[key] !== true) errors.push(`compliance.${key} is not true`);
  }
  return errors;
}

export function canDial(config) {
  return config.mode === "production" && productionErrors(config).length === 0;
}
