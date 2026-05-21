// File: config/index.js — REMOVE the settings import and from siteConfig
import branding from './branding.json' assert { type: 'json' };
import hero from './hero.json' assert { type: 'json' };
import about from './about.json' assert { type: 'json' };
import showreel from './showreel.json' assert { type: 'json' };
import process from './process.json' assert { type: 'json' };
import work from './work.json' assert { type: 'json' };
import blog from './blog.json' assert { type: 'json' };
import contact from './contact.json' assert { type: 'json' };
import navigation from './navigation.json' assert { type: 'json' };
import footer from './footer.json' assert { type: 'json' };
import seo from './seo.json' assert { type: 'json' };
import notFound from './notFound.json' assert { type: 'json' };
import admin from './admin.json' assert { type: 'json' };
import i18n from './i18n.json' assert { type: 'json' };
import site from './site.json' assert { type: 'json' };
import social from './social.json' assert { type: 'json' };
import settingsForm from './settingsForm.json' assert { type: 'json' };

const siteConfig = {
  branding,
  hero,
  about,
  showreel,
  process,
  work,
  blog,
  contact,
  navigation,
  footer,
  seo,
  notFound,
  admin,
  i18n,
  routes: site.routes,
  social,
  settingsForm,
};

export default siteConfig;