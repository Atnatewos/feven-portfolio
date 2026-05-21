// File: components/sections/ContactForm.jsx
'use client';

import { useState } from 'react';
import { getConfig } from '../../lib/config';
import GlowButton from '../ui/GlowButton';
import './ContactForm.css';

/**
 * ContactForm — dark cyberpunk styled form.
 *
 * Features:
 * - Deep dark input fields with rounded borders
 * - Neon glow focus states
 * - Honeypot bot protection
 * - Client-side validation with config-driven error messages
 * - Gradient glow submit button
 * - Success/error states
 *
 * All labels and messages from config/contact.json via getConfig().
 */
export default function ContactForm({ lang = 'en' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    website: '',
  });
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});

  function validateForm() {
    const newErrors = {};
    const name = formData.name.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();

    if (!name) {
      newErrors.name = getConfig('contact.form.validation.nameRequired', lang);
    } else if (name.length < 2) {
      newErrors.name = getConfig('contact.form.validation.nameMinLength', lang);
    }

    if (!email) {
      newErrors.email = getConfig('contact.form.validation.emailRequired', lang);
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.email = getConfig('contact.form.validation.emailInvalid', lang);
    }

    if (!message) {
      newErrors.message = getConfig('contact.form.validation.messageRequired', lang);
    } else if (message.length < 10) {
      newErrors.message = getConfig('contact.form.validation.messageMinLength', lang);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (formData.website) {
      setStatus('success');
      setFormData({ name: '', email: '', message: '', website: '' });
      return;
    }

    if (!validateForm()) return;
    setStatus('submitting');

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        }),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '', website: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const nameLabel = getConfig('contact.form.nameLabel', lang);
  const namePlaceholder = getConfig('contact.form.namePlaceholder', lang);
  const emailLabel = getConfig('contact.form.emailLabel', lang);
  const emailPlaceholder = getConfig('contact.form.emailPlaceholder', lang);
  const messageLabel = getConfig('contact.form.messageLabel', lang);
  const messagePlaceholder = getConfig('contact.form.messagePlaceholder', lang);
  const submitText = getConfig('contact.form.submitText', lang);
  const sendingText = getConfig('contact.form.sendingText', lang);
  const successMessage = getConfig('contact.form.successMessage', lang);
  const errorMessage = getConfig('contact.form.errorMessage', lang);

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="contact-form-grid">
        <div className="contact-form-group">
          <label htmlFor="contact-name" className="contact-form-label">{nameLabel}</label>
          <input
            type="text"
            id="contact-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`contact-form-input ${errors.name ? 'has-error' : ''}`}
            placeholder={namePlaceholder}
            disabled={status === 'submitting'}
            maxLength={100}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <span id="name-error" className="contact-form-error" role="alert">{errors.name}</span>}
        </div>

        <div className="contact-form-group">
          <label htmlFor="contact-email" className="contact-form-label">{emailLabel}</label>
          <input
            type="email"
            id="contact-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`contact-form-input ${errors.email ? 'has-error' : ''}`}
            placeholder={emailPlaceholder}
            disabled={status === 'submitting'}
            maxLength={254}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <span id="email-error" className="contact-form-error" role="alert">{errors.email}</span>}
        </div>

        <div className="contact-form-group contact-form-full">
          <label htmlFor="contact-message" className="contact-form-label">{messageLabel}</label>
          <textarea
            id="contact-message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className={`contact-form-textarea ${errors.message ? 'has-error' : ''}`}
            placeholder={messagePlaceholder}
            rows={6}
            disabled={status === 'submitting'}
            maxLength={2000}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          {errors.message && <span id="message-error" className="contact-form-error" role="alert">{errors.message}</span>}
        </div>
      </div>

      <div className="contact-form-submit-wrapper">
        <button
          type="submit"
          className="contact-form-submit"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? sendingText : submitText}
        </button>
      </div>

      {status === 'success' && (
        <div className="contact-form-success" role="alert">
          <span className="contact-form-success-icon">✅</span>
          <p>{successMessage}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="contact-form-error-global" role="alert">
          <span className="contact-form-error-icon">⚠️</span>
          <p>{errorMessage}</p>
        </div>
      )}
    </form>
  );
}