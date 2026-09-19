// Extracts the app page from threadpulse.mjs into dist/ for GitHub Pages.
// It is the exact page the local server serves: on a static host the page
// finds no relay at /health and switches itself to hosted-demo mode, where
// scoring runs the built-in local heuristic in the visitor's browser.
import fs from "node:fs";

const src = fs.readFileSync(new URL("./threadpulse.mjs", import.meta.url), "utf8");
const marker = "const html = String.raw`";
const start = src.indexOf(marker) + marker.length;
const end = src.indexOf("`;", start);
if (start < marker.length || end < 0) throw new Error("could not locate the embedded page");

fs.mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("./dist/index.html", import.meta.url), src.slice(start, end));
fs.writeFileSync(new URL("./dist/.nojekyll", import.meta.url), "");
console.log(`dist/index.html written (${end - start} bytes)`);
