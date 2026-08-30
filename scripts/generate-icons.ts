import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'

const APP_SIZE = 1024
const TRAY_SIZE = 44
const MARGIN = 0.14
const APP_BACKGROUND = { r: 247, g: 247, b: 247, alpha: 1 }

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = join(root, 'src', 'assets', 'defillama-search-logo.svg')
const traySourcePath = join(root, 'src', 'assets', 'defillama-tray-icon.png')
const iconsDir = join(root, 'src-tauri', 'icons')
const appIconPath = join(iconsDir, 'app-icon.png')
const trayIconPath = join(iconsDir, 'tray-icon.png')

function rasterize(svg: Buffer, fit: number): Buffer {
  return Buffer.from(
    new Resvg(svg, {
      fitTo: { mode: 'height', value: fit },
    })
      .render()
      .asPng(),
  )
}

async function padToSquare(
  png: Buffer,
  size: number,
  background: { r: number; g: number; b: number; alpha: number },
): Promise<Buffer> {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: png, gravity: 'center' }])
    .png()
    .toBuffer()
}

function isNearWhite(data: Buffer, index: number): boolean {
  return data[index] > 245 && data[index + 1] > 245 && data[index + 2] > 245
}

function knockOutWhiteBackground(data: Buffer, width: number, height: number): void {
  const visited = new Uint8Array(width * height)
  const queue: number[] = []

  const enqueue = (x: number, y: number) => {
    const pixel = y * width + x
    const index = pixel * 4
    if (visited[pixel] || !isNearWhite(data, index)) {
      return
    }
    visited[pixel] = 1
    queue.push(pixel)
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  while (queue.length > 0) {
    const pixel = queue.pop()!
    const x = pixel % width
    const y = Math.floor(pixel / width)
    data[pixel * 4 + 3] = 0

    if (x > 0) {
      enqueue(x - 1, y)
    }
    if (x + 1 < width) {
      enqueue(x + 1, y)
    }
    if (y > 0) {
      enqueue(x, y - 1)
    }
    if (y + 1 < height) {
      enqueue(x, y + 1)
    }
  }
}

async function toTemplateIcon(png: Buffer, size: number): Promise<Buffer> {
  const { data, info } = await sharp(png)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // The source PNG is a white square. Flood-fill from the edges so only the
  // backdrop is removed and the white llama inside the D stays part of the
  // silhouette. macOS then tints that alpha as a template image.
  knockOutWhiteBackground(data, info.width, info.height)
  for (let index = 0; index < data.length; index += 4) {
    data[index] = 255
    data[index + 1] = 255
    data[index + 2] = 255
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer()
}

function runTauriIcon(source: string): void {
  const tauri = join(root, 'node_modules', '.bin', 'tauri')
  const cargoBin = join(homedir(), '.cargo', 'bin')
  const result = spawnSync(tauri, ['icon', source], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${cargoBin}:${process.env.PATH ?? ''}`,
    },
  })

  if (result.status !== 0) {
    throw new Error('tauri icon failed')
  }
}

async function generate(): Promise<void> {
  const svg = readFileSync(svgPath)
  const inner = Math.round(APP_SIZE * (1 - MARGIN * 2))

  mkdirSync(iconsDir, { recursive: true })

  const appSource = await padToSquare(rasterize(svg, inner), APP_SIZE, APP_BACKGROUND)
  writeFileSync(appIconPath, appSource)
  runTauriIcon(appIconPath)

  const tray = await toTemplateIcon(readFileSync(traySourcePath), TRAY_SIZE)
  writeFileSync(trayIconPath, tray)
}

await generate()
