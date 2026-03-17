#!/usr/bin/env bun
/**
 * Debug script to inspect raw API response for progress tracking
 */
import { buildHeaders, buildPayload } from '../src/tts.js';
import type { Config } from '../src/config.js';

const TTS_ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';

async function testAPI() {
  const config = {
    api: {
      app_id: '3170982985',
      token: 'hSUxhFawSF-p3GQEYJGTPSBINJfgZQwM',
    },
    tts: {
      voice: 'zh_female_tianmei',
      resource_id: 'seed-tts-2.0',
      speed: 0,
      volume: 0,
      sample_rate: 24000,
      bit_rate: 128000,
      format: 'mp3' as const,
      lang: 'zh-cn',
    },
  } satisfies Config;

  const text = '你好世界，这是一个测试。';

  console.log('=== API Request ===');
  console.log('Text:', text);
  console.log('Length:', text.length);

  const headers = buildHeaders(config);
  const payload = buildPayload({ text, config, format: 'mp3' });

  const response = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error('API Error:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('Error body:', errorText);
    process.exit(1);
  }

  if (!response.body) {
    console.error('No response body');
    process.exit(1);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let chunkIndex = 0;
  let totalProcessedChars = 0;

  console.log('\n=== API Response (raw chunks) ===\n');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;

      chunkIndex++;
      console.log(`\n[Raw Line ${chunkIndex}]`);
      console.log(`  Content: ${line.substring(0, 200)}${line.length > 200 ? '...' : ''}`);

      try {
        const json = JSON.parse(line);
        console.log(`  Parsed JSON keys: ${Object.keys(json).join(', ')}`);

        if (json.sentence) {
          const sentenceText = json.sentence.text || '';
          const words = json.sentence.words || [];

          totalProcessedChars += sentenceText.length;

          console.log(`  ┌─ sentence.text: "${sentenceText}" (${sentenceText.length} chars)`);
          console.log(`  ├─ words count: ${words.length}`);

          if (words.length > 0) {
            let wordCharCount = 0;
            console.log(`  ├─ words detail:`);
            words.forEach((w: { word: string }, i: number) => {
              const wordLen = w.word.length;
              wordCharCount += wordLen;
              console.log(`  │   [${i}] "${w.word}" (${wordLen})`);
            });
            console.log(`  └─ words total chars: ${wordCharCount}`);
          }

          console.log(`  → processedChars: ${totalProcessedChars}/${text.length}`);
        }

        if (json.code === 20000000) {
          console.log('\n' + '='.repeat(60));
          console.log('=== Summary ===');
          console.log(`Total chunks: ${chunkIndex}`);
          console.log(`Processed chars: ${totalProcessedChars}`);
          console.log(`Original length: ${text.length}`);
          console.log(`Match: ${totalProcessedChars === text.length ? '✓ YES' : '✗ NO'}`);
          console.log('='.repeat(60));
          return;
        }
      } catch (e) {
        console.log(`  (parse error: ${e})`);
      }
    }
  }
}

testAPI().catch(console.error);
