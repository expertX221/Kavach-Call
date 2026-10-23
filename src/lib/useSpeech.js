import { useEffect, useRef, useState } from "react";

export function useSpeech(onText) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const instance = useRef(null);
  const callback = useRef(onText);
  callback.current = onText;
  const supported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  function stop() {
    const r = instance.current;
    instance.current = null;
    if (r) r.abort();
    setStatus("idle");
  }
  function start(lang, localOnly) {
    stop();
    setError("");
    const Constructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) {
      setError(
        "Speech recognition is unavailable in this browser. You can still paste or type a transcript.",
      );
      return;
    }
    const r = new Constructor();
    if (localOnly && !("processLocally" in r)) {
      setError(
        "This browser does not expose on-device recognition. Use typed text, or explicitly choose browser-provider recognition.",
      );
      return;
    }
    if (localOnly) r.processLocally = true;
    r.lang = lang;
    r.continuous = true;
    r.interimResults = false;
    instance.current = r;
    r.onstart = () => {
      if (instance.current === r) setStatus("listening");
    };
    r.onresult = (e) => {
      if (instance.current !== r) return;
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal)
          callback.current(
            e.results[i][0].transcript,
            e.results[i][0].confidence || 0.5,
          );
    };
    r.onerror = (e) => {
      if (instance.current !== r) return;
      setError(
        {
          "not-allowed":
            "Microphone access was denied. Use a typed transcript or change your browser permissions.",
          network:
            "Recognition service is unavailable. Typed analysis still works offline.",
          "no-speech":
            "No speech was recognized. Move closer to the speaker or try typed text.",
          "language-not-supported":
            "The selected language or local language pack is unavailable. Try typed text.",
        }[e.error] || "Recognition stopped. Try again or use typed text.",
      );
      setStatus("idle");
    };
    r.onend = () => {
      if (instance.current === r) {
        instance.current = null;
        setStatus("idle");
      }
    };
    try {
      setStatus("starting");
      r.start();
    } catch {
      instance.current = null;
      setStatus("idle");
      setError("Could not start recognition. Try typed text instead.");
    }
  }
  useEffect(
    () => () => {
      instance.current?.abort();
      instance.current = null;
    },
    [],
  );
  return { status, error, supported, start, stop };
}
