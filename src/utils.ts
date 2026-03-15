import { spawn, type Subprocess } from 'child_process'

export interface SpawnFfplayOptions {
  sampleRate?: number
}

export function spawnFfplay(sampleRate: number = 24000): Subprocess {
  const player = spawn('ffplay', [
    '-f', 's16le',
    '-ar', String(sampleRate),
    '-nodisp',
    '-autoexit',
    '-',
  ], {
    stdio: ['pipe', 'ignore', 'ignore'],
  })

  // Handle spawn errors
  player.on('error', (err) => {
    console.error('ffplay spawn error:', err)
  })

  return player
}

export async function convertPCMtoMP3(
  pcm: Buffer,
  outputPath: string,
  sampleRate: number
): Promise<void> {
  const ffmpeg = spawn('ffmpeg', [
    '-f', 's16le',
    '-ar', String(sampleRate),
    '-ac', '1',
    '-y',
    '-i', 'pipe:0',
    outputPath,
  ], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  return new Promise<void>((resolve, reject) => {
    let stderr = ''
    let stdout = ''

    ffmpeg.stdin.on('error', (err) => {
      reject(new Error(`ffmpeg stdin error: ${err.message}`))
    })

    // Write PCM data to stdin
    if (!ffmpeg.stdin.write(pcm)) {
      // If write returns false, wait for drain
      ffmpeg.stdin.once('drain', () => {
        ffmpeg.stdin.end()
      })
    } else {
      ffmpeg.stdin.end()
    }

    ffmpeg.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`ffmpeg failed (code ${code}): ${stderr}`))
      }
    })

    ffmpeg.on('error', (err) => {
      reject(new Error(`ffmpeg spawn error: ${err.message}`))
    })
  })
}
