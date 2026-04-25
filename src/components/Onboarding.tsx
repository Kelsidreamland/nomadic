import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { syncGmailFlights } from '../services/google';
import { Calendar, CheckCircle2, ChevronRight, Mail, Map, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface OnboardingProps {
  onComplete: () => void;
  onManualSkip: () => void;
}

export const Onboarding = ({ onComplete, onManualSkip }: OnboardingProps) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSyncing(true);
      try {
        await syncGmailFlights(tokenResponse.access_token);
        onComplete();
      } catch (error) {
        console.error("Failed to sync flights:", error);
        alert("Sync failed. Please try again.");
      } finally {
        setIsSyncing(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
    onError: (errorResponse: any) => {
      console.error('Login Failed', errorResponse);
      if (errorResponse?.error === 'redirect_uri_mismatch') {
        alert("Google Login Failed: Redirect URI mismatch. Please check your Google Cloud Console configuration.");
      } else {
        alert("Google Login Failed");
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-[var(--color-brand-cream)] z-50 overflow-y-auto animate-fade-in flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--color-brand-espresso)]">
            Nomadic <span className="text-[var(--color-brand-espresso)]/30 font-light block md:inline text-3xl md:text-6xl mt-2 md:mt-0">: my luggage</span>
          </h1>
          <p className="text-xl text-[var(--color-brand-espresso)]/60 max-w-2xl mx-auto font-medium">
            The minimalist packing companion designed for digital nomads and frequent travelers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Feature 1: Auto Sync */}
          <div className="bg-[var(--color-brand-sand)] rounded-3xl p-8 border border-[var(--color-brand-stone)] hover:border-[var(--color-brand-stone)] transition-colors">
            <div className="w-12 h-12 bg-[var(--color-brand-espresso)] text-white rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-brand-espresso)] mb-3">1. Smart Auto-Sync</h3>
            <p className="text-[var(--color-brand-espresso)]/60 mb-6">
              Connect your Google account and let Nomadic automatically detect upcoming flights from your Calendar and Gmail. We'll analyze the destination's weather and suggest the perfect capsule wardrobe.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]">
                <CheckCircle2 size={16} /> <span>Weather-based recommendations</span>
              </div>
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]">
                <CheckCircle2 size={16} /> <span>Luggage allowance tracking</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Manual Control */}
          <div className="bg-[var(--color-brand-cream)] rounded-3xl p-8 border-2 border-[var(--color-brand-stone)] hover:border-[var(--color-brand-stone)] transition-colors">
            <div className="w-12 h-12 bg-gray-100 text-[var(--color-brand-espresso)] rounded-2xl flex items-center justify-center mb-6">
              <Map size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-brand-espresso)] mb-3">2. Total Manual Control</h3>
            <p className="text-[var(--color-brand-espresso)]/60 mb-6">
              Prefer to keep things offline? Manually input your flight details and build your packing list from scratch. Add custom items and track your luggage weight with precision.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]/60">
                <CheckCircle2 size={16} /> <span>Custom To-Do lists</span>
              </div>
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]/60">
                <CheckCircle2 size={16} /> <span>Smart essential suggestions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full space-y-4">
          <button
            onClick={() => login()}
            disabled={isSyncing}
            className={clsx(
              "w-full py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02]",
              isSyncing ? "bg-gray-200 text-[var(--color-brand-espresso)]/60" : "bg-[var(--color-brand-espresso)] text-white shadow-xl hover:shadow-2xl"
            )}
          >
            {isSyncing ? (
              <span>Syncing Data...</span>
            ) : (
              <>
                <Calendar size={20} />
                <Mail size={20} />
                <span>Authorize Google (Recommended)</span>
              </>
            )}
          </button>
          
          <button
            onClick={onManualSkip}
            className="w-full py-5 px-6 rounded-2xl font-bold text-lg text-[var(--color-brand-espresso)]/60 bg-[var(--color-brand-cream)] border-2 border-[var(--color-brand-stone)] hover:border-gray-300 hover:text-[var(--color-brand-espresso)] transition-all flex items-center justify-center space-x-2"
          >
            <span>Skip & Enter Manually</span>
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};
