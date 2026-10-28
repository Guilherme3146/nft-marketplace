// Audita o catálogo (página principal) com Lighthouse, em dois form factors
// (desktop/mobile), 3 medições cada, reportando a mediana por categoria —
// conforme exigido no briefing (Performance >= 90, Acessibilidade >= 95,
// Boas práticas >= 95, SEO >= 90).
//
// Uso: npm run audit:lighthouse
// Gera lighthouse/reports/<form-factor>.html e .json (versionados) e
// mantém as 3 corridas brutas em lighthouse/tmp/ (não versionado).

import { execFileSync, spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "playwright-core";

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const URL_UNDER_TEST = "http://localhost:4173/";
const RUNS_PER_FORM_FACTOR = 3;

const PRESETS = {
  desktop: {
    formFactor: "desktop",
    screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
  },
  mobile: {
    formFactor: "mobile",
    screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
    throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
  },
};

const CATEGORY_TARGETS = {
  performance: 90,
  accessibility: 95,
  "best-practices": 95,
  seo: 90,
};

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Servidor não respondeu em ${url} depois de ${timeoutMs}ms`);
}

async function runFormFactor(name, preset, chromePort, tmpDir) {
  const scores = { performance: [], accessibility: [], "best-practices": [], seo: [] };
  let lastHtmlReport;

  for (let i = 1; i <= RUNS_PER_FORM_FACTOR; i++) {
    const result = await lighthouse(
      URL_UNDER_TEST,
      { port: chromePort, output: "html", logLevel: "error" },
      { extends: "lighthouse:default", settings: preset },
    );
    for (const key of Object.keys(scores)) {
      scores[key].push(result.lhr.categories[key].score * 100);
    }
    await writeFile(path.join(tmpDir, `${name}-run${i}.html`), result.report);
    lastHtmlReport = result.report;
  }

  return { scores, lastHtmlReport };
}

async function main() {
  const reportsDir = path.join(ROOT, "lighthouse", "reports");
  const tmpDir = path.join(ROOT, "lighthouse", "tmp");
  await mkdir(reportsDir, { recursive: true });
  await mkdir(tmpDir, { recursive: true });

  console.log("Buildando e subindo o preview de produção...");
  const preview = spawn("npm", ["run", "preview"], { cwd: ROOT, shell: true, stdio: "ignore" });

  function stopPreview() {
    // `shell: true` no Windows spawna um cmd.exe que, por sua vez, spawna o node do
    // vite preview — preview.kill() mataria só o cmd.exe, deixando o servidor órfão
    // numa porta presa. Mata a árvore inteira de processos.
    if (process.platform === "win32") {
      try {
        execFileSync("taskkill", ["/pid", String(preview.pid), "/T", "/F"], { stdio: "ignore" });
      } catch {
        // já tinha saído
      }
    } else {
      preview.kill();
    }
  }

  const summary = {};
  try {
    await waitForServer(URL_UNDER_TEST);

    const chrome = await launch({
      chromePath: chromium.executablePath(),
      chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox"],
    });

    try {
      for (const [name, preset] of Object.entries(PRESETS)) {
        console.log(`Rodando Lighthouse (${name}) x${RUNS_PER_FORM_FACTOR}...`);
        const { scores, lastHtmlReport } = await runFormFactor(name, preset, chrome.port, tmpDir);

        const medians = Object.fromEntries(
          Object.entries(scores).map(([key, values]) => [key, Math.round(median(values))]),
        );
        summary[name] = medians;

        await writeFile(path.join(reportsDir, `${name}.html`), lastHtmlReport);
        await writeFile(
          path.join(reportsDir, `${name}.json`),
          JSON.stringify({ medians, targets: CATEGORY_TARGETS, runs: scores }, null, 2),
        );
      }
    } finally {
      await chrome.kill();
    }
  } finally {
    stopPreview();
  }

  console.log("\nResultado (mediana de 3 execuções):\n");
  for (const [name, medians] of Object.entries(summary)) {
    console.log(`  ${name}:`);
    for (const [key, target] of Object.entries(CATEGORY_TARGETS)) {
      const value = medians[key];
      const status = value >= target ? "OK" : "ABAIXO DA META";
      console.log(`    ${key}: ${value} (meta >= ${target}) — ${status}`);
    }
  }
  console.log(`\nRelatórios completos em lighthouse/reports/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
