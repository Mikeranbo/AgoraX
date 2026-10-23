import React from 'react';
import { Modal } from './Modal';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-1.5">
    <h3 className="font-display text-[17px] font-bold text-white">{title}</h3>
    <div className="space-y-2 text-[15px] leading-relaxed text-slate-300">{children}</div>
  </section>
);

/** What we keep, why, for how long, and how to get it deleted (GDPR Art. 13). */
export const PrivacyNote = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Your details">
    <div className="space-y-5">
      <Section title="Who is responsible">
        <p>
          AgoraX is run by Mike (Nikita Sondarev). Questions or requests go to{' '}
          <a className="text-brand-secondary underline underline-offset-4" href="mailto:sondarevn@gmail.com">
            sondarevn@gmail.com
          </a>
          .
        </p>
      </Section>
      <Section title="What we keep">
        <p>
          Without asking you anything: a random ID for this browser (there are no accounts), the events you
          picked, your answers to the price question, and which poster or link brought you here.
        </p>
        <p>
          Only if you fill in a form: your WhatsApp number, email and first name, plus what you wrote about
          running an event, your idea for one, or your space. If you choose to show your initial on an
          event, that one letter is visible to everyone who opens AgoraX. A display name you set in your
          profile is seen only by you. A photo you add to an event idea is shown with that event if we run it.
        </p>
      </Section>
      <Section title="Why">
        <p>
          The picks count towards each event's minimum, so we know which events to run. Your number is used
          only for the reason you ticked the box for: telling you an event you picked is happening, or talking
          about the event or space you offered. We never sell it or use it for anything else.
        </p>
      </Section>
      <Section title="Where and how long">
        <p>
          Everything is stored in Google Firebase. Contact details stay until you delete them, and at the
          latest 12 months after your last visit. Picks and price answers without contact details don't say
          who you are and are kept as counts.
        </p>
      </Section>
      <Section title="Deleting it">
        <p>
          Menu → Privacy & my data → "Delete my details" removes your number, email, name and any initials you
          showed straight away. The same page has switches to stop messages or visit statistics. You can also email
          us to see, correct or delete anything we have; we answer within 30 days. If you're unhappy with how
          we handle it, you can complain to the Autoriteit Persoonsgegevens.
        </p>
      </Section>
    </div>
  </Modal>
);
