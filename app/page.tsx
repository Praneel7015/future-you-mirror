"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const EASE_MIRROR = [0.4, 0, 0.2, 1] as const;
const TAP_MS = 0.12;

const MotionLink = motion(Link);

function tapOutlinePrimary() {
  return {
    scale: 0.985,
    boxShadow:
      "0 0 0 3px rgba(167, 139, 113, 0.55), inset 0 0 0 1px rgba(255, 253, 249, 0.28)",
    filter: "brightness(0.96)",
  };
}

function tapOutlineSecondary() {
  return {
    scale: 0.985,
    backgroundColor: "rgba(167,139,113,0.10)",
    borderColor: "rgba(167,139,113,0.45)",
    boxShadow: "0 0 0 3px rgba(167,139,113,0.35)",
    color: "#2A2826",
  };
}

export default function LandingPage() {
  const reduced = useReducedMotion();
  const [narrowMobile, setNarrowMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setNarrowMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /** Fewer simultaneous animations on small screens (helps low‑power mobile GPUs). */
  const calm = reduced || narrowMobile;

  const fadeUp = calm
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

  const dur = calm ? 0 : 0.65;
  const easeUp = calm ? undefined : ({ duration: dur, ease: EASE_MIRROR } as const);

  return (
    <main
      className="min-h-[100svh] flex flex-col items-center justify-center px-6 py-8 overflow-x-hidden"
      style={{
        background: "#F8F5F0",
        color: "#2A2826",
        paddingTop: "max(24px, env(safe-area-inset-top))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
    >
      {/* Abstract editorial hero — the "mirror" motif */}
      <motion.div
        className="relative w-full max-w-sm mb-10"
        initial={fadeUp.hidden}
        animate={fadeUp.visible}
        transition={easeUp}
      >
        <div
          className="w-full rounded-2xl overflow-hidden relative"
          style={{
            height: 320,
            background:
              "radial-gradient(120% 80% at 30% 20%, rgba(232,197,181,0.55), transparent 60%), radial-gradient(100% 70% at 80% 70%, rgba(167,139,113,0.35), transparent 65%), linear-gradient(180deg, #F1E8DC 0%, #E8D9C7 100%)",
          }}
        >
          {/* Oval mirror motif */}
          <motion.div
            className="absolute"
            aria-hidden
            style={{
              left: "50%",
              top: "50%",
              width: 180,
              height: 230,
              borderRadius: "50%",
              background:
                "radial-gradient(60% 50% at 50% 40%, rgba(255,253,249,0.55), rgba(255,253,249,0.0) 70%)",
              border: "1px solid rgba(255,253,249,0.4)",
              willChange: calm ? undefined : "opacity, transform",
            }}
            initial={
              calm
                ? { opacity: 1, scale: 1, x: "-50%", y: "-50%" }
                : { opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }
            }
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            transition={
              calm
                ? undefined
                : { duration: 0.75, ease: EASE_MIRROR, delay: 0.12 }
            }
          />
          <motion.div
            className="absolute"
            aria-hidden
            style={{
              left: "50%",
              top: "50%",
              width: 110,
              height: 145,
              borderRadius: "50%",
              border: "1px solid rgba(42,40,38,0.18)",
              willChange: calm ? undefined : "opacity, transform",
            }}
            initial={
              calm
                ? { opacity: 1, scale: 1, x: "-50%", y: "-50%" }
                : { opacity: 0, scale: 0.94, x: "-50%", y: "-50%" }
            }
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            transition={
              calm ? undefined : { duration: 0.7, ease: EASE_MIRROR, delay: 0.22 }
            }
          />
          <motion.div
            className="absolute bottom-4 left-5 text-[10px] tracking-widest"
            style={{ color: "rgba(42,40,38,0.5)", fontFamily: "var(--font-inter)" }}
            initial={calm ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              calm ? undefined : { duration: 0.5, ease: EASE_MIRROR, delay: 0.42 }
            }
          >
            EDITION · Nº 01
          </motion.div>
          <motion.div
            className="absolute bottom-4 right-5 text-[10px] tracking-widest"
            style={{ color: "rgba(42,40,38,0.5)", fontFamily: "var(--font-inter)" }}
            initial={calm ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              calm ? undefined : { duration: 0.5, ease: EASE_MIRROR, delay: 0.48 }
            }
          >
            SPRING — 2026
          </motion.div>
        </div>
      </motion.div>

      {/* Headline + CTAs — stagger matches mirror flow (calm opacity crossfades) */}
      <motion.div
        className="max-w-sm w-full"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: calm ? 0 : 0.08,
              delayChildren: calm ? 0 : 0.12,
            },
          },
        }}
      >
        <motion.h1
          variants={fadeUp}
          transition={easeUp}
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 38,
            lineHeight: 1.05,
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}
        >
          See the skin you&apos;ll have.
          <br />
          <span style={{ fontStyle: "italic", color: "#A78B71" }}>And the one you could.</span>
        </motion.h1>

        <motion.p
          className="mt-5 text-sm leading-relaxed"
          style={{ color: "rgba(42,40,38,0.7)", maxWidth: 320 }}
          variants={fadeUp}
          transition={easeUp}
        >
          One selfie. Two minutes. A question you&apos;ve never been asked.
        </motion.p>

        <motion.div className="mt-10 space-y-4" variants={fadeUp} transition={easeUp}>
          <MotionLink
            href="/mirror"
            className="flex items-center justify-center w-full rounded-full text-[15px] font-medium"
            style={{
              height: 56,
              background: "#A78B71",
              color: "#FBF8F3",
              letterSpacing: "0.02em",
              fontFamily: "var(--font-sans)",
            }}
            whileTap={calm ? undefined : tapOutlinePrimary()}
            transition={{ type: "tween", duration: TAP_MS, ease: EASE_MIRROR }}
          >
            Begin the Mirror Test
          </MotionLink>

          <MotionLink
            href="/mirror?demo=true"
            className="flex items-center justify-center w-full rounded-full text-[14px]"
            style={{
              height: 48,
              background: "transparent",
              color: "#2A2826",
              border: "1px solid rgba(42,40,38,0.18)",
              letterSpacing: "0.02em",
              fontFamily: "var(--font-sans)",
            }}
            whileTap={calm ? undefined : tapOutlineSecondary()}
            transition={{ type: "tween", duration: TAP_MS, ease: EASE_MIRROR }}
          >
            Try with sample photo
          </MotionLink>
        </motion.div>

        <motion.p
          className="mt-6 text-center text-[10px]"
          style={{ color: "#A78B71", letterSpacing: "0.18em" }}
          variants={fadeUp}
          transition={easeUp}
        >
          YOUR PHOTO NEVER LEAVES YOUR DEVICE UNENCRYPTED
        </motion.p>

        <motion.div className="mt-5 text-center" variants={fadeUp} transition={easeUp}>
          <a
            href="https://www.praneel.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "rgba(42,40,38,0.45)",
              textDecoration: "none",
              borderBottom: "0.5px solid rgba(167,139,113,0.35)",
              paddingBottom: 2,
            }}
          >
            Made By Praneel
          </a>
        </motion.div>
      </motion.div>
    </main>
  );
}
