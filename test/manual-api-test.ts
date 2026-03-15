#!/usr/bin/env bun
import { runDownloadMode } from '../src/tts.js';
import { loadConfig, CONFIG_PATH, readConfigFile } from '../src/config.js';

async function main() {
  console.log('=== Config Loading Debug ===');
  console.log('CONFIG_PATH:', CONFIG_PATH);

  const file = Bun.file(CONFIG_PATH);
  console.log('Config file exists:', file.exists());

  if (file.exists()) {
    const rawContent = await file.text();
    console.log('Raw config file content:');
    console.log(rawContent);
  }

  const fileConfig = await readConfigFile();
  console.log('Parsed file config:', JSON.stringify(fileConfig, null, 2));

  const config = await loadConfig();
  console.log('Final merged config.api:', JSON.stringify(config.api, null, 2));
  console.log('Final merged config.tts:', JSON.stringify(config.tts, null, 2));

  console.log('\n=== Testing with real API ===');
  const inputFile = 'test/fixtures/test-tts.md';
  console.log('Input:', inputFile);
  console.log('API:', config.api.app_id);
  console.log('Voice:', config.tts.voice);

  try {
    await runDownloadMode(inputFile, config);
    console.log('\n✓ Test successful!');
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

void main();
