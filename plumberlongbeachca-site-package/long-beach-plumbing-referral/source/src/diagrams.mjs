const frame = (inner, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 230" role="img" aria-label="${label}">
  <rect x="1" y="1" width="358" height="228" rx="16" fill="#fffdf9" stroke="#e2d9cc"/>
  ${inner}
</svg>`;

export const diagrams = {
  "sewer-lateral": {
    title: "Long Beach sewer lateral, in plain sections",
    caption: "Diagram based on Long Beach Utilities’ published description of a sewer lateral. Common diameters are the utility’s typical sizes, not a measurement of any address. The drawing is not a survey.",
    svg: frame(`
      <text x="18" y="28" fill="#0e2438" font-family="Fraunces, Georgia, serif" font-size="15">Who maintains which pipe</text>
      <rect x="18" y="48" width="70" height="46" rx="6" fill="#0e2438"/>
      <text x="53" y="76" text-anchor="middle" fill="#f7f2ea" font-family="Source Sans 3, sans-serif" font-size="12">Building</text>
      <line x1="88" y1="71" x2="150" y2="71" stroke="#a85b32" stroke-width="6" stroke-linecap="round"/>
      <text x="92" y="108" fill="#7a3d1c" font-family="Source Sans 3, sans-serif" font-size="11">To property line</text>
      <text x="92" y="124" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="11">Owner’s section</text>
      <line x1="168" y1="46" x2="168" y2="150" stroke="#1d5e66" stroke-dasharray="4 4"/>
      <text x="174" y="58" fill="#1d5e66" font-family="Source Sans 3, sans-serif" font-size="11">Property line</text>
      <line x1="168" y1="71" x2="250" y2="71" stroke="#a85b32" stroke-width="8" stroke-linecap="round"/>
      <text x="176" y="108" fill="#7a3d1c" font-family="Source Sans 3, sans-serif" font-size="11">To the main</text>
      <text x="176" y="124" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="11">Shared section</text>
      <rect x="258" y="56" width="82" height="30" rx="8" fill="#1d5e66"/>
      <text x="299" y="76" text-anchor="middle" fill="#f7f2ea" font-family="Source Sans 3, sans-serif" font-size="12">City main</text>
      <text x="18" y="168" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Routine maintenance of both lateral sections: property owner.</text>
      <text x="18" y="188" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">City maintains the main and city-side lateral repairs.</text>
      <text x="18" y="208" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="11">Common sizes cited by the utility: about 4 in., then 6 in.</text>
    `, "Diagram of a Long Beach sewer lateral from the building to the city main"),
  },
  "leak-paths": {
    title: "A leak is a location question first",
    caption: "Original diagram. It separates a fixture leak from a supply leak. It does not find the leak in a particular building.",
    svg: frame(`
      <text x="18" y="28" fill="#0e2438" font-family="Fraunces, Georgia, serif" font-size="15">Where is the water showing up?</text>
      <rect x="18" y="48" width="150" height="70" rx="10" fill="#fff" stroke="#0e2438"/>
      <text x="93" y="78" text-anchor="middle" fill="#0e2438" font-family="Source Sans 3, sans-serif" font-size="13">One fixture</text>
      <text x="93" y="98" text-anchor="middle" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Valve, trap, supply stop</text>
      <rect x="192" y="48" width="150" height="70" rx="10" fill="#fff" stroke="#a85b32"/>
      <text x="267" y="78" text-anchor="middle" fill="#7a3d1c" font-family="Source Sans 3, sans-serif" font-size="13">Several rooms</text>
      <text x="267" y="98" text-anchor="middle" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Supply, slab, or meter</text>
      <text x="18" y="154" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Street water or a spinning meter with no use:</text>
      <text x="18" y="174" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">ask whether Long Beach Utilities should see it.</text>
      <text x="18" y="204" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">This site cannot tell which case you have.</text>
    `, "Diagram contrasting a single-fixture leak with a building-wide supply leak"),
  },
  "supply-meter": {
    title: "Private supply line and the utility main",
    caption: "Original diagram of the usual water-service boundary. Long Beach Utilities says it delivers water to the meter. The pipe after that is a private question. Confirm the meter location on site.",
    svg: frame(`
      <text x="18" y="28" fill="#0e2438" font-family="Fraunces, Georgia, serif" font-size="15">Water, up to the meter and after it</text>
      <rect x="18" y="58" width="90" height="36" rx="8" fill="#1d5e66"/>
      <text x="63" y="81" text-anchor="middle" fill="#f7f2ea" font-family="Source Sans 3, sans-serif" font-size="12">City main</text>
      <line x1="108" y1="76" x2="168" y2="76" stroke="#1d5e66" stroke-width="6"/>
      <rect x="168" y="58" width="70" height="36" rx="8" fill="#0e2438"/>
      <text x="203" y="81" text-anchor="middle" fill="#f7f2ea" font-family="Source Sans 3, sans-serif" font-size="12">Meter</text>
      <line x1="238" y1="76" x2="300" y2="76" stroke="#a85b32" stroke-width="6"/>
      <rect x="300" y="52" width="42" height="48" rx="6" fill="#a85b32"/>
      <text x="321" y="80" text-anchor="middle" fill="#fff" font-family="Source Sans 3, sans-serif" font-size="11">Home</text>
      <text x="18" y="128" fill="#1d5e66" font-family="Source Sans 3, sans-serif" font-size="12">Utility side: main and service to the meter.</text>
      <text x="18" y="150" fill="#7a3d1c" font-family="Source Sans 3, sans-serif" font-size="12">Private side: piping on the property.</text>
      <text x="18" y="182" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">A city water main is not a private repair.</text>
      <text x="18" y="204" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Buried private pipe still needs a locate and permit check.</text>
    `, "Diagram of the city water main, meter, and private house piping"),
  },
  "heater-choice": {
    title: "Tank and tankless are different constraints",
    caption: "Original diagram. It does not size a heater or promise an energy result. Fuel, venting, space, and permits decide what fits.",
    svg: frame(`
      <text x="18" y="28" fill="#0e2438" font-family="Fraunces, Georgia, serif" font-size="15">Two shapes of water heater</text>
      <rect x="36" y="52" width="78" height="110" rx="10" fill="#fff" stroke="#0e2438" stroke-width="2"/>
      <rect x="50" y="68" width="50" height="14" rx="3" fill="#e7e1d6"/>
      <text x="75" y="150" text-anchor="middle" fill="#0e2438" font-family="Source Sans 3, sans-serif" font-size="13">Storage tank</text>
      <rect x="190" y="70" width="120" height="70" rx="8" fill="#fff" stroke="#a85b32" stroke-width="2"/>
      <text x="250" y="110" text-anchor="middle" fill="#7a3d1c" font-family="Source Sans 3, sans-serif" font-size="13">Tankless</text>
      <text x="18" y="190" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Ask about fuel, vent, space, condensate, and the permit.</text>
      <text x="18" y="210" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Long Beach Utilities delivers unheated water.</text>
    `, "Diagram comparing a storage water heater and a tankless unit"),
  },
  "fixture-scope": {
    title: "Fixture work stops at the plumbing",
    caption: "Original diagram. Cabinet, tile, electrical, and finish carpentry are separate scopes unless a written quote says otherwise.",
    svg: frame(`
      <text x="18" y="28" fill="#0e2438" font-family="Fraunces, Georgia, serif" font-size="15">What a plumbing quote has to name</text>
      <rect x="18" y="50" width="150" height="78" rx="10" fill="#0e2438"/>
      <text x="93" y="84" text-anchor="middle" fill="#f7f2ea" font-family="Source Sans 3, sans-serif" font-size="13">Plumbing scope</text>
      <text x="93" y="106" text-anchor="middle" fill="#f4e6d4" font-family="Source Sans 3, sans-serif" font-size="12">Supply, drain, fixture</text>
      <rect x="186" y="50" width="156" height="78" rx="10" fill="#fff" stroke="#a85b32"/>
      <text x="264" y="84" text-anchor="middle" fill="#7a3d1c" font-family="Source Sans 3, sans-serif" font-size="13">Often separate</text>
      <text x="264" y="106" text-anchor="middle" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Tile, cabinet, electric</text>
      <text x="18" y="160" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Historic-district rules depend on the exact work.</text>
      <text x="18" y="182" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Ask Long Beach Planning before assuming a waiver.</text>
      <text x="18" y="208" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">A customer-supplied fixture still needs to match the openings.</text>
    `, "Diagram separating plumbing fixture scope from tile, cabinet, and electrical work"),
  },
  "gas-boundary": {
    title: "Suspected gas is not a sales call",
    caption: "Original diagram. Suspected gas goes to Long Beach Utilities or 911 from a safe place. Planned appliance piping is a different, non-emergency conversation.",
    svg: frame(`
      <text x="18" y="28" fill="#0e2438" font-family="Fraunces, Georgia, serif" font-size="15">Two different gas situations</text>
      <rect x="18" y="48" width="156" height="86" rx="10" fill="#7a3d1c"/>
      <text x="96" y="80" text-anchor="middle" fill="#fff" font-family="Source Sans 3, sans-serif" font-size="13">Smell or hiss</text>
      <text x="96" y="102" text-anchor="middle" fill="#f8efe4" font-family="Source Sans 3, sans-serif" font-size="12">Leave. Call utility</text>
      <text x="96" y="118" text-anchor="middle" fill="#f8efe4" font-family="Source Sans 3, sans-serif" font-size="12">or 911. Not us.</text>
      <rect x="188" y="48" width="154" height="86" rx="10" fill="#fff" stroke="#0e2438"/>
      <text x="265" y="80" text-anchor="middle" fill="#0e2438" font-family="Source Sans 3, sans-serif" font-size="13">Planned piping</text>
      <text x="265" y="102" text-anchor="middle" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Appliance line,</text>
      <text x="265" y="118" text-anchor="middle" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">permit, access</text>
      <text x="18" y="168" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Do not test a suspected leak yourself.</text>
      <text x="18" y="190" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Long Beach gas emergency: (562) 570-2140.</text>
      <text x="18" y="212" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Neighboring cities may use a different gas utility.</text>
    `, "Diagram separating a suspected gas leak from planned gas-line work"),
  },
  "commercial-auth": {
    title: "Commercial calls start with authority",
    caption: "Original diagram. A referred provider has to know who can authorize the work, what the fixture is, and when the business can be accessed.",
    svg: frame(`
      <text x="18" y="28" fill="#0e2438" font-family="Fraunces, Georgia, serif" font-size="15">Before a commercial visit</text>
      <rect x="18" y="52" width="100" height="64" rx="8" fill="#0e2438"/>
      <text x="68" y="80" text-anchor="middle" fill="#f7f2ea" font-family="Source Sans 3, sans-serif" font-size="12">Who may</text>
      <text x="68" y="98" text-anchor="middle" fill="#f7f2ea" font-family="Source Sans 3, sans-serif" font-size="12">approve</text>
      <rect x="130" y="52" width="100" height="64" rx="8" fill="#1d5e66"/>
      <text x="180" y="80" text-anchor="middle" fill="#f7f2ea" font-family="Source Sans 3, sans-serif" font-size="12">Fixture and</text>
      <text x="180" y="98" text-anchor="middle" fill="#f7f2ea" font-family="Source Sans 3, sans-serif" font-size="12">property</text>
      <rect x="242" y="52" width="100" height="64" rx="8" fill="#a85b32"/>
      <text x="292" y="80" text-anchor="middle" fill="#fff" font-family="Source Sans 3, sans-serif" font-size="12">Hours and</text>
      <text x="292" y="98" text-anchor="middle" fill="#fff" font-family="Source Sans 3, sans-serif" font-size="12">access</text>
      <text x="18" y="154" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Shared lines need the right owner or manager.</text>
      <text x="18" y="176" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Grease traps and industrial work are not assumed.</text>
      <text x="18" y="206" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Acceptance is confirmed on the call, not by this page.</text>
    `, "Diagram of commercial plumbing questions: authority, fixture, and access"),
  },
  "treatment-scope": {
    title: "Treatment is a chosen add-on, not a warning",
    caption: "Original diagram. Long Beach Utilities calls the drinking water moderately hard to hard. That is a mineral description, not a finding that the water is unsafe.",
    svg: frame(`
      <text x="18" y="28" fill="#0e2438" font-family="Fraunces, Georgia, serif" font-size="15">Hardness is not a hazard claim</text>
      <rect x="18" y="50" width="324" height="36" rx="8" fill="#e6f1f2"/>
      <text x="180" y="73" text-anchor="middle" fill="#1d5e66" font-family="Source Sans 3, sans-serif" font-size="13">City water: moderately hard to hard</text>
      <rect x="18" y="102" width="154" height="58" rx="8" fill="#fff" stroke="#0e2438"/>
      <text x="95" y="126" text-anchor="middle" fill="#0e2438" font-family="Source Sans 3, sans-serif" font-size="13">Scale and spots</text>
      <text x="95" y="146" text-anchor="middle" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">A maintenance question</text>
      <rect x="186" y="102" width="156" height="58" rx="8" fill="#fff" stroke="#a85b32"/>
      <text x="264" y="126" text-anchor="middle" fill="#7a3d1c" font-family="Source Sans 3, sans-serif" font-size="13">Filter or softener</text>
      <text x="264" y="146" text-anchor="middle" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Optional, if accepted</text>
      <text x="18" y="186" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Salt softeners add sodium. Ask a doctor if that matters.</text>
      <text x="18" y="208" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">We do not test your water on this website.</text>
    `, "Diagram separating hard-water scale from optional treatment equipment"),
  },
  "district-groups": {
    title: "Six editorial groupings",
    caption: "Original diagram of the six Long Beach groupings used on this site. They are not official boundaries, and ZIP codes cross them.",
    svg: frame(`
      <text x="18" y="26" fill="#0e2438" font-family="Fraunces, Georgia, serif" font-size="15">Long Beach groupings on this site</text>
      <rect x="18" y="42" width="104" height="36" rx="6" fill="#0e2438"/><text x="70" y="65" text-anchor="middle" fill="#fff" font-size="10" font-family="Source Sans 3, sans-serif">Downtown / Alamitos</text>
      <rect x="128" y="42" width="104" height="36" rx="6" fill="#1d5e66"/><text x="180" y="65" text-anchor="middle" fill="#fff" font-size="10" font-family="Source Sans 3, sans-serif">Belmont Shore</text>
      <rect x="238" y="42" width="104" height="36" rx="6" fill="#7a3d1c"/><text x="290" y="65" text-anchor="middle" fill="#fff" font-size="10" font-family="Source Sans 3, sans-serif">Bixby / Cal Hts</text>
      <rect x="18" y="86" width="104" height="36" rx="6" fill="#0e2438"/><text x="70" y="109" text-anchor="middle" fill="#fff" font-size="10" font-family="Source Sans 3, sans-serif">East Long Beach</text>
      <rect x="128" y="86" width="104" height="36" rx="6" fill="#1d5e66"/><text x="180" y="109" text-anchor="middle" fill="#fff" font-size="10" font-family="Source Sans 3, sans-serif">North Long Beach</text>
      <rect x="238" y="86" width="104" height="36" rx="6" fill="#7a3d1c"/><text x="290" y="109" text-anchor="middle" fill="#fff" font-size="10" font-family="Source Sans 3, sans-serif">Wrigley / central</text>
      <text x="18" y="150" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Eleven residential ZIP sections sit inside these six guides.</text>
      <text x="18" y="172" fill="#1c2430" font-family="Source Sans 3, sans-serif" font-size="12">Signal Hill is a separate city, not one of the six.</text>
      <text x="18" y="202" fill="#3e4a57" font-family="Source Sans 3, sans-serif" font-size="12">Not a boundary map. Not proof of coverage.</text>
    `, "Diagram listing six editorial Long Beach district groupings"),
  },
};
