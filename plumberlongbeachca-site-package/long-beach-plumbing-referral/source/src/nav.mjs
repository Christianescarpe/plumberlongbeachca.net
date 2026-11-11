export const services = [
  ["Drain cleaning", "/services/drain-cleaning/"],
  ["Sewer repair", "/services/sewer-repair/"],
  ["Leak detection", "/services/leak-detection/"],
  ["Pipes and water lines", "/services/pipe-water-line-repair/"],
  ["Water heaters", "/services/water-heaters/"],
  ["Fixtures and remodels", "/services/fixtures-remodel-plumbing/"],
  ["Gas lines", "/services/gas-line-plumbing/"],
  ["Commercial", "/services/commercial-plumbing/"],
  ["Specialty", "/services/specialty-plumbing/"],
];

export const districts = [
  ["Downtown and Alamitos Beach", "/areas/downtown-alamitos-beach/"],
  ["Belmont Shore and Heights", "/areas/belmont-shore-heights/"],
  ["Bixby Knolls and California Heights", "/areas/bixby-knolls-california-heights/"],
  ["East Long Beach", "/areas/east-long-beach/"],
  ["North Long Beach", "/areas/north-long-beach/"],
  ["Wrigley and West-Central", "/areas/wrigley-west-central/"],
];

export const cities = [
  ["Signal Hill", "/areas/signal-hill/"],
  ["Lakewood", "/areas/lakewood/"],
  ["Seal Beach", "/areas/seal-beach/"],
  ["Los Alamitos", "/areas/los-alamitos/"],
  ["Carson", "/areas/carson/"],
];

export const primaryNav = [
  ["Services", "/services/"],
  ["Areas", "/areas/"],
  ["Guides", "/plumbing-guides/"],
  ["How referrals work", "/how-referrals-work/"],
  ["About", "/about/"],
  ["Contact", "/contact/"],
];

export function crumbFor(path, crumbLabel) {
  if (path === "/") return [];
  const crumbs = [["Home", "/"]];
  if (path.startsWith("/services/")) {
    crumbs.push(["Services", "/services/"]);
    if (path !== "/services/") crumbs.push([crumbLabel, path]);
  } else if (path.startsWith("/areas/")) {
    crumbs.push(["Areas", "/areas/"]);
    if (path !== "/areas/") crumbs.push([crumbLabel, path]);
  } else {
    crumbs.push([crumbLabel, path]);
  }
  return crumbs;
}

export function sectionNav(path) {
  if (path.startsWith("/services/") && path !== "/services/") return services;
  if (path.startsWith("/areas/") && path !== "/areas/") return [...districts, ...cities];
  return [];
}
