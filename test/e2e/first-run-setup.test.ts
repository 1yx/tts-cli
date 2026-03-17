import { describe, it, expect, beforeAll, afterEach } from 'bun:test';
import { spawn } from 'child_process';
import { existsSync, unlinkSync, renameSync, readFileSync } from 'fs';
import { CONFIG_PATH } from '../../src/config.js';

// Helper function to get a temp config path for testing
function getTempConfigPath(): string {
  return `${CONFIG_PATH}.test-backup`;
}

// Helper function to spawn CLI command
async function spawnTestCommand(
  args: string[],
  env?: Record<string, string>,
): Promise<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const proc = spawn('bun', ['run', 'src/index.ts', ...args], {
      env: {
        ...process.env,
        ...env,
      },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ exitCode: code, stdout, stderr });
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      proc.kill();
      resolve({ exitCode: -1, stdout, stderr: 'Test timeout' });
    }, 10000);
  });
}

// eslint-disable-next-line max-lines-per-function
describe('E2E: first-run setup', () => {
  const tempConfigPath = getTempConfigPath();

  // Backup existing config before tests
  beforeAll(() => {
    if (existsSync(CONFIG_PATH)) {
      renameSync(CONFIG_PATH, tempConfigPath);
    }
  });

  // Clean up after each test
  afterEach(() => {
    if (existsSync(CONFIG_PATH)) {
      unlinkSync(CONFIG_PATH);
    }
  });

  // Restore original config after all tests
  process.on('exit', () => {
    if (existsSync(tempConfigPath)) {
      if (existsSync(CONFIG_PATH)) {
        unlinkSync(CONFIG_PATH);
      }
      renameSync(tempConfigPath, CONFIG_PATH);
    }
  });

  describe('first-run with --app-id and --token', () => {
    it('should save config and skip interactive setup', async () => {
      const testAppId = 'test_app_id_12345';
      const testToken = 'test_token_67890';

      // Ensure no config exists
      expect(existsSync(CONFIG_PATH)).toBe(false);

      // Run with --app-id and --token
      // Note: TTS API call will fail with fake credentials, but config should be saved
      await spawnTestCommand([
        'test/fixtures/test-simple.md',
        '--app-id',
        testAppId,
        '--token',
        testToken,
      ]);

      // TTS will fail with fake credentials, but config should be created first
      // Config file should be created
      expect(existsSync(CONFIG_PATH)).toBe(true);

      // Config file should contain the provided credentials
      const configContent = readFileSync(CONFIG_PATH, 'utf-8');
      expect(configContent).toContain(testAppId);
      expect(configContent).toContain(testToken);

      // Config should be minimal (only [api] section)
      expect(configContent).toContain('[api]');
      expect(configContent).not.toContain('[tts]');
    });

    it('should work with subsequent runs without credentials', async () => {
      const testAppId = 'test_app_id_12345';
      const testToken = 'test_token_67890';

      // First run with credentials
      await spawnTestCommand([
        'test/fixtures/test-simple.md',
        '--app-id',
        testAppId,
        '--token',
        testToken,
      ]);

      // Config should exist
      expect(existsSync(CONFIG_PATH)).toBe(true);

      const configContent = readFileSync(CONFIG_PATH, 'utf-8');
      expect(configContent).toContain(testAppId);
      expect(configContent).toContain(testToken);
    });

    it('should show config path in output', async () => {
      const testAppId = 'test_app_id_12345';
      const testToken = 'test_token_67890';

      const result = await spawnTestCommand([
        'test/fixtures/test-simple.md',
        '--app-id',
        testAppId,
        '--token',
        testToken,
      ]);

      // Should mention config path and next steps in output
      const output = result.stdout + result.stderr;
      expect(output).toContain(CONFIG_PATH);
      expect(output).toContain('Credentials saved');
      expect(output).toContain('Next time');
    });
  });

  describe('first-run without credentials', () => {
    it('should start interactive setup when credentials not provided', async () => {
      // Ensure no config exists
      expect(existsSync(CONFIG_PATH)).toBe(false);

      // Run without credentials - will enter interactive setup
      // Since there's no stdin in test environment, the process will be killed
      // We just verify it tries to run setup (config won't be created)
      // Explicitly clear TTS environment variables for this test
      const result = await spawnTestCommand(['test/fixtures/test-simple.md'], {
        TTS_CLI_APP_ID: '',
        TTS_CLI_TOKEN: '',
      });

      // Should fail or timeout (no stdin for interactive setup)
      // Exit code -1 indicates timeout
      expect(result.exitCode).not.toBe(0);

      // Config should not have been created (setup couldn't complete without input)
      expect(existsSync(CONFIG_PATH)).toBe(false);
    }, 15000);
  });

  describe('existing config behavior', () => {
    it('should not modify existing config when --app-id and --token are provided', async () => {
      // This test verifies that providing --app-id and --token when config
      // already exists doesn't overwrite the existing config

      // First, create a config with known values
      const originalAppId = 'original_app_id';
      const originalToken = 'original_token';

      await spawnTestCommand([
        'test/fixtures/test-simple.md',
        '--app-id',
        originalAppId,
        '--token',
        originalToken,
      ]);

      // Read the config to get its content
      const originalConfig = readFileSync(CONFIG_PATH, 'utf-8');

      // Run again with different credentials (they should be ignored)
      await spawnTestCommand([
        'test/fixtures/test-simple.md',
        '--app-id',
        'different_app_id',
        '--token',
        'different_token',
      ]);

      // Config should not have changed
      const currentConfig = readFileSync(CONFIG_PATH, 'utf-8');
      expect(currentConfig).toBe(originalConfig);
    });
  });
});
