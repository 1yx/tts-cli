import { spawn, type Subprocess } from 'child_process'

export interface SpawnFfplayOptions {
  sampleRate?: number
}

export function spawnFfplay(sampleRate: number = 24000): Subprocess {
  return spawn('ffplay', [
    '-f', 's16le',
    '-ar', String(sampleRate),
    '-ac', '1',
    '-nodisp',
    '-autoexit',
    '-',
  ], {
    stdio: ['pipe', 'ignore', 'ignore'],
  })
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

    ffmpeg.stdin.write(pcm)
    ffmpeg.stdin.end()

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
  })
}
