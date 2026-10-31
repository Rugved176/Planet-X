/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { LeftNavDock } from './components/LeftNavDock.tsx';
import { RegistrationModal } from './components/RegistrationModal.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ZonesPage } from './pages/ZonesPage.tsx';
import { EventDetailPage } from './pages/EventDetailPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AboutTeamPage } from './pages/AboutTeamPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { 
  CompetitionZone, 
  CompetitionEvent, 
  OrganizingTeamMember, 
  GlobalSettings, 
  Registration 
} from './types.ts';
import { api } from './lib/api.ts';

const DEFAULT_SETTINGS: GlobalSettings = {
  eventName: 'PLANET-X 2026',
  institution: "SVKM's NMIMS Global University, Dhule",
  eventDate: '2026-11-21',
  isProvisionalDate: true,
  venue: "SVKM's NMIMS Global University Campus, Dhule, Maharashtra",
  prizePool: 'INR 50,000',
  tagline: 'BEYOND INNOVATION. BEYOND LIMITS.',
  supportingTagline: 'THINK. CODE. CREATE. COMPETE.',
  organizerNotificationEmail: 'planetx.event@gmail.com',
  upiId: '9975952579@fam',
  paymentQrCodeUrl: '/assets/aistudio/image_6399a176.png',
  paymentInstructions: 'Scan official QR code (Rugved Solanki: 9975952579@fam) or pay via UPI. Upload your payment screenshot/slip and enter UTR reference.',
  contactEmail: 'planetx.event@gmail.com',
  contactPhone: '+91 9975952579'
};

function MainApp() {
  const { user } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedEventSlug, setSelectedEventSlug] = useState<string | null>(null);
  const [initialZoneFilter, setInitialZoneFilter] = useState<string>('all');

  // Config data from backend
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [zones, setZones] = useState<CompetitionZone[]>([]);
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<OrganizingTeamMember[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  // Active registration modal state
  const [registeringEvent, setRegisteringEvent] = useState<CompetitionEvent | null>(null);

  const fetchConfig = async () => {
    try {
      const res = await api.getPublicConfig();
      if (res) {
        if (res.settings) setSettings(res.settings);
        if (res.zones) setZones(res.zones);
        if (res.events) setEvents(res.events);
        if (res.teamMembers) setTeamMembers(res.teamMembers);
      }
    } catch (err) {
      console.warn('Public configuration fetch notice (using current state):', err);
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    // Auto-refresh config when window gains focus or online
    const handleFocus = () => {
      fetchConfig();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    // Optional 45-second background sync poll
    const intervalId = setInterval(fetchConfig, 45000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  const handleNavigate = (page: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh public config whenever user navigates
    fetchConfig();

    if (page === 'event-detail' && param) {
      setSelectedEventSlug(param);
      setCurrentPage('event-detail');
      return;
    }

    if (page === 'zones') {
      if (param) setInitialZoneFilter(param);
      else setInitialZoneFilter('all');
      setCurrentPage('zones');
      return;
    }

    if (page === 'events') {
      setInitialZoneFilter('all');
      setCurrentPage('zones');
      return;
    }

    setCurrentPage(page);
  };

  const handleRegisterEvent = (event: CompetitionEvent) => {
    if (!user) {
      setCurrentPage('auth');
    } else {
      setRegisteringEvent(event);
    }
  };

  const currentEvent = selectedEventSlug 
    ? events.find(e => e.slug === selectedEventSlug || e.id === selectedEventSlug) || events[0]
    : events[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#02040a] text-slate-100 relative">
      {/* Fixed Ambient Sci-Fi Neon Nebula Cityscape Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{
          backgroundImage: `url('/assets/aistudio/Neon_Nebula_Cityscape_fcfb5c7c.png')`,
        }}
      >
        {/* Ambient Darkened Cosmic Overlays for optimal contrast and readability */}
        <div className="absolute inset-0 bg-[#02040a]/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040a]/90 via-[#02040a]/40 to-[#02040a]/95" />
      </div>

      {/* Top Angular Polygonal Cyber Navigation Bar */}
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Fixed Left Vertical Navigation Dock (Matching reference video) */}
      <LeftNavDock currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Content Viewport */}
      <main className="flex-1 relative z-10">
        {currentPage === 'home' && (
          <HomePage
            settings={settings}
            zones={zones}
            events={events}
            teamMembers={teamMembers}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'zones' && (
          <ZonesPage
            zones={zones}
            events={events}
            initialZoneId={initialZoneFilter}
            onSelectEvent={(slug) => handleNavigate('event-detail', slug)}
            onRegisterEvent={handleRegisterEvent}
          />
        )}

        {currentPage === 'event-detail' && currentEvent && (
          <EventDetailPage
            event={currentEvent}
            settings={settings}
            onBack={() => handleNavigate('zones')}
            onRegister={() => handleRegisterEvent(currentEvent)}
          />
        )}

        {currentPage === 'about' && (
          <AboutTeamPage teamMembers={teamMembers} />
        )}

        {currentPage === 'contact' && (
          <ContactPage settings={settings} />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onSuccess={(target) => {
              handleNavigate(target || 'dashboard');
            }}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            settings={settings}
            zones={zones}
            events={events}
            onNavigate={handleNavigate}
            onRegisterEvent={handleRegisterEvent}
          />
        )}

        {currentPage === 'admin' && (
          <AdminDashboardPage
            settings={settings}
            zones={zones}
            events={events}
            teamMembers={teamMembers}
            onRefreshConfig={fetchConfig}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        eventDate={settings.eventDate}
        isProvisional={settings.isProvisionalDate}
      />

      {/* Dynamic Team Registration Modal */}
      {registeringEvent && (
        <RegistrationModal
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
          onSuccess={() => {
            setRegisteringEvent(null);
            handleNavigate('dashboard');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
