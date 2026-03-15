import { describe, it, expect } from "bun:test"
import { spawnFfplay } from "../../src/utils.js"
import { existsSync, unlinkSync } from "fs"

describe("utils - spawnFfplay", () => {
  it("should spawn ffplay process with valid PID", () => {
    const player = spawnFfplay(24000)

    expect(player).toBeDefined()
    expect(player.pid).toBeDefined()
    expect(player.pid).toBeGreaterThan(0)

    // Clean up immediately
    player.kill()
  })

  it("should provide writable stdin for streaming", () => {
    const player = spawnFfplay(24000)

    expect(player.stdin).toBeDefined()
    expect(player.stdin?.writable).toBe(true)

    // Clean up
    player.kill()
  })

  it("should spawn with different sample rates", () => {
    const rates = [8000, 16000, 24000, 48000]

    for (const rate of rates) {
      const player = spawnFfplay(rate)
      expect(player.pid).toBeGreaterThan(0)
      player.kill()
    }
  })
})

describe("utils - convertPCMtoMP3", () => {
  const testOutputFile = "/tmp/test-utils-pcm.mp3"

  // Clean up before tests
  it("should clean up any existing test file", () => {
    if (existsSync(testOutputFile)) {
      unlinkSync(testOutputFile)
    }
    expect(existsSync(testOutputFile)).toBe(false)
  })

  it("should convert silence PCM to valid MP3", async () => {
    const { convertPCMtoMP3 } = await import("../../src/utils.js")

    // Create 0.5 seconds of silence at 24000 Hz
    const sampleRate = 24000
    const numSamples = sampleRate * 0.5
    const pcm = Buffer.alloc(numSamples * 2, 0) // 16-bit = 2 bytes per sample

    await convertPCMtoMP3(pcm, testOutputFile, sampleRate)

    // Verify output file exists and has content
    expect(existsSync(testOutputFile)).toBe(true)

    const { statSync } = await import("fs")
    const stats = statSync(testOutputFile)
    expect(stats.size).toBeGreaterThan(0)
  })

  it("should handle different sample rates", async () => {
    const { convertPCMtoMP3 } = await import("../../src/utils.js")

    const rates = [8000, 16000, 48000]

    for (const rate of rates) {
      const outputFile = `/tmp/test-rate-${rate}.mp3`
      const numSamples = rate * 0.1 // 0.1 second
      const pcm = Buffer.alloc(numSamples * 2, 0)

      await convertPCMtoMP3(pcm, outputFile, rate)

      expect(existsSync(outputFile)).toBe(true)
      unlinkSync(outputFile)
    }
  })

  // Clean up after tests
  it("should clean up test file", () => {
    if (existsSync(testOutputFile)) {
      unlinkSync(testOutputFile)
    }
    expect(existsSync(testOutputFile)).toBe(false)
  })
})
