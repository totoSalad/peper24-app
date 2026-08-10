const preferredAmericanFemaleVoices = [
  'Google US English',
  'Microsoft Aria Online',
  'Microsoft Jenny Online',
  'Microsoft Zira',
  'Samantha',
  'Ava',
  'Allison',
  'Susan',
]

function chooseEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const preferredNames = preferredAmericanFemaleVoices.map((name) => name.toLocaleLowerCase())
  return (
    voices.find((voice) => preferredNames.includes(voice.name.toLocaleLowerCase())) ??
    voices.find((voice) => voice.lang.toLocaleLowerCase() === 'en-us') ??
    voices.find((voice) => voice.lang.toLocaleLowerCase().startsWith('en'))
  )
}

export function createEnglishUtterance(text: string): SpeechSynthesisUtterance {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    throw new Error('SPEECH_SYNTHESIS_UNSUPPORTED')
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  const voice = chooseEnglishVoice(window.speechSynthesis.getVoices())
  if (voice) utterance.voice = voice
  return utterance
}
