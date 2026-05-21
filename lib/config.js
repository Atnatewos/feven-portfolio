// File: lib/config.js
import siteConfig from '../config/index.js';

/**
 * Central configuration loader — the SINGLE source of truth for the entire application.
 * Every component, page, and utility imports from here. Nothing is hardcoded anywhere.
 * 
 * To rebrand for a new client: edit config/**** .config.json only.
 * No code changes needed.
 */

/**
 * Retrieves a nested config value using dot notation.
 * Supports template variables like {siteName} that get replaced with actual config values.
 * @param {string} path - Dot notation path (e.g. 'branding.siteName', 'contact.form.validation.nameRequired')
 * @param {string} [lang='en'] - Language code for multilingual values
 * @param {Object} [variables={}] - Template variables to replace in the string
 * @returns {*} The config value, or path string if not found
 */
export function getConfig(path, lang = 'en', variables = {}) {
  if (!path || typeof path !== 'string') {
    console.error('getConfig: path must be a non-empty string');
    return path;
  }

  const keys = path.split('.');
  let value = siteConfig;

  for (const key of keys) {
    if (value === null || value === undefined) {
      console.warn(`getConfig: path "${path}" not found at key "${key}"`);
      return path;
    }
    value = value[key];
  }

  if (value === null || value === undefined) {
    console.warn(`getConfig: path "${path}" resolved to null/undefined`);
    return path;
  }

  // Handle multilingual objects: { en: "...", am: "..." }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (value.en !== undefined || value.am !== undefined) {
      const resolvedLang = value[lang] !== undefined ? lang : 'en';
      let result = value[resolvedLang];

      // Apply template variable substitution
      if (typeof result === 'string' && Object.keys(variables).length > 0) {
        result = applyTemplateVariables(result, variables);
      }

      return result;
    }
  }

  // Handle direct string values with template variables
  if (typeof value === 'string' && Object.keys(variables).length > 0) {
    return applyTemplateVariables(value, variables);
  }

  return value;
}

/**
 * Replaces {variableName} placeholders in a template string with actual values.
 * @param {string} template - String containing {variable} placeholders
 * @param {Object} variables - Key-value pairs for replacement
 * @returns {string} Template with variables replaced
 */
function applyTemplateVariables(template, variables) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Gets the full site configuration object.
 * Used for bulk access (e.g., passing to admin settings page).
 * @returns {Object} Complete site configuration
 */
export function getFullConfig() {
  return siteConfig;
}

/**
 * Gets branding-specific configuration.
 * @returns {Object} Branding config object
 */
export function getBranding() {
  return siteConfig.branding;
}

/**
 * Gets all navigation items that are marked as visible.
 * @returns {Array} Visible navigation items
 */
export function getVisibleNavigation() {
  return siteConfig.navigation.items.filter((item) => item.visible !== false);
}

/**
 * Gets CSS custom properties string from branding colors.
 * Used to inject into <body> or <html> style attribute.
 * @returns {string} CSS custom properties
 */
export function getColorVariables() {
  const colors = siteConfig.branding.colors;
  return Object.entries(colors)
    .map(([key, value]) => `--color-${key}: ${value}`)
    .join('; ');
}

/**
 * Gets the default language from config.
 * @returns {string} Default language code
 */
export function getDefaultLanguage() {
  return siteConfig.i18n.defaultLanguage;
}

/**
 * Gets supported languages list.
 * @returns {Array} Supported language codes
 */
export function getSupportedLanguages() {
  return siteConfig.i18n.supportedLanguages;
}

/**
 * Gets SEO metadata as a complete object for Next.js metadata API.
 * @param {string} [lang='en'] - Language code
 * @returns {Object} SEO metadata object
 */
export function getSEOMetadata(lang = 'en') {
  const branding = siteConfig.branding;
  const seo = siteConfig.seo;
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: branding.siteName,
      template: getConfig('seo.titleTemplate', lang, { siteName: branding.siteName }),
    },
    description: getConfig('seo.defaultDescription', lang, { siteName: branding.siteName }),
    icons: {
      icon: branding.favicon,
      shortcut: branding.favicon,
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    openGraph: {
      title: branding.siteName,
      description: getConfig('seo.defaultDescription', lang, { siteName: branding.siteName }),
      url: SITE_URL,
      siteName: branding.siteName,
      images: seo.ogImage ? [{ url: seo.ogImage }] : [],
      type: 'website',
      locale: seo.locale || 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: branding.siteName,
      description: getConfig('seo.defaultDescription', lang, { siteName: branding.siteName }),
      images: seo.ogImage ? [seo.ogImage] : [],
      creator: seo.twitterHandle || '',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Gets admin-specific labels and configuration.
 * @param {string} [lang='en'] - Language code
 * @returns {Object} Admin config
 */
export function getAdminConfig(lang = 'en') {
  return {
    sidebar: siteConfig.admin.sidebar,
    login: siteConfig.admin.login,
    dashboard: siteConfig.admin.dashboard,
    labels: siteConfig.admin.labels,
    branding: siteConfig.branding,
  };
}

/**
 * Formats a date according to the config's locale.
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return '—';
  const locale = siteConfig.seo.locale || 'en-US';
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Date(date).toLocaleDateString(locale, { ...defaultOptions, ...options });
}


/**
 * Checks if a given pathname belongs to the admin section.
 * Reads the admin route prefix from config — never hardcoded.
 *
 * @param {string} pathname - The current route pathname
 * @returns {boolean} Whether the path is an admin route
 */
export function isAdminRoute(pathname) {
  const adminPrefix = getConfig('routes.admin.prefix') || '/admin';
  return pathname.startsWith(adminPrefix);
}

/**
 * Returns the admin login path from configuration.
 *
 * @returns {string} The admin login route
 */
export function getAdminLoginPath() {
  return getConfig('routes.admin.login') || '/admin/login';
}

/**
 * Returns a public route path from configuration.
 *
 * @param {string} key - The route key (e.g. 'home', 'work', 'blog')
 * @returns {string} The configured route path
 */
export function getPublicRoute(key) {
  return getConfig(`routes.public.${key}`) || `/${key}`;
}