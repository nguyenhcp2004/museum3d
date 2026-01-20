/**
 * 🧪 Test tất cả models với giọng Việt
 * Copy code này vào Console để test
 */

const VOICE_ID = "3VnrjnYrskPMDsapTr8X";
const API_KEY = "YOUR_API_KEY"; // Thay bằng API key của bạn
const TEST_TEXT = "Xin chào, đây là giọng đọc tiếng Việt. Chủ tịch Hồ Chí Minh là người sáng lập Đảng Cộng sản Việt Nam.";

const MODELS = [
  'eleven_multilingual_v2',
  'eleven_turbo_v2',
  'eleven_turbo_v2_5',
  'eleven_flash_v2',
  'eleven_flash_v2_5'
];

async function testModel(modelId, index) {
  console.log(`\n🧪 Test ${index + 1}/${MODELS.length}: ${modelId}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY,
        },
        body: JSON.stringify({
          text: TEST_TEXT,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0,
            use_speaker_boost: true
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${modelId} - Error:`, response.status, errorText);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    console.log(`✅ ${modelId} - Playing audio...`);
    console.log('   Listen carefully and compare!');
    
    await audio.play();
    
    // Wait for audio to finish
    await new Promise(resolve => {
      audio.addEventListener('ended', resolve);
    });
    
    console.log(`✅ ${modelId} - Finished`);
    
  } catch (error) {
    console.error(`❌ ${modelId} - Error:`, error);
  }
}

async function testAllModels() {
  console.log('🎯 Testing all models with Vietnamese voice');
  console.log('Voice ID:', VOICE_ID);
  console.log('Text:', TEST_TEXT);
  console.log('\n⏳ Please wait and listen to each model...\n');
  
  for (let i = 0; i < MODELS.length; i++) {
    await testModel(MODELS[i], i);
    
    // Wait 2 seconds between tests
    if (i < MODELS.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n✅ All tests completed!');
  console.log('💡 Which model sounded best? Update textToSpeech.js with that model_id');
}

// Export for use
window.testAllModels = testAllModels;

console.log('💡 Run: window.testAllModels()');
console.log('   This will test all 5 models and play audio for each');
console.log('   Listen carefully and choose the best one!');
