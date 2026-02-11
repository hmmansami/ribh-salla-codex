"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-provider";

type ValidationResponse = {
  allowed: boolean;
  violations: string[];
  requiredFixes: string[];
};

export default function CompliancePage() {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const [channel, setChannel] = useState<"email" | "sms" | "whatsapp">("sms");
  const [messageType, setMessageType] = useState<"marketing" | "transactional">("marketing");
  const [consentState, setConsentState] = useState("opted_out");
  const [sendWindow, setSendWindow] = useState("00:30");
  const [result, setResult] = useState<ValidationResponse | null>(null);

  async function validate() {
    const res = await fetch("/api/compliance/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        region: "SA",
        messageType,
        consentState,
        sendWindow
      })
    });

    const data = await res.json();
    setResult(data);
  }

  return (
    <>
      <section className="hero">
        <h1>{isAr ? "لوحة الامتثال" : "Compliance"}</h1>
        <p>
          {isAr
            ? "تحقق قبل الإرسال من الموافقات، الوقت المسموح، ونوع الرسالة."
            : "Validate consent, send windows, and message class before outbound delivery."}
        </p>
      </section>

      <section className="sectionCard">
        <h2>{isAr ? "تحقق السياسات" : "Policy Validation"}</h2>
        <div className="formGrid">
          <label>
            {isAr ? "القناة" : "Channel"}
            <select value={channel} onChange={(e) => setChannel(e.target.value as "email" | "sms" | "whatsapp")}> 
              <option value="email">email</option>
              <option value="sms">sms</option>
              <option value="whatsapp">whatsapp</option>
            </select>
          </label>

          <label>
            {isAr ? "نوع الرسالة" : "Message Type"}
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as "marketing" | "transactional")}
            >
              <option value="marketing">marketing</option>
              <option value="transactional">transactional</option>
            </select>
          </label>

          <label>
            {isAr ? "حالة الموافقة" : "Consent State"}
            <select value={consentState} onChange={(e) => setConsentState(e.target.value)}>
              <option value="opted_in">opted_in</option>
              <option value="opted_out">opted_out</option>
              <option value="unknown">unknown</option>
            </select>
          </label>

          <label>
            {isAr ? "وقت الإرسال" : "Send Time"}
            <input className="input" value={sendWindow} onChange={(e) => setSendWindow(e.target.value)} />
          </label>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={validate}>{isAr ? "تحقق" : "Validate"}</button>
        </div>
      </section>

      {result && (
        <section className="sectionCard">
          <h2>{isAr ? "النتيجة" : "Result"}</h2>
          <p className={result.allowed ? "badgeSuccess" : "badgeWarn"}>
            {result.allowed ? (isAr ? "مسموح" : "Allowed") : isAr ? "غير مسموح" : "Blocked"}
          </p>
          <h3>{isAr ? "المخالفات" : "Violations"}</h3>
          <ul>
            {result.violations.length === 0 && <li>{isAr ? "لا يوجد" : "None"}</li>}
            {result.violations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>{isAr ? "الإجراءات المطلوبة" : "Required Fixes"}</h3>
          <ul>
            {result.requiredFixes.length === 0 && <li>{isAr ? "لا يوجد" : "None"}</li>}
            {result.requiredFixes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
