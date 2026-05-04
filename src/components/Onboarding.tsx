import { useState } from 'react';
import { Camera, Briefcase, ArrowRight, Plus, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

const luggageSizePresets = [
  { label: '30"', length: 78, width: 52, height: 31 },
  { label: '28"', length: 75, width: 49, height: 30 },
  { label: '26"', length: 68, width: 45, height: 28 },
  { label: '24"', length: 61, width: 41, height: 26 },
  { label: '22"', length: 56, width: 38, height: 24 },
  { label: '20"', length: 55, width: 36, height: 23 },
];

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setActiveLuggageId } = useStore();
  const [step, setStep] = useState(0);
  const [luggageName, setLuggageName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [createdLuggageId, setCreatedLuggageId] = useState<string | null>(null);

  const completeOnboarding = (destination?: string) => {
    if (createdLuggageId) {
      setActiveLuggageId(createdLuggageId);
    }

    onComplete();
    navigate(destination || (createdLuggageId ? '/items' : '/luggages'));
  };

  const handleCreateLuggage = async () => {
    if (!luggageName.trim()) return;
    const preset = selectedPreset !== null ? luggageSizePresets[selectedPreset] : luggageSizePresets[2];
    const luggageId = uuidv4();
    await db.luggages.add({
      id: luggageId,
      name: luggageName.trim(),
      type: preset.label === '20"' || preset.label === '22"' ? '手提' : '托运',
      season: '混合',
      length: preset.length,
      width: preset.width,
      height: preset.height,
      weightHistory: [],
      createdAt: Date.now(),
    });
    setCreatedLuggageId(luggageId);
    setStep(2);
  };

  if (step === 0) {
    return (
      <div className="fixed inset-0 bg-[var(--color-brand-sand)] z-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-[var(--color-brand-terracotta)] text-white rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-[var(--color-brand-terracotta)]/20">
          <Briefcase size={40} strokeWidth={2} />
        </div>
        <h1 className="text-5xl font-black tracking-tighter text-[var(--color-brand-espresso)] mb-4">Nomadic</h1>
        <p className="text-lg text-[var(--color-brand-espresso)]/60 max-w-md mb-12 leading-relaxed">
          {t('onboarding.introDesc')}<br />{t('app.tagline')}
        </p>
        <button
          onClick={() => setStep(1)}
          className="bg-[var(--color-brand-espresso)] text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-black transition-colors flex items-center space-x-2"
        >
          <span>{t('onboarding.btnStart')}</span>
          <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-[var(--color-brand-sand)] z-50 flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[var(--color-brand-olive)] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--color-brand-olive)]/20">
              <Briefcase size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-brand-espresso)]">{t('onboarding.step1Title')}</h2>
            <p className="text-sm text-[var(--color-brand-espresso)]/60 mt-2">{t('onboarding.step1Desc')}</p>
          </div>

          <input
            type="text"
            placeholder={t('luggages.namePlaceholder')}
            value={luggageName}
            onChange={e => setLuggageName(e.target.value)}
            className="w-full px-4 py-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-lg"
            autoFocus
          />

          <div>
            <label className="text-sm font-bold text-[var(--color-brand-espresso)]/60 mb-2 block">{t('onboarding.chooseSize')}</label>
            <div className="grid grid-cols-3 gap-2">
              {luggageSizePresets.map((preset, i) => (
                <button
                  key={preset.label}
                  onClick={() => setSelectedPreset(i)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                    selectedPreset === i
                      ? 'bg-[var(--color-brand-espresso)] text-white shadow-md'
                      : 'bg-white border border-[var(--color-brand-stone)] text-[var(--color-brand-espresso)]/70 hover:border-[var(--color-brand-terracotta)]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateLuggage}
            disabled={!luggageName.trim()}
            className="w-full py-4 bg-[var(--color-brand-espresso)] disabled:opacity-30 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-black transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span>{t('onboarding.btnCreateLuggage')}</span>
          </button>

          <button
            onClick={() => completeOnboarding('/luggages')}
            className="w-full py-3 text-[var(--color-brand-espresso)]/50 text-sm font-medium hover:text-[var(--color-brand-espresso)] transition-colors"
          >
            {t('onboarding.btnSkip')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--color-brand-sand)] z-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--color-brand-terracotta)] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--color-brand-terracotta)]/20">
            <Camera size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-brand-espresso)]">{t('onboarding.step2Title')}</h2>
          <p className="text-sm text-[var(--color-brand-espresso)]/60 mt-2">{t('onboarding.step2Desc')}</p>
        </div>

        <div className="flex flex-col items-center justify-center w-full h-48 bg-white rounded-3xl border-2 border-dashed border-[var(--color-brand-stone)] transition-colors">
          <Camera size={40} className="text-[var(--color-brand-espresso)]/30 mb-3" />
          <span className="font-bold text-[var(--color-brand-espresso)]/60">{t('items.takePhoto')}</span>
          <span className="mt-2 max-w-xs text-sm text-[var(--color-brand-espresso)]/40">{t('items.assigningTo', { name: luggageName.trim() || 'Nomadic' })}</span>
        </div>

        <button
          onClick={() => completeOnboarding('/items')}
          className="w-full py-4 bg-[var(--color-brand-espresso)] text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-black transition-colors flex items-center justify-center space-x-2"
        >
          <CheckCircle2 size={20} />
          <span>{t('onboarding.btnGoToItems')}</span>
        </button>

        <button
          onClick={() => completeOnboarding('/luggages')}
          className="w-full py-3 text-[var(--color-brand-espresso)]/50 text-sm font-medium hover:text-[var(--color-brand-espresso)] transition-colors"
        >
          {t('onboarding.btnLater')}
        </button>
      </div>
    </div>
  );
};
