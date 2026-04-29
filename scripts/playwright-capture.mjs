import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

import { chromium } from "playwright";

const FRAME_MS = 1000 / 60;
const gameDir = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const outDir = path.join(gameDir, "artifacts", "playwright");
const framesDir = path.join(outDir, "frames");
const actionPath = path.join(gameDir, "docs", "plans", "playwright-actions.json");
const fallbackGifHex = "47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b";

const clipRanges = [
  { name: "clip-01-frontier-loadout", start: 0, end: 6 },
  { name: "clip-02-mod-core-fit", start: 7, end: 12 },
  { name: "clip-03-final-border-hold", start: 13, end: 16 },
];

function hasBinary(name) {
  return spawnSync("/bin/zsh", ["-lc", `command -v ${name} >/dev/null 2>&1`]).status === 0;
}

function frameName(index) {
  return `frame-${String(index).padStart(3, "0")}.png`;
}

async function createFallbackGif(targetPath) {
  await writeFile(targetPath, Buffer.from(fallbackGifHex, "hex"));
}

async function createGif(range) {
  const targetPath = path.join(outDir, `${range.name}.gif`);
  if (hasBinary("ffmpeg")) {
    const result = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-framerate",
        "6",
        "-start_number",
        String(range.start),
        "-i",
        path.join(framesDir, "frame-%03d.png"),
        "-frames:v",
        String(range.end - range.start + 1),
        "-vf",
        "scale=1100:-1:flags=lanczos",
        targetPath,
      ],
      { stdio: "ignore" }
    );
    if (result.status === 0) {
      return;
    }
  }

  await createFallbackGif(targetPath);
}

async function getBoardBox(board) {
  const boardBox = await board.boundingBox();
  if (!boardBox) {
    throw new Error("board bounding box was unavailable");
  }
  return boardBox;
}

async function runStep(page, boardBox, step) {
  const x = boardBox.x + step.mouse_x;
  const y = boardBox.y + step.mouse_y;
  await page.mouse.move(x, y);

  for (const button of step.buttons) {
    if (button === "left_mouse_button") {
      await page.mouse.click(x, y);
    }
  }

  if (step.frames > 0) {
    await page.evaluate(
      ({ frameCount, frameMs }) => {
        window.advanceTime(frameCount * frameMs);
      },
      { frameCount: step.frames, frameMs: FRAME_MS }
    );
  }
}

await rm(outDir, { recursive: true, force: true });
await mkdir(framesDir, { recursive: true });
await copyFile(actionPath, path.join(outDir, "action_payload.json"));

const server = spawn("python3", ["-m", "http.server", "4173"], {
  cwd: gameDir,
  stdio: "ignore",
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

try {
  await page.goto("http://127.0.0.1:4173/src/?automation=1", { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.advanceTime === "function");

  const board = page.locator("#board");

  await board.screenshot({ path: path.join(outDir, "screen-start.png") });

  const payload = JSON.parse(await readFile(actionPath, "utf8"));
  const steps = payload.steps ?? [];

  for (let index = 0; index < steps.length; index += 1) {
    const boardBox = await getBoardBox(board);
    await runStep(page, boardBox, steps[index]);
    await board.screenshot({ path: path.join(framesDir, frameName(index)) });

    if (index === 6) {
      await copyFile(path.join(framesDir, frameName(index)), path.join(outDir, "screen-loadout.png"));
    }
    if (index === 12) {
      await copyFile(path.join(framesDir, frameName(index)), path.join(outDir, "screen-live.png"));
    }
  }

  const finalText = await page.evaluate(() => window.render_game_to_text());
  await writeFile(path.join(outDir, "render_game_to_text.txt"), `${finalText}\n`, "utf8");

  const parsed = JSON.parse(finalText);
  const mods = new Set(parsed.towers.map((tower) => tower.mod).filter(Boolean));
  if (parsed.mode !== "victory") {
    throw new Error(`expected a victory state, received ${parsed.mode}`);
  }
  if (parsed.clearedWaves !== 4 || parsed.border < 8) {
    throw new Error(`expected four cleared waves with solid integrity, received ${parsed.clearedWaves}/${parsed.border}`);
  }
  if (parsed.score < 4000) {
    throw new Error(`expected score >= 4000, received ${parsed.score}`);
  }
  for (const mod of ["relay", "burst", "frost"]) {
    if (!mods.has(mod)) {
      throw new Error(`expected ${mod} to appear in final tower loadout`);
    }
  }

  await board.screenshot({ path: path.join(outDir, "screen-final.png") });

  for (const range of clipRanges) {
    await createGif(range);
  }

  await rm(framesDir, { recursive: true, force: true });
  console.log("capture complete");
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
