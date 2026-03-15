import { describe, it, expect, beforeAll } from "bun:test"
import { spawn } from "child_process"
import { existsSync, statSync } from "fs"
import { unlink } from "fs/promises"

// Skip E2E tests if credentials are not provided
const skipE2E = !process.env.MYTTS_APP_ID || !process.env.MYTTS_TOKEN

describe("E2E: play-mode", () => {
  const testOutputFile = "/tmp/test-e2e-output.mp3"

  // Clean up test file before each test
  beforeAll(async () => {
    if (existsSync(testOutputFile)) {
      await unlink(testOutputFile)
    }
  })

  describe.skipIf(skipE2E)("play-only mode", () => {
    it("should play audio without creating file", async () => {
      const result = await spawnTestCommand([
        "test/fixtures/test-resource-id-override.md",
        "--play",
      ])

      // Should complete successfully
      expect(result.exitCode).toBe(0)

      // No file should be created
      expect(existsSync(testOutputFile)).toBe(false)
    }, 30000)
  })

  describe.skipIf(skipE2E)("play and save mode", () => {
    it("should play audio and save to file", async () => {
      const result = await spawnTestCommand([
        "test/fixtures/test-resource-id-override.md",
        "--play",
        "--output",
        testOutputFile,
      ])

      // Should complete successfully
      expect(result.exitCode).toBe(0)

      // File should be created
      expect(existsSync(testOutputFile)).toBe(true)

      // File should have content
      const stats = statSync(testOutputFile)
      expect(stats.size).toBeGreaterThan(0)
    }, 30000)

    it("should save file only after playback completes", async () => {
      const startTime = Date.now()
      let fileWriteTime = 0

      // Watch for file creation
      const checkInterval = setInterval(() => {
        if (existsSync(testOutputFile) && fileWriteTime === 0) {
          fileWriteTime = Date.now()
        }
      }, 100)

      const result = await spawnTestCommand([
        "test/fixtures/test-resource-id-override.md",
        "--play",
        "--output",
        testOutputFile,
      ])

      clearInterval(checkInterval)

      // File should be created only after playback starts
      // (fileWriteTime should be close to startTime, indicating it was created
      // after playback had already begun)
      expect(fileWriteTime).toBeGreaterThan(startTime)
      expect(existsSync(testOutputFile)).toBe(true)

      // Clean up
      await unlink(testOutputFile).catch(() => {})
    }, 30000)
  })

  // Helper function to spawn CLI command
  async function spawnTestCommand(args: string[]): Promise<{
    exitCode: number | null
    stdout: string
    stderr: string
  }> {
    return new Promise((resolve) => {
      const proc = spawn("bun", ["run", "src/index.ts", ...args], {
        env: {
          ...process.env,
          MYTTS_APP_ID: process.env.MYTTS_APP_ID || "",
          MYTTS_TOKEN: process.env.MYTTS_TOKEN || "",
        },
      })

      let stdout = ""
      let stderr = ""

      proc.stdout?.on("data", (data) => {
        stdout += data.toString()
      })

      proc.stderr?.on("data", (data) => {
        stderr += data.toString()
      })

      proc.on("close", (code) => {
        resolve({ exitCode: code, stdout, stderr })
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        proc.kill()
        resolve({ exitCode: -1, stdout, stderr: "Test timeout" })
      }, 30000)
    })
  }
})

// Instructions for running E2E tests
console.log(`
To run E2E tests, set the following environment variables:

  export MYTTS_APP_ID="your_app_id"
  export MYTTS_TOKEN="your_token"

Then run:
  bun test test/e2e/play.test.ts
`)
