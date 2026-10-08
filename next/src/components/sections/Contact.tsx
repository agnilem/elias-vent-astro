// GENERATED from src/components/sections/Contact.astro by tools/astro-to-next.mjs. Edit the Astro file, then regenerate.
import { sx } from '@/lib/sx';
import { site } from '@/lib/site';
import ScrollWords from '@/components/ScrollWords';
import Icon from '@/components/Icon';

export default function Contact() {
  const { contact } = site;

  return (
    <>
      <section id="contact" className="contact container">
        <div className="contact-main">
          <div className="contact-left">
            <ScrollWords as="h2" className="h2 balance" text={contact.heading} />
            <div className="contact-card">
              <div className="contact-avatar"><img src="/assets/avatar.webp" alt={site.name} loading="lazy" /></div>
              <a className="body" href={site.phone.href}>{site.phone.label}</a>
            </div>
          </div>
          <div className="contact-right">
            <p className="body-sb" style={sx("color: var(--grey)")}>{contact.label}</p>
            <p className="body balance">{contact.text}</p>
            <form className="form" data-contact-form="">
              <input className="input" type="text" name="name" placeholder="Name" autoComplete="name" />
              <input className="input" type="email" name="email" placeholder="Email" autoComplete="email" required />
              <textarea className="input" name="message" placeholder="Message" rows={4}></textarea>
              <button type="submit" className="submit is-disabled">
                <span className="body-sb" data-label="">Send Message</span>
                <span className="submit-icon"><Icon name="arrow-up-right" size={20} stroke={2} /></span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
