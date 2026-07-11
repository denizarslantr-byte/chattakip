export type Language = "TR" | "RU" | "EN" | "DE" | "PL";

export interface Translation {
  nav: {
    home: string;
    collection: string;
    showroom: string;
    instagram: string;
    contact: string;
    about: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta: string;
  };
  collections: {
    label: string;
    title: string;
    season: string;
    viewAll: string;
    discover: string;
    categories: {
      womenMink: string;
      womenSable: string;
      womenLeather: string;
      womenCashmere: string;
      menFur: string;
      menLeather: string;
      menCashmere: string;
    };
  };
  features: {
    since1994: { title: string; desc: string };
    craftsmanship: { title: string; desc: string };
    design: { title: string; desc: string };
    international: { title: string; desc: string };
  };
  showroom: {
    label: string;
    title: string;
    subtitle: string;
    cta: string;
  };
  pianoDunyasi: {
    label: string;
    title: string;
    subtitle: string;
    cta: string;
  };
  contact: {
    label: string;
    title: string;
    subtitle: string;
    fields: {
      phone: string;
      whatsapp: string;
      email: string;
      address: string;
      hours: string;
    };
    cta: {
      call: string;
      whatsapp: string;
      maps: string;
      instagram: string;
    };
    mapsLabel: string;
    mapsAddress: string;
  };
  about: {
    heroLabel: string;
    title: string;
    subtitle: string;
    body: string[];
    features: {
      since1994: { title: string; desc: string };
      premium: { title: string; desc: string };
      boutique: { title: string; desc: string };
      international: { title: string; desc: string };
    };
  };
  footer: {
    tagline: string;
    siteMap: string;
    copyright: string;
    privacy: string;
    terms: string;
    cookies: string;
  };
  a11y: {
    logoAlt: string;
    langSelect: string;
  };
}
