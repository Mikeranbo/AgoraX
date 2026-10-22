import React from 'react';
import { MotionConfig } from 'motion/react';
import { VisitorProvider, useVisitor } from './state/VisitorProvider';
import { EventsScreen } from './screens/EventsScreen';
import { EventDetailScreen } from './screens/EventDetailScreen';
import { MyPicksScreen } from './screens/MyPicksScreen';
import { ProposeScreen } from './screens/ProposeScreen';
import { TabBar } from './components/TabBar';
import { ContactBanner } from './components/ContactBanner';
import { OrganiserPanel } from './components/OrganiserPanel';
import { PriceLadderSheet } from './components/PriceLadderSheet';
import { VenueOfferModal } from './components/VenueOfferModal';
import { PrivacyNote } from './components/PrivacyNote';
import { InitialSheet } from './components/InitialSheet';
import { ContactForm } from './components/ContactForm';
import { Modal } from './components/Modal';

const Loading = () => (
  <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
    <div className="size-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
  </div>
);

const Failed = ({ message }: { message: string }) => (
  <div className="grid min-h-dvh place-items-center p-6">
    <div className="sheet max-w-sm rounded-sheet p-6">
      <h1 className="mb-2 font-display text-[24px] font-bold text-white">This page didn't load</h1>
      <p className="mb-5 text-[15px] leading-relaxed text-slate-300">{message}</p>
      <button onClick={() => window.location.reload()} className="gradient-brand min-h-12 w-full rounded-sheet font-display text-[19px] font-bold text-white">
        Try again
      </button>
    </div>
  </div>
);

/** Every sheet that can slide over the page. */
const Sheets = () => {
  const { state, actions } = useVisitor();
  return (
    <>
      <OrganiserPanel />
      <PriceLadderSheet />
      <Modal isOpen={state.sheet === 'contact'} onClose={actions.closeSheet} title="Hear when it's happening">
        <p className="mb-5 text-[15px] text-slate-300">
          Leave your WhatsApp and we'll tell you when one of your events is happening.
        </p>
        <ContactForm onSubmit={actions.submitContact} />
      </Modal>
      <VenueOfferModal isOpen={state.sheet === 'space'} onClose={actions.closeSheet} />
      <PrivacyNote isOpen={state.sheet === 'privacy'} onClose={actions.closeSheet} />
      <InitialSheet />
    </>
  );
};

const Screen = () => {
  const { state } = useVisitor();
  if (state.selected) return <EventDetailScreen event={state.selected} />;
  if (state.tab === 'propose') return <ProposeScreen />;
  if (state.tab === 'picks') return <MyPicksScreen />;
  return <EventsScreen />;
};

const Shell = () => {
  const { state } = useVisitor();
  if (state.phase === 'loading') return <Loading />;
  if (state.phase === 'error') return <Failed message={state.authError} />;

  return (
    <div className="min-h-dvh">
      <main className="pb-40">
        <Screen />
      </main>
      {!state.selected && (
        <>
          <ContactBanner />
          <TabBar />
        </>
      )}
      <Sheets />
      {state.toast && (
        <div role="status" className="sheet fixed bottom-28 left-1/2 z-[80] -translate-x-1/2 rounded-sheet px-4 py-2.5 text-[15px] text-white">
          {state.toast}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <VisitorProvider>
        <Shell />
      </VisitorProvider>
    </MotionConfig>
  );
}
