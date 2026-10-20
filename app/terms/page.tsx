import Link from "next/link";
import { LegalLinks, NotMedicalAdvice } from "@/components/LegalNote";
import { NOT_MEDICAL_ADVICE, PHOTO_DEMO, PHOTO_LIVE } from "@/lib/copy";

const SECTIONS = [
  {
    title: "What this is",
    body: "Future You Mirror is a prototype. It shows a cosmetic reading of a photo, an aging picture, and general ideas for skin care and food. It is not a clinic.",
  },
  {
    title: "Not medical advice",
    body: `${NOT_MEDICAL_ADVICE} Do not use it to start, stop, or change medicine. If your skin hurts, spreads, scars, or worries you, see a doctor or a dermatologist.`,
  },
  {
    title: "Who it is for",
    body: "It is not for children. If you are under the age of digital consent where you live, use it with a parent. You can stop at any time.",
  },
  {
    title: "Photos",
    body: `${PHOTO_LIVE} The camera stays off until you tap it, after this consent. ${PHOTO_DEMO} Clearing this phone does not delete a photo Perfect Corp already has.`,
  },
  {
    title: "Suggestions",
    body: "Skin-care and food notes are education, with links to the sources. Named products are examples of a type. They are not endorsements, ads, or a shop. Nothing here is a checkout.",
  },
  {
    title: "Food notes",
    body: "Notes about blood sugar, milk, and inflammation are not a diet to follow and not a reason to feel bad about eating. Acne is not your fault. Talk with a doctor before a big food change.",
  },
  {
    title: "No accounts",
    body: "We do not ask you to sign in. We do not keep a photo library. A reading lives in this browser until you leave or clear it.",
  },
  {
    title: "As-is",
    body: "The mirror can fail, change, or be unavailable. Scores and pictures can be wrong. You use it at your own risk.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full" style={{ background: "#F8F5F0", color: "#2A2826" }}>
      <div className="max-w-md mx-auto px-6 pt-16 pb-24">
        <Link
          href="/"
          className="text-[14px] inline-block mb-8"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            color: "#A78B71",
            padding: "12px 0",
          }}
        >
          ← back
        </Link>

        <div
          className="text-[10px] uppercase"
          style={{ letterSpacing: "0.28em", color: "rgba(42,40,38,0.55)", fontStyle: "italic" }}
        >
          The terms
        </div>
        <h1
          className="mt-3"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 32,
            lineHeight: 1.1,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            textWrap: "pretty",
          }}
        >
          Plain terms,
          <br />
          <span style={{ color: "#A78B71", fontStyle: "italic" }}>before you begin.</span>
        </h1>
        <p
          className="mt-4"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 14,
            color: "#A78B71",
            lineHeight: 1.5,
          }}
        >
          By continuing, you agree to this page and the privacy ledger.
        </p>

        <div className="mt-8" style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />

        {SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="py-5">
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 400 }}>
                {section.title}
              </h2>
              <p
                className="mt-2"
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "rgba(42,40,38,0.7)",
                  textWrap: "pretty",
                }}
              >
                {section.body}
              </p>
            </div>
            <div style={{ height: 1, background: "rgba(42,40,38,0.12)" }} />
          </div>
        ))}

        <div className="mt-8">
          <NotMedicalAdvice />
        </div>
        <div className="mt-6">
          <LegalLinks />
        </div>
      </div>
    </main>
  );
}
