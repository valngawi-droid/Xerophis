// Brand constants. Kept free of Node-only modules so it can be imported by
// both server and client (browser) bundles without pulling in node:sqlite.
export const BRAND = {
  app: "Xerophis",
  appTitle: "Xerophis",
  developer: "Pall",
  team: "Xerophis Team Dev",
  footer: "Developed with ♥ by Pall",
  rights: "All rights reserved.",
  tagline: "berjalan keras ke arah cita-cita",
} as const;
