import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Phone, Mail, Clock, Scissors, Globe,
  ChevronRight, Instagram, MessageCircle, Award, Users, Star, Menu, X,
} from "lucide-react";
import { staggerContainer, staggerItem, fadeUp } from "../lib/motion";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { LanguageProvider, useLanguage } from "../i18n/LanguageProvider";
import type { Language } from "../i18n/types";
import logoSrc from "@/imports/logo_son.jpg";
import showroomExterior from "@/imports/Generated_Image_July_11__2026_-_5_56PM.jpg";
import srImg1 from "@/imports/IMG_20260711_145644.jpg";
import srImg2 from "@/imports/IMG_20260711_145803.jpg";
import srImg3 from "@/imports/IMG_20260711_145920.jpg";
import srImg4 from "@/imports/IMG_20260711_145928.jpg";
import igImg1 from "@/imports/IMG_20260711_145938.jpg";
import igImg2 from "@/imports/IMG_20260711_145945.jpg";
import aboutMainImg from "@/imports/IMG_20260711_145837.jpg";
import aboutDetailImg from "@/imports/IMG_20260711_145810.jpg";
import contactPhoto from "@/imports/IMG_20260711_145648.jpg";
import kadinVizонImg from "@/imports/R42.png";
import kadinDeriImg from "@/imports/image__4_.png";
import kadinKurkImg from "@/imports/R70.png";
import kadinKasmirImg from "@/imports/T07_08.png";
import erkekKurkImg from "@/imports/R33.png";
import erkekDeriImg from "@/imports/R46.png";
import erkekKasmirImg from "@/imports/R78.png";

/* ── Photos ─────────────────────────────────────────────────────── */
const F = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

/* Collection cards — real photos to be uploaded; Unsplash placeholders for now */
const P1   = kadinVizонImg;
const P2   = kadinKurkImg;
const P3   = kadinDeriImg;
const P4   = kadinKasmirImg;
const P5   = erkekKurkImg;
const P6   = erkekDeriImg;
const P7   = erkekKasmirImg;
const SR1  = srImg1;
const SR2  = srImg2;
const SR3  = srImg3;
const SR4  = srImg4;
const IG1  = igImg1;
const IG2  = igImg2;
const ABOUT_IMG      = aboutMainImg;
const LEATHER_DETAIL = aboutDetailImg;
const SHOWROOM_PHOTO = contactPhoto;

/* ── Contact constants (never translated) ───────────────────────── */
const PHONE_VAL   = "+90 537 858 11 44";
const PHONE_HREF  = "tel:+905378581144";
const WA_HREF     = "https://wa.me/905378581144";
const EMAIL_VAL   = "pianoleatherfur@outlook.com";
const EMAIL_HREF  = "mailto:pianoleatherfur@outlook.com";
const ADDRESS_VAL = "Yeni Mahalle, Akdeniz Caddesi No:29\nKemer / Antalya / Türkiye";
const HOURS_VAL   = "Pzt – Paz  09:00 – 23:00";
const MAPS_URL    = "https://maps.google.com/?q=36.59549934362746,30.54645988180846";
const IG_HANDLE   = "@pianoleatherfur";
const IG_URL      = "https://www.instagram.com/pianoleatherfur/";

const LANGS: Language[] = ["TR", "RU", "EN", "DE", "PL"];

/* ── Logo ────────────────────────────────────────────────────────── */
function PianoLogo({ height = 38 }: { height?: number }) {
  const { t } = useLanguage();
  return (
    <ImageWithFallback
      src={logoSrc}
      alt={t.a11y.logoAlt}
      style={{
        height, width: "auto", objectFit: "contain",
        display: "block", userSelect: "none", filter: "invert(1)",
      }}
    />
  );
}

/* ── Page type ───────────────────────────────────────────────────── */
type Page = "home" | "about";

/* ── Header ─────────────────────────────────────────────────────── */
function Header({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  const NAV = [
    { label: t.nav.home,       action: () => { setPage("home");  setMobileOpen(false); }, active: page === "home"  },
    { label: t.nav.collection, action: () => { setMobileOpen(false); },                   active: false },
    { label: t.nav.showroom,   action: () => { setMobileOpen(false); },                   active: false },
    { label: t.nav.instagram,  action: () => { setMobileOpen(false); },                   active: false },
    { label: t.nav.contact,    action: () => { setMobileOpen(false); },                   active: false },
    { label: t.nav.about,      action: () => { setPage("about"); setMobileOpen(false); }, active: page === "about" },
  ];

  return (
    <header ref={menuRef}
      className="sticky top-0 z-50 border-b border-[var(--ds-border)]"
      style={{ backgroundColor: "rgba(17,17,17,0.97)", backdropFilter: "blur(10px)" }}
    >
      <div className="flex items-center justify-between h-[60px] px-4 lg:px-8"
           style={{ maxWidth: "var(--container-max)", margin: "0 auto" }}>
        <button onClick={() => setPage("home")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <PianoLogo height={34} />
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV.map(({ label, action, active }) => (
            <button key={label} onClick={action}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.62rem", fontWeight: 500,
                letterSpacing: "0.13em", textTransform: "uppercase",
                color: active ? "var(--ds-gold)" : "var(--ds-gray)",
                background: "none", border: "none", cursor: "pointer",
                transition: "color var(--motion-fast) var(--motion-ease)",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--ds-white)")}
              onMouseLeave={e => { e.currentTarget.style.color = active ? "var(--ds-gold)" : "var(--ds-gray)"; }}
            >{label}</button>
          ))}
        </nav>

        {/* Desktop lang switcher */}
        <div className="hidden lg:flex items-center gap-0.5">
          {LANGS.map((l) => (
            <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 500,
                letterSpacing: "0.1em", padding: "3px 5px",
                color: lang === l ? "var(--ds-gold)" : "var(--ds-border)",
                background: "none", border: "none", cursor: "pointer",
                transition: "color var(--motion-fast) var(--motion-ease)",
              }}
            >{l}</button>
          ))}
        </div>

        {/* Mobile: lang + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          {LANGS.map((l) => (
            <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
              style={{
                fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
                letterSpacing: "0.08em", padding: "2px 4px",
                color: lang === l ? "var(--ds-gold)" : "var(--ds-border)",
                background: "none", border: "none", cursor: "pointer",
              }}
            >{l}</button>
          ))}
          <button onClick={() => setMobileOpen(v => !v)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--ds-gray)" }}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="lg:hidden border-t border-[var(--ds-border)]"
            style={{ backgroundColor: "rgba(17,17,17,0.99)" }}
          >
            {NAV.map(({ label, action, active }) => (
              <button key={label} onClick={action}
                className="w-full text-left px-6 py-4 border-b border-[var(--ds-border)]"
                style={{
                  fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 500,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: active ? "var(--ds-gold)" : "var(--ds-gray)",
                  background: "none", border: "none", borderBottom: "1px solid var(--ds-border)",
                  cursor: "pointer", display: "block",
                }}
              >{label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────────── */
function HeroSection() {
  const { t } = useLanguage();
  return (
    <motion.section
      initial="hidden" animate="visible" variants={{ hidden: {}, visible: {} }}
      className="relative overflow-hidden"
      style={{ height: "70vh", minHeight: 380 }}
    >
      <ImageWithFallback
        src={showroomExterior}
        alt="Piano Leather & Fur — Showroom, Kemer / Antalya"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "left center" }}
      />
      <div className="absolute inset-0"
           style={{ background: "linear-gradient(160deg,rgba(17,17,17,0.25) 0%,rgba(17,17,17,0.55) 50%,rgba(17,17,17,0.82) 100%)" }} />

      <motion.div
        initial="hidden" animate="visible" variants={staggerContainer}
        className="absolute bottom-10 left-8 max-w-md"
      >
        <motion.h1 variants={staggerItem}
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.2rem,4vw,3.8rem)",
                   fontWeight: 300, color: "var(--ds-white)", lineHeight: 1.1, marginBottom: 6 }}>
          {t.hero.title}
        </motion.h1>
        <motion.p variants={staggerItem}
          style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1rem,1.8vw,1.5rem)",
                   fontWeight: 300, color: "var(--ds-gold)", letterSpacing: "0.04em", marginBottom: 12 }}>
          {t.hero.subtitle}
        </motion.p>
        <motion.p variants={staggerItem}
          style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 300,
                   color: "rgba(245,245,245,0.72)", lineHeight: 1.65, marginBottom: 20, maxWidth: 320 }}>
          {t.hero.description}
        </motion.p>
        <motion.button variants={staggerItem} className="btn-primary">
          {t.hero.cta}
        </motion.button>
      </motion.div>
    </motion.section>
  );
}

/* ── Collections ─────────────────────────────────────────────────── */
const COLLECTION_IMGS = [P1, P2, P3, P4, P5, P6, P7];

function CollectionsSection() {
  const { t } = useLanguage();
  const cats = [
    t.collections.categories.womenMink,
    t.collections.categories.womenSable,
    t.collections.categories.womenLeather,
    t.collections.categories.womenCashmere,
    t.collections.categories.menFur,
    t.collections.categories.menLeather,
    t.collections.categories.menCashmere,
  ];

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
      variants={staggerContainer}
      className="px-6 py-10 border-b border-[var(--ds-border)]"
    >
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-6">
        <div>
          <p className="uppercase-label text-[var(--ds-gold)] mb-1">{t.collections.label}</p>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.9rem", fontWeight: 300,
                       color: "var(--ds-white)", letterSpacing: "0.04em" }}>
            {t.collections.title}
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
                      color: "var(--ds-gray)", marginTop: 4 }}>
            {t.collections.season}
          </p>
        </div>
        <button className="btn-ghost hidden sm:inline-flex items-center gap-1.5">
          {t.collections.viewAll} <ChevronRight size={12} />
        </button>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {cats.map((label, i) => (
          <motion.div key={label} variants={staggerItem}
            className="relative overflow-hidden rounded-xl cursor-pointer group"
            style={{ aspectRatio: "3/4", background: "var(--ds-card-bg)" }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <img src={COLLECTION_IMGS[i]} alt={label}
                 className="absolute inset-0 w-full h-full object-cover object-top
                            transition-opacity duration-200 group-hover:opacity-90" />
            <div className="absolute inset-0"
                 style={{ background: "linear-gradient(to top,rgba(17,17,17,0.88) 0%,transparent 55%)" }} />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 600,
                          letterSpacing: "0.14em", color: "var(--ds-white)", textTransform: "uppercase",
                          lineHeight: 1.3 }}>
                {label}
              </p>
              <button style={{
                fontFamily: "var(--font-body)", fontSize: "0.52rem", fontWeight: 500,
                letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 6,
                padding: "5px 10px", border: "1px solid rgba(199,164,90,0.6)", borderRadius: 6,
                color: "var(--ds-gold)", background: "transparent", cursor: "pointer",
              }}>
                {t.collections.discover}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ── Feature Bar ─────────────────────────────────────────────────── */
function FeatureBar() {
  const { t } = useLanguage();
  const FEATURES = [
    { icon: Clock,    key: t.features.since1994 },
    { icon: Scissors, key: t.features.craftsmanship },
    { icon: Globe,    key: t.features.design },
    { icon: MapPin,   key: t.features.international },
  ];

  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true }}
      variants={staggerContainer}
      className="grid grid-cols-2 lg:grid-cols-4 border-b border-[var(--ds-border)]"
    >
      {FEATURES.map(({ icon: Icon, key: f }, i) => (
        <motion.div key={f.title} variants={staggerItem}
          className="flex flex-col items-center gap-2.5 py-7 px-4 text-center"
          style={{ borderRight: (i % 2 === 0) ? "1px solid var(--ds-border)" : "none" }}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--ds-border)]">
            <Icon size={14} color="var(--ds-gold)" strokeWidth={1.5} />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.56rem", fontWeight: 600,
                        letterSpacing: "0.14em", color: "var(--ds-white)", textTransform: "uppercase" }}>
              {f.title}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 300,
                        color: "var(--ds-gray)", marginTop: 2 }}>
              {f.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ── Sidebar: Showroom ───────────────────────────────────────────── */
function ShowroomSection() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
      variants={staggerContainer}
      className="p-5 border-b border-[var(--ds-border)]"
    >
      <motion.div variants={fadeUp} className="mb-4">
        <p className="uppercase-label text-[var(--ds-gold)] mb-1">{t.showroom.label}</p>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 300,
                     color: "var(--ds-white)", letterSpacing: "0.04em", lineHeight: 1.2 }}>
          {t.showroom.title}
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 300,
                    color: "var(--ds-gray)", marginTop: 4, lineHeight: 1.5 }}>
          {t.showroom.subtitle}
        </p>
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-1.5 mb-4">
        {[SR1,SR2,SR3,SR4].map((src, i) => (
          <div key={i} className="overflow-hidden rounded-lg bg-[var(--ds-card-bg)]"
               style={{ aspectRatio: "4/3" }}>
            <ImageWithFallback src={src} alt={`Showroom ${i + 1}`}
                 className="w-full h-full object-cover transition-opacity duration-200 hover:opacity-85" />
          </div>
        ))}
      </motion.div>
      <motion.button variants={staggerItem} className="btn-secondary w-full justify-center">
        {t.showroom.cta}
      </motion.button>
    </motion.div>
  );
}

/* ── Sidebar: Piano Dünyası ─────────────────────────────────────── */
function PianoDunyasiSection() {
  const { t } = useLanguage();
  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
      variants={staggerContainer}
      className="p-5 border-b border-[var(--ds-border)]"
    >
      <motion.div variants={fadeUp} className="mb-4">
        <p className="uppercase-label text-[var(--ds-gold)] mb-1">{t.pianoDunyasi.label}</p>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 300,
                     color: "var(--ds-white)", letterSpacing: "0.04em", lineHeight: 1.2 }}>
          {t.pianoDunyasi.title}
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 300,
                    color: "var(--ds-gray)", marginTop: 4, lineHeight: 1.5 }}>
          {t.pianoDunyasi.subtitle}
        </p>
      </motion.div>
      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-1.5 mb-4">
        {[IG1,IG2].map((src, i) => (
          <div key={i}
               className="relative overflow-hidden rounded-lg bg-[var(--ds-card-bg)] cursor-pointer group"
               style={{ aspectRatio: "1/1" }}>
            <ImageWithFallback src={src} alt={`Instagram ${i + 1}`}
                 className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-75" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0
                            group-hover:opacity-100 transition-opacity duration-200">
              <Instagram size={20} color="var(--ds-white)" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </motion.div>
      <a href={IG_URL} target="_blank" rel="noopener noreferrer"
         className="w-full justify-center flex items-center gap-2"
         style={{
           fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
           letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none",
           padding: "11px 20px", border: "1px solid var(--ds-border)", borderRadius: "var(--border-radius)",
           color: "var(--ds-white)", background: "transparent",
           transition: "border-color var(--motion-fast) var(--motion-ease), color var(--motion-fast) var(--motion-ease)",
         }}
         onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ds-gold)"; }}
         onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ds-border)"; }}
      >
        <Instagram size={12} strokeWidth={1.5} />
        {t.pianoDunyasi.cta}
      </a>
    </motion.div>
  );
}

/* ── Sidebar: Contact ───────────────────────────────────────────── */
function ContactSection() {
  const { t } = useLanguage();

  const ITEMS = [
    { Icon: Phone,         label: t.contact.fields.phone,    value: PHONE_VAL,   href: PHONE_HREF },
    { Icon: MessageCircle, label: t.contact.fields.whatsapp, value: PHONE_VAL,   href: WA_HREF },
    { Icon: Mail,          label: t.contact.fields.email,    value: EMAIL_VAL,   href: EMAIL_HREF },
    { Icon: MapPin,        label: t.contact.fields.address,  value: "Akdeniz Cad. No:29, Kemer / Antalya", href: MAPS_URL },
    { Icon: Clock,         label: t.contact.fields.hours,    value: HOURS_VAL,   href: undefined },
  ];

  const CTAS = [
    { label: t.contact.cta.call,      Icon: Phone,         href: PHONE_HREF },
    { label: t.contact.cta.whatsapp,  Icon: MessageCircle, href: WA_HREF },
    { label: t.contact.cta.maps,      Icon: MapPin,        href: MAPS_URL },
    { label: t.contact.cta.instagram, Icon: Instagram,     href: IG_URL },
  ];

  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
      variants={staggerContainer}
      className="p-5"
    >
      <motion.div variants={fadeUp} className="mb-5">
        <p className="uppercase-label text-[var(--ds-gold)] mb-1">{t.contact.label}</p>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 300,
                     color: "var(--ds-white)", letterSpacing: "0.04em", lineHeight: 1.2 }}>
          {t.contact.title}
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.73rem", fontWeight: 300,
                    color: "var(--ds-gray)", marginTop: 6, lineHeight: 1.6 }}>
          {t.contact.subtitle}
        </p>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-col gap-2.5 mb-5">
        {ITEMS.map(({ Icon, label, value, href }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full border border-[var(--ds-border)] flex-shrink-0 mt-0.5">
              <Icon size={11} color="var(--ds-gold)" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
                             letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ds-border)" }}>
                {label}
              </span>
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer"
                   style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 300,
                            color: "var(--ds-gray)", textDecoration: "none", wordBreak: "break-all",
                            transition: "color var(--motion-fast) var(--motion-ease)" }}
                   onMouseEnter={e => (e.currentTarget.style.color = "var(--ds-white)")}
                   onMouseLeave={e => (e.currentTarget.style.color = "var(--ds-gray)")}>
                  {value}
                </a>
              ) : (
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 300,
                               color: "var(--ds-gray)" }}>
                  {value}
                </span>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-2 mb-5">
        {CTAS.map(({ label, Icon, href }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
             className="flex items-center justify-center gap-1.5"
             style={{
               fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 600,
               letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none",
               padding: "10px 8px", border: "1px solid var(--ds-border)",
               borderRadius: "var(--border-radius)", color: "var(--ds-gray)", background: "transparent",
               transition: "border-color var(--motion-fast) var(--motion-ease), color var(--motion-fast) var(--motion-ease)",
             }}
             onMouseEnter={e => {
               (e.currentTarget as HTMLElement).style.borderColor = "var(--ds-gold)";
               (e.currentTarget as HTMLElement).style.color = "var(--ds-gold)";
             }}
             onMouseLeave={e => {
               (e.currentTarget as HTMLElement).style.borderColor = "var(--ds-border)";
               (e.currentTarget as HTMLElement).style.color = "var(--ds-gray)";
             }}
          >
            <Icon size={10} strokeWidth={1.5} />
            {label}
          </a>
        ))}
      </motion.div>

      <motion.div variants={staggerItem}
                  className="overflow-hidden rounded-xl border border-[var(--ds-border)]"
                  style={{ aspectRatio: "16/9" }}>
        <ImageWithFallback src={SHOWROOM_PHOTO} alt="Piano Leather & Fur Showroom"
             className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-200" />
      </motion.div>

      <motion.div variants={staggerItem} className="mt-2">
        <a href={MAPS_URL} target="_blank" rel="noopener noreferrer"
           className="relative flex items-center justify-center overflow-hidden rounded-xl border border-[var(--ds-border)] group"
           style={{ height: 110, background: "var(--ds-card-bg)", textDecoration: "none" }}>
          <div className="absolute inset-0"
               style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 19px,var(--ds-border) 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,var(--ds-border) 20px)", opacity: 0.12 }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--ds-card-bg)] border border-[var(--ds-gold)] group-hover:bg-[var(--ds-gold)] transition-colors duration-200">
              <MapPin size={14} color="var(--ds-gold)" strokeWidth={1.5} />
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 600,
                        letterSpacing: "0.14em", color: "var(--ds-white)", textTransform: "uppercase" }}>
              {t.contact.mapsLabel}
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", fontWeight: 300,
                        color: "var(--ds-gray)" }}>
              {t.contact.mapsAddress}
            </p>
          </div>
        </a>
      </motion.div>
    </motion.div>
  );
}

/* ── About Page ──────────────────────────────────────────────────── */
const ABOUT_FEATURE_ICONS = [Award, Star, Users, Globe];

function AboutPage() {
  const { lang, setLang, t } = useLanguage();

  const aboutFeatures = [
    t.about.features.since1994,
    t.about.features.premium,
    t.about.features.boutique,
    t.about.features.international,
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{ backgroundColor: "var(--ds-black)", minHeight: "calc(100vh - 60px)" }}
    >
      {/* Hero band */}
      <div className="relative overflow-hidden"
           style={{ height: 260, background: "var(--ds-card-bg)", borderBottom: "1px solid var(--ds-border)" }}>
        <ImageWithFallback
          src={showroomExterior}
          alt="Piano Leather & Fur Showroom"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "left center", opacity: 0.35 }}
        />
        <div className="absolute inset-0"
             style={{ background: "linear-gradient(to right, rgba(17,17,17,0.9) 40%, transparent 100%)" }} />
        <div className="relative h-full flex flex-col justify-end pb-8 px-5 lg:px-16"
             style={{ maxWidth: "var(--container-max)", margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
                      letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ds-gold)", marginBottom: 10 }}>
            {t.about.subtitle}
          </p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.8rem,5vw,5.5rem)",
                       fontWeight: 300, color: "var(--ds-white)", lineHeight: 1, letterSpacing: "0.03em" }}>
            {t.about.title}
          </h1>
        </div>
      </div>

      {/* Main two-col */}
      <div className="px-5 py-10 lg:px-16 lg:py-16 flex flex-col lg:flex-row gap-10 lg:gap-16"
           style={{ maxWidth: "var(--container-max)", margin: "0 auto" }}>

        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4 mb-10">
            <div style={{ height: 1, width: 40, background: "var(--ds-gold)", opacity: 0.7 }} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.58rem", fontWeight: 500,
                        letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ds-gold)" }}>
              Piano Leather &amp; Fur
            </p>
          </div>

          {/* Language tabs */}
          <div className="flex gap-0 mb-10 border-b border-[var(--ds-border)]">
            {LANGS.map((l) => (
              <button key={l} onClick={() => setLang(l)}
                aria-pressed={lang === l}
                style={{
                  fontFamily: "var(--font-body)", fontSize: "0.62rem", fontWeight: 500,
                  letterSpacing: "0.14em", padding: "10px 16px",
                  color: lang === l ? "var(--ds-gold)" : "var(--ds-border)",
                  background: "none", border: "none",
                  borderBottom: lang === l ? "1px solid var(--ds-gold)" : "1px solid transparent",
                  marginBottom: -1, cursor: "pointer",
                  transition: "color var(--motion-fast) var(--motion-ease)",
                }}
              >{l}</button>
            ))}
          </div>

          {/* Body text */}
          <AnimatePresence mode="wait">
            <motion.div key={lang}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-6 mb-14"
            >
              {t.about.body.map((para, i) => (
                <p key={i} style={{
                  fontFamily:    i === 0 ? "var(--font-heading)" : "var(--font-body)",
                  fontSize:      i === 0 ? "1.2rem" : "0.9rem",
                  fontWeight:    300,
                  color:         i === 0 ? "var(--ds-ivory)" : "var(--ds-gray)",
                  lineHeight:    i === 0 ? 1.6 : 1.8,
                  letterSpacing: i === 0 ? "0.01em" : "0",
                }}>
                  {para}
                </p>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3">
            {aboutFeatures.map((f, i) => {
              const Icon = ABOUT_FEATURE_ICONS[i];
              return (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3 p-5"
                  style={{ background: "var(--ds-card-bg)", border: "1px solid var(--ds-border)",
                           borderRadius: "var(--border-radius)" }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[var(--ds-border)]"
                       style={{ background: "rgba(199,164,90,0.06)" }}>
                    <Icon size={13} color="var(--ds-gold)" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 600,
                                letterSpacing: "0.14em", textTransform: "uppercase",
                                color: "var(--ds-white)", marginBottom: 4 }}>
                      {f.title}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
                                color: "var(--ds-gray)", lineHeight: 1.6 }}>
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: images */}
        <div className="w-full lg:flex-shrink-0 lg:w-[380px] relative">
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="overflow-hidden rounded-2xl h-[320px] lg:h-[540px]"
            style={{ border: "1px solid var(--ds-border)" }}
          >
            <ImageWithFallback src={ABOUT_IMG} alt="Piano Leather & Fur Showroom"
                 className="w-full h-full object-cover object-top" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden lg:block absolute overflow-hidden rounded-xl"
            style={{
              width: 170, height: 210, bottom: -30, right: -20,
              border: "3px solid var(--ds-black)", outline: "1px solid var(--ds-border)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            }}
          >
            <ImageWithFallback src={LEATHER_DETAIL} alt="Showroom genel görünüm"
                 className="w-full h-full object-cover object-center" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="absolute top-6 left-6 flex flex-col items-center justify-center"
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "var(--ds-black)", border: "1px solid var(--ds-gold)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.42rem", fontWeight: 600,
                        letterSpacing: "0.14em", color: "var(--ds-gold)", textTransform: "uppercase" }}>
              SINCE
            </p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 400,
                        color: "var(--ds-white)", lineHeight: 1 }}>
              1994
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Footer ─────────────────────────────────────────────────────── */
function Footer({ setPage }: { setPage: (p: Page) => void }) {
  const { t } = useLanguage();
  const links = [
    { label: t.nav.home,       action: () => setPage("home") },
    { label: t.nav.collection, action: () => setPage("home") },
    { label: t.nav.showroom,   action: () => setPage("home") },
    { label: t.nav.instagram,  action: () => setPage("home") },
    { label: t.nav.contact,    action: () => setPage("home") },
    { label: t.nav.about,      action: () => setPage("about") },
  ];

  return (
    <footer className="border-t border-[var(--ds-border)]"
            style={{ backgroundColor: "var(--ds-black)" }}>
      <div className="px-5 lg:px-8 py-10" style={{ maxWidth: "var(--container-max)", margin: "0 auto" }}>
        <div className="flex flex-col sm:flex-row gap-8 lg:gap-16 items-start">
          <div className="flex flex-col gap-4">
            <PianoLogo height={34} />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", fontWeight: 300,
                        color: "var(--ds-gray)", lineHeight: 1.65, maxWidth: 200 }}>
              {t.footer.tagline}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.56rem", fontWeight: 600,
                        letterSpacing: "0.15em", color: "var(--ds-white)", textTransform: "uppercase",
                        marginBottom: 2 }}>
              {t.footer.siteMap}
            </p>
            {links.map(({ label, action }) => (
              <button key={label} onClick={action}
                style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
                         color: "var(--ds-gray)", background: "none", border: "none",
                         cursor: "pointer", textAlign: "left", padding: 0,
                         transition: "color var(--motion-fast) var(--motion-ease)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--ds-white)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--ds-gray)")}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="divider-gold mt-8 mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", fontWeight: 300,
                      letterSpacing: "0.06em", color: "var(--ds-border)" }}>
            {t.footer.copyright}
          </p>
          <div className="flex gap-5">
            {[t.footer.privacy, t.footer.terms, t.footer.cookies].map((l) => (
              <a key={l} href="#"
                 style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", fontWeight: 300,
                          color: "var(--ds-border)", textDecoration: "none",
                          transition: "color var(--motion-fast) var(--motion-ease)" }}
                 onMouseEnter={e => (e.currentTarget.style.color = "var(--ds-gray)")}
                 onMouseLeave={e => (e.currentTarget.style.color = "var(--ds-border)")}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Inner App (uses context) ────────────────────────────────────── */
function InnerApp() {
  const [page, setPage] = useState<Page>("home");

  return (
    <div style={{ backgroundColor: "var(--ds-black)", fontFamily: "var(--font-body)", minHeight: "100vh" }}>
      <Header page={page} setPage={setPage} />

      <AnimatePresence mode="wait">
        {page === "home" ? (
          <motion.div key="home"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ maxWidth: "var(--container-max)", margin: "0 auto" }}>
              <div className="flex flex-col lg:flex-row">
                <main className="flex-1 min-w-0 lg:border-r border-[var(--ds-border)]">
                  <HeroSection />
                  <CollectionsSection />
                  <FeatureBar />
                </main>
                <aside className="w-full lg:w-[320px] lg:flex-shrink-0 border-t lg:border-t-0 border-[var(--ds-border)]">
                  <ShowroomSection />
                  <PianoDunyasiSection />
                  <ContactSection />
                </aside>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="about"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AboutPage />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer setPage={setPage} />
    </div>
  );
}

/* ── App (root with provider) ────────────────────────────────────── */
export default function App() {
  return (
    <LanguageProvider>
      <InnerApp />
    </LanguageProvider>
  );
}
