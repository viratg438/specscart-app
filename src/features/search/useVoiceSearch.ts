import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type WebRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: {
    results: ArrayLike<{ 0?: { transcript?: string } }>;
  }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getWebSpeechCtor(): (new () => WebRecognition) | null {
  if (typeof globalThis === "undefined") {
    return null;
  }
  const speechGlobal = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => WebRecognition;
    webkitSpeechRecognition?: new () => WebRecognition;
  };
  return speechGlobal.SpeechRecognition ?? speechGlobal.webkitSpeechRecognition ?? null;
}

function transcriptFromWebResults(results: ArrayLike<{ 0?: { transcript?: string } }>) {
  return Array.from(results as ArrayLike<{ 0?: { transcript?: string } }>)
    .map((row) => row?.[0]?.transcript)
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * Web SpeechRecognition only — same settings as Mac/desktop search:
 * one utterance, final transcript, no live interim text.
 */
function runSpeechRecognition(
  recognitionRef: { current: WebRecognition | null },
  onResult: (text: string) => void,
  onEnd: () => void,
) {
  const SpeechRecognition = getWebSpeechCtor();

  if (!SpeechRecognition) {
    onEnd();
    return;
  }

  try {
    recognitionRef.current?.abort();
  } catch {
    // ignore
  }

  const recognition = new SpeechRecognition();
  recognitionRef.current = recognition;

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const text = transcriptFromWebResults(event.results);
    if (text) {
      onResult(text);
    } else {
      onEnd();
    }
  };

  recognition.onerror = () => {
    onEnd();
  };

  recognition.onend = () => {
    onEnd();
  };

  try {
    recognition.start();
  } catch {
    onEnd();
  }
}

export function useVoiceSearch(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<WebRecognition | null>(null);
  const nativeSubsRef = useRef<{ remove: () => void }[]>([]);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const clearNativeSubs = useCallback(() => {
    nativeSubsRef.current.forEach((sub) => sub.remove());
    nativeSubsRef.current = [];
  }, []);

  const applyVoiceText = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onTranscriptRef.current(trimmed);
  }, []);

  const finishListening = useCallback(() => {
    setListening(false);
    clearNativeSubs();
  }, [clearNativeSubs]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      try {
        const {
          ExpoSpeechRecognitionModule,
        } = require("expo-speech-recognition") as typeof import("expo-speech-recognition");
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // Expo Go may not include the native module.
      }
      nativeSubsRef.current.forEach((sub) => sub.remove());
      nativeSubsRef.current = [];
    };
  }, []);

  const startNative = useCallback(async () => {
    try {
      const {
        ExpoSpeechRecognitionModule,
      } = require("expo-speech-recognition") as typeof import("expo-speech-recognition");

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setListening(false);
        setError("Allow the microphone, then tap the mic again.");
        return;
      }

      clearNativeSubs();

      const resultSub = ExpoSpeechRecognitionModule.addListener("result", (event) => {
        if (!event.isFinal) {
          return;
        }
        const text = event.results
          .map((item) => item.transcript)
          .filter(Boolean)
          .join(" ")
          .trim();
        if (text) {
          setListening(false);
          applyVoiceText(text);
        }
      });
      const endSub = ExpoSpeechRecognitionModule.addListener("end", () => {
        finishListening();
      });
      const errorSub = ExpoSpeechRecognitionModule.addListener("error", () => {
        finishListening();
      });
      nativeSubsRef.current = [resultSub, endSub, errorSub];

      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: false,
        continuous: false,
        maxAlternatives: 1,
      });
    } catch {
      setListening(false);
      setError("Voice search needs a development build on this phone.");
    }
  }, [applyVoiceText, clearNativeSubs, finishListening]);

  const handleMicClick = useCallback(() => {
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      if (Platform.OS !== "web") {
        try {
          const {
            ExpoSpeechRecognitionModule,
          } = require("expo-speech-recognition") as typeof import("expo-speech-recognition");
          ExpoSpeechRecognitionModule.stop();
        } catch {
          // ignore
        }
      }
      setListening(false);
      return;
    }

    setError(null);
    setListening(true);

    if (Platform.OS === "web") {
      runSpeechRecognition(
        recognitionRef,
        (text) => {
          setListening(false);
          applyVoiceText(text);
        },
        () => {
          setListening(false);
        },
      );
      return;
    }

    void startNative();
  }, [applyVoiceText, listening, startNative]);

  return { listening, error, toggle: handleMicClick };
}
