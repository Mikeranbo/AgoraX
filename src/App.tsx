import React from 'react';
import { MotionConfig } from 'motion/react';
import { VisitorProvider, useVisitor } from './state/VisitorProvider';
import { useWideScreen } from './state/useWideScreen';
import { EventsScreen } from './screens/EventsScreen';
import { EventDetailScreen } from './screens/EventDetailScreen';
import { MyPicksScreen, SavedScreen } from './screens/MyPicksScreen';
import { ProposeScreen } from './screens/ProposeScreen';
import { MyProposalsScreen } from './screens/MyProposalsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AccountScreen, NotificationsScreen } from './screens/SettingsScreens';
import { PrivacyNoticeScreen } from './screens/PrivacyNoticeScreen';
import { FaqScreen, HowItWorksScreen, MyDataScreen } from './screens/AccountScreens';
import { TabBar } from './components/TabBar';
import { ContactBanner } from './components/ContactBanner';
import { OrganiserPanel } from './components/OrganiserPanel';
import { PriceLadderSheet } from './components/PriceLadderSheet';
import { VenueOfferModal } from './components/VenueOfferModal';
import { InitialSheet } from './components/InitialSheet';
import { LockedSheet, ModeSheet, ProfileSheet } from './components/AccountSheets';
import { DesktopSidebar, MenuButton, SidebarDrawer } from './components/Sidebar';
import { AccountMenu } from './components/AccountMenu';
import { SiteFooter } from './components/SiteFooter';
import { ContactForm } from './components/ContactForm';
import { Modal } from './components/Modal';

const Loading = () => (
  <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
    <div className="size-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent motion-reduce:animate-none" />
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
      <Modal isOpen={state.sheet === 'contact'} onClose={actions.closeSheet} title="Hear whether it goes ahead">
        <p className="mb-5 text-[15px] text-slate-300">
          Leave an email or WhatsApp number and we'll tell you whether the events you're interested in go ahead, are cancelled or won't
          happen.
        </p>
        <ContactForm onSubmit={actions.submitContact} />
      </Modal>
      <VenueOfferModal isOpen={state.sheet === 'space'} onClose={actions.closeSheet} />
      <InitialSheet />
      <LockedSheet />
      <ProfileSheet />
      <ModeSheet />
    </>
  );
};

const Screen = () => {
  const { state } = useVisitor();
  if (state.selected) return <EventDetailScreen event={state.selected} />;
  switch (state.tab) {
    case 'propose':
      // A different draft (or a fresh form) starts from its own values.
      return <ProposeScreen key={state.editing?.id ?? 'new'} />;
    case 'picks':
      return <MyPicksScreen />;
    case 'saved':
      return <SavedScreen />;
    case 'proposals':
      return <MyProposalsScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'data':
      return <MyDataScreen />;
    case 'notifications':
      return <NotificationsScreen />;
    case 'account':
      return <AccountScreen />;
    case 'notice':
      return <PrivacyNoticeScreen />;
    case 'how':
      return <HowItWorksScreen />;
    case 'faq':
      return <FaqScreen />;
    default:
      return <EventsScreen />;
  }
};

const Shell = () => {
  const { state } = useVisitor();
  const wide = useWideScreen();
  if (state.phase === 'loading') return <Loading />;
  if (state.phase === 'error') return <Failed message={state.authError} />;

  // The page and the bars fixed to it start where the open laptop sidebar ends.
  const navWidth = wide && state.sidebarOpen ? '20rem' : '0px';

  return (
    <div className="min-h-dvh" style={{ '--nav-w': navWidth } as React.CSSProperties}>
      <DesktopSidebar />
      <SidebarDrawer />
      <MenuButton />
      <AccountMenu />
      <div inert={state.drawerOpen || undefined} className="lg:pl-[var(--nav-w)]">
        <main className="pb-16">
          <Screen />
        </main>
        <SiteFooter />
      </div>
      {!state.selected && (
        <>
          <ContactBanner />
          <TabBar />
        </>
      )}
      <Sheets />
      {state.toast && (
        <div
          role="status"
          className="sheet fixed bottom-28 left-1/2 z-[80] -translate-x-1/2 rounded-sheet px-4 py-2.5 text-[15px] text-white lg:bottom-8 lg:ml-[calc(var(--nav-w)/2)]"
        >
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
