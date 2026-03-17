// Test with enable_subtitle to get timestamp/words info
const text = '你好世界。这是一个测试。';

const response = await fetch('https://openspeech.bytedance.com/api/v3/tts/unidirectional', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-App-Id': '3170982985',
    'X-Api-Access-Key': 'hSUxhFawSF-p3GQEYJGTPSBINJfgZQwM',
    'X-Api-Resource-Id': 'seed-tts-2.0',
  },
  body: JSON.stringify({
    user: { uid: 'tts-cli' },
    req_params: {
      text: text,
      speaker: 'zh_female_vv_uranus_bigtts',
      audio_params: {
        format: 'mp3',
        sample_rate: 24000,
        speech_rate: 0,
        loudness_rate: 0,
        enable_subtitle: true, // Enable subtitle/timestamp!
      },
    },
  }),
});

console.log('Status:', response.status);
console.log('Text:', text, `(${text.length} chars)`);
console.log('\n=== With enable_subtitle=true ===\n');

if (!response.body) {
  console.log('No body');
  process.exit(1);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();
let lineNum = 0;
let totalSentenceChars = 0;
let totalWordChars = 0;
const allSentences: any[] = [];

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    lineNum++;

    try {
      const json = JSON.parse(line);

      if (json.sentence) {
        const sentenceText = json.sentence.text || '';
        const words = json.sentence.words || [];
        totalSentenceChars += sentenceText.length;

        let wordText = '';
        if (words.length > 0) {
          wordText = words.map((w: any) => w.word).join('');
          totalWordChars += wordText.length;
        }

        allSentences.push({
          text: sentenceText,
          wordCount: words.length,
          wordText,
          wordTextLen: wordText.length,
        });

        console.log(`[Line ${lineNum}] SENTENCE`);
        console.log(`  text: "${sentenceText}" (${sentenceText.length} chars)`);
        console.log(`  words: ${words.length} items`);
        if (words.length > 0) {
          console.log(`  words joined: "${wordText}" (${wordText.length} chars)`);
          console.log(`  first 3 words:`, JSON.stringify(words.slice(0, 3), null, 2));
        }
        console.log(`  totals: sentence=${totalSentenceChars}, words=${totalWordChars}`);
        console.log();
      }

      if (json.code === 20000000) {
        console.log('=== END ===');
        console.log(`Total sentences: ${allSentences.length}`);
        allSentences.forEach((s, i) => {
          console.log(
            `  ${i + 1}. text="${s.text}" (${s.text.length}), words=${s.wordCount}, wordTextLen=${s.wordTextLen}`,
          );
        });
        console.log(`\nTotal sentence chars: ${totalSentenceChars}`);
        console.log(`Total word chars: ${totalWordChars}`);
        console.log(`Original text: ${text.length} chars`);
        console.log(`Sentence match: ${totalSentenceChars === text.length ? '✓' : '✗'}`);
        console.log(`Word match: ${totalWordChars === text.length ? '✓' : '✗'}`);
        process.exit(0);
      }
    } catch {}
  }
}
