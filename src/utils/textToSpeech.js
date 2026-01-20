/**
 * Text-to-Speech using ElevenLabs API
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// ===== GIỌNG TIẾNG VIỆT NATIVE =====
// Sử dụng giọng từ Voice Library của ElevenLabs
// 
// GIỌNG NAM VIỆT NAM:
// - "3VnrjnYrskPMDsapTr8X" - DangTungDuy 2 ⭐ (Nam, 30s, Central Vietnam)
//   → Giọng sâu, ấm áp, phù hợp cho giao tiếp, giáo dục, storytelling
//   → 45.6K users, 231.3M credits - Rất phổ biến!
//
// - "Nathan" - Central Vietnam Accent (giọng nam miền Trung)
// - "Quan" - Central Vietnam (giọng nam ấm áp)
// - "DS Nam" - Vietnam Young Man (giọng nam trẻ)
//
// GIỌNG NỮ VIỆT NAM:
// - "Bé Hồng Ân" - Southern Vietnam (giọng nữ miền Nam)
// - "Lê Thanh Sang" - Western Vietnam (giọng nữ miền Tây)
// - "Hoa mùa xuân" - Southern Vietnam (giọng nữ miền Nam)
// - "Vinh" - Warm & Smooth (giọng nữ ấm áp)
//
// Link Voice Library: https://elevenlabs.io/app/voice-library

const VOICE_ID = "3VnrjnYrskPMDsapTr8X"; // DangTungDuy 2 - Giọng nam Việt Nam native ⭐

let currentAudio = null;

/**
 * Convert text to speech and play it
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - Optional voice ID (default: Rachel)
 */
export async function speakText(text, voiceId = VOICE_ID) {
  try {
    // Stop any currently playing audio
    stopSpeaking();

    if (!ELEVENLABS_API_KEY) {
      console.warn('⚠️ ELEVENLABS_API_KEY not found. Text-to-speech disabled.');
      return;
    }

    // 🔍 DEBUG: Log thông tin request
    console.log('🔊 Converting text to speech...');
    console.log('📝 Voice ID:', voiceId);
    console.log('📝 Voice Name: DangTungDuy 2 (Vietnamese)');
    console.log('📝 Text length:', text.length, 'characters');
    console.log('📝 Text preview:', text.substring(0, 100) + '...');
    console.log('📝 API Key:', ELEVENLABS_API_KEY ? '✅ Found' : '❌ Missing');

    // 🎯 QUAN TRỌNG: Voice này cần model phù hợp!
    // Preview đúng nhưng khi đọc text thì sai → Model không đúng
    // 
    // Thử các model theo thứ tự:
    // 1. 'eleven_turbo_v2_5' - Model mới nhất, tốt cho giọng custom
    // 2. 'eleven_turbo_v2' - Model nhanh, chất lượng cao
    // 3. 'eleven_multilingual_v2' - Model multilingual (có thể không tốt cho voice này)
    
    const requestBody = {
      text: text,
      model_id: 'eleven_turbo_v2_5', // 🔥 Thử model mới nhất trước
      voice_settings: {
        stability: 0.5,              // Giữ nguyên
        similarity_boost: 0.75,      // Tăng lên để giống giọng gốc hơn
        style: 0,                    // Không thêm style
        use_speaker_boost: true      // Tăng âm lượng
      },
    };

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    console.log('📤 API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Response status:', response.status, response.statusText);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    currentAudio = new Audio(audioUrl);
    
    // Try to play audio, catch SecurityError
    try {
      await currentAudio.play();
      console.log('✅ Playing audio...');
    } catch (playError) {
      if (playError.name === 'NotAllowedError' || playError.name === 'SecurityError') {
        console.warn('⚠️ Audio autoplay blocked. User interaction required.');
        console.log('💡 Try clicking on the page first, then click the artwork again.');
      } else {
        console.error('❌ Audio play error:', playError);
      }
    }

    // Clean up when audio finishes
    currentAudio.addEventListener('ended', () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
    });

    return currentAudio;
  } catch (error) {
    console.error('❌ Text-to-speech error:', error);
    return null;
  }
}

/**
 * Stop currently playing speech
 */
export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
    console.log('⏹️ Stopped speaking');
  }
}

/**
 * Check if speech is currently playing
 */
export function isSpeaking() {
  return currentAudio !== null && !currentAudio.paused;
}

/**
 * 🔍 DEBUG: List all available voices from ElevenLabs
 * Call this in console: import { listAvailableVoices } from './utils/textToSpeech'
 */
export async function listAvailableVoices() {
  try {
    if (!ELEVENLABS_API_KEY) {
      console.warn('⚠️ ELEVENLABS_API_KEY not found.');
      return;
    }

    console.log('🔍 Fetching available voices...');

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📋 Total voices:', data.voices.length);
    
    // Filter Vietnamese voices
    const vietnameseVoices = data.voices.filter(voice => {
      const name = voice.name.toLowerCase();
      const labels = voice.labels || {};
      return name.includes('viet') || 
             name.includes('vietnam') || 
             labels.accent?.toLowerCase().includes('vietnam') ||
             labels.language?.toLowerCase().includes('vietnam');
    });

    console.log('\n🇻🇳 Vietnamese Voices Found:', vietnameseVoices.length);
    console.log('='.repeat(80));
    
    if (vietnameseVoices.length === 0) {
      console.warn('⚠️ No Vietnamese voices found!');
      console.log('💡 Solutions:');
      console.log('   1. Search "vietnam" on: https://elevenlabs.io/app/voice-library');
      console.log('   2. Add voices to your library');
      console.log('   3. Or use Voice Cloning to create Vietnamese voice');
    } else {
      vietnameseVoices.forEach((voice, index) => {
        const isCurrent = voice.voice_id === VOICE_ID;
        console.log(`\n${index + 1}. ${voice.name} ${isCurrent ? '⭐ (CURRENT)' : ''}`);
        console.log(`   Voice ID: ${voice.voice_id}`);
        console.log(`   Category: ${voice.category || 'N/A'}`);
        console.log(`   Labels:`, voice.labels);
        if (voice.preview_url) {
          console.log(`   Preview: ${voice.preview_url}`);
        }
        
        // Show how to use this voice
        if (!isCurrent) {
          console.log(`   💡 To use: Change VOICE_ID to "${voice.voice_id}"`);
        }
      });

      console.log('\n' + '='.repeat(80));
      console.log('📝 Current Voice ID:', VOICE_ID);
      console.log('💡 To change voice:');
      console.log('   1. Copy Voice ID from above');
      console.log('   2. Open: src/utils/textToSpeech.js');
      console.log('   3. Change: const VOICE_ID = "YOUR_VOICE_ID"');
      console.log('   4. Refresh page');
    }
    
    return vietnameseVoices;
  } catch (error) {
    console.error('❌ Error fetching voices:', error);
    return null;
  }
}

/**
 * 🧪 TEST: Quick test a voice with Vietnamese text
 */
export async function testVietnameseVoice(voiceId, modelId = 'eleven_multilingual_v2') {
  const testText = "Xin chào, đây là giọng đọc tiếng Việt. Tôi đang test để tìm giọng đọc tự nhiên nhất cho dự án bảo tàng ảo về tư tưởng Hồ Chí Minh.";
  
  console.log(`🧪 Testing voice: ${voiceId}`);
  console.log(`📝 Model: ${modelId}`);
  console.log(`📝 Text: ${testText}`);
  
  try {
    await speakText(testText, voiceId);
    console.log('✅ Test completed! Listen to the audio.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * 🔍 DEBUG: Get detailed info about a specific voice
 */
export async function getVoiceInfo(voiceId) {
  try {
    if (!ELEVENLABS_API_KEY) {
      console.warn('⚠️ ELEVENLABS_API_KEY not found.');
      return;
    }

    console.log(`🔍 Fetching info for voice: ${voiceId}`);

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, errorText);
      return null;
    }

    const voiceData = await response.json();
    console.log('\n📋 Voice Details:');
    console.log('='.repeat(80));
    console.log('Name:', voiceData.name);
    console.log('Voice ID:', voiceData.voice_id);
    console.log('Category:', voiceData.category);
    console.log('Labels:', voiceData.labels);
    console.log('Settings:', voiceData.settings);
    console.log('Available Models:', voiceData.available_for_tiers);
    console.log('High Quality Base Model ID:', voiceData.high_quality_base_model_ids);
    console.log('='.repeat(80));
    
    return voiceData;
  } catch (error) {
    console.error('❌ Error fetching voice info:', error);
    return null;
  }
}

// 🔍 Auto-run on load to check voices (comment out in production)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // Expose to window for easy debugging
  window.listElevenLabsVoices = listAvailableVoices;
  window.getVoiceInfo = getVoiceInfo;
  window.testVietnameseVoice = testVietnameseVoice;
  
  console.log('💡 Debug Commands:');
  console.log('   window.listElevenLabsVoices() - List all Vietnamese voices');
  console.log('   window.getVoiceInfo("VOICE_ID") - Get voice details');
  console.log('   window.testVietnameseVoice("VOICE_ID") - Test a voice with Vietnamese text');
  
  // 🔥 AUTO-RUN: List Vietnamese voices on load
  setTimeout(() => {
    console.log('\n🔍 AUTO-CHECKING Vietnamese voices...\n');
    listAvailableVoices().then(voices => {
      if (voices && voices.length > 0) {
        console.log('\n✅ Found Vietnamese voices! Copy Voice ID from above and paste into textToSpeech.js');
        console.log('📝 Current Voice ID:', VOICE_ID);
      } else {
        console.warn('⚠️ No Vietnamese voices found in your account.');
        console.log('💡 Try searching "vietnam" on: https://elevenlabs.io/app/voice-library');
      }
    });
  }, 2000); // Wait 2s for page to load
}
