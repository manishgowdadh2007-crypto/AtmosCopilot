export const VOICE_PROFILES = [
  {
    id: 'in-female',
    name: 'Indian English (Female)',
    langCode: 'en-IN',
    gender: 'female',
    sample: 'Greetings Operator. Sun Copilot Indian feminine meteorological core online.'
  },
  {
    id: 'in-male',
    name: 'Indian English (Male)',
    langCode: 'en-IN',
    gender: 'male',
    sample: 'Greetings Operator. Sun Copilot Indian tactical synoptic core reporting.'
  },
  {
    id: 'us-female',
    name: 'American English (Female)',
    langCode: 'en-US',
    gender: 'female',
    sample: 'Hello Operator. Sun Copilot US standard intelligence active and tracking.'
  },
  {
    id: 'us-male',
    name: 'American English (Male)',
    langCode: 'en-US',
    gender: 'male',
    sample: 'Hello Operator. Sun Copilot American deep acoustic feed initialized.'
  }
];

export const getSystemVoices = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
};

export const resolveVoiceUtterance = (text, profileId) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  window.speechSynthesis.cancel();
  const clean = text.replace(/[*#_`]/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();

  const profile = VOICE_PROFILES.find((p) => p.id === profileId) || VOICE_PROFILES[0];
  const matchingVoices = voices.filter((v) => v.lang.replace('_', '-').includes(profile.langCode));

  let matchedVoice = null;
  if (profile.gender === 'female') {
    matchedVoice = matchingVoices.find((v) => 
      /female|zira|samantha|victoria|karen|veena|heera|neerja|google.*hindi/i.test(v.name)
    );
  } else {
    matchedVoice = matchingVoices.find((v) => 
      /male|david|george|mark|ravi|google.*india.*male/i.test(v.name) &&
      !/female|zira|samantha/i.test(v.name)
    );
  }

  utterance.voice = matchedVoice || matchingVoices[0] || voices[0] || null;

  // Modulate pitch and rate for crisp persona acoustics
  if (profile.gender === 'female') {
    utterance.pitch = profile.id === 'in-female' ? 1.05 : 1.0;
  } else {
    utterance.pitch = profile.id === 'in-male' ? 0.92 : 0.88;
  }
  utterance.rate = 1.0;

  return utterance;
};

export const playAudioSample = (profileId, onStart, onEnd) => {
  const profile = VOICE_PROFILES.find((p) => p.id === profileId) || VOICE_PROFILES[0];
  const utterance = resolveVoiceUtterance(profile.sample, profileId);
  if (!utterance) return;

  if (onStart) utterance.onstart = onStart;
  utterance.onend = () => { if (onEnd) onEnd(); };
  utterance.onerror = () => { if (onEnd) onEnd(); };

  window.speechSynthesis.speak(utterance);
};
