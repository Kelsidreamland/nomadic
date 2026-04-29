import { CheckCircle2, ChevronRight, FileText, Map, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: () => void;
  onManualSkip: () => void;
}

export const Onboarding = ({ onComplete, onManualSkip }: OnboardingProps) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-[var(--color-brand-sand)] z-50 overflow-y-auto animate-fade-in flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--color-brand-espresso)]">
            {t('onboarding.title')} <span className="text-[var(--color-brand-olive)] font-light block md:inline text-3xl md:text-6xl mt-2 md:mt-0 font-sans">{t('onboarding.subtitle')}</span>
          </h1>
          <p className="text-xl text-[var(--color-brand-espresso)]/60 max-w-2xl mx-auto font-medium">
            上傳行程單、貼上航班文字，或手動建立旅程。Nomadic 不需要讀取你的 Gmail，也能幫你整理行李限制與打包清單。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[var(--color-brand-cream)] rounded-3xl p-8 border border-[var(--color-brand-stone)] hover:border-[var(--color-brand-terracotta)] transition-colors">
            <div className="w-12 h-12 bg-[var(--color-brand-terracotta)] text-white rounded-2xl flex items-center justify-center mb-6">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-brand-espresso)] mb-3">行程單解析</h3>
            <p className="text-[var(--color-brand-espresso)]/60 mb-6">
              將航空公司確認信、行程文字或電子機票內容交給 AI，先解析再讓你確認。
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]">
                <CheckCircle2 size={16} className="text-[var(--color-brand-terracotta)]" /> <span>不需 Gmail 授權</span>
              </div>
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]">
                <CheckCircle2 size={16} className="text-[var(--color-brand-terracotta)]" /> <span>解析後可手動修正航班與行李限額</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-brand-cream)] rounded-3xl p-8 border border-[var(--color-brand-stone)] hover:border-[var(--color-brand-olive)] transition-colors">
            <div className="w-12 h-12 bg-[var(--color-brand-olive)] text-white rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-brand-espresso)] mb-3">AI 打包管家</h3>
            <p className="text-[var(--color-brand-espresso)]/60 mb-6">
              結合目的地、航班行李規則、衣物庫與打包清單，幫你做減法。
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]/80">
                <CheckCircle2 size={16} className="text-[var(--color-brand-olive)]" /> <span>可先手動建立旅程</span>
              </div>
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]/80">
                <CheckCircle2 size={16} className="text-[var(--color-brand-olive)]" /> <span>可直接從 Checklist 開始</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full space-y-4">
          <button
            onClick={onManualSkip}
            className="w-full py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02] bg-[var(--color-brand-terracotta)] text-white shadow-xl hover:shadow-2xl hover:bg-[var(--color-brand-terracotta-hover)]"
          >
            <Map size={20} />
            <span>建立我的第一趟旅程</span>
          </button>
          
          <button
            onClick={onComplete}
            className="w-full py-5 px-6 rounded-2xl font-bold text-lg text-[var(--color-brand-espresso)]/60 bg-[var(--color-brand-cream)] border-2 border-[var(--color-brand-stone)] hover:border-[var(--color-brand-olive)] hover:text-[var(--color-brand-espresso)] transition-all flex items-center justify-center space-x-2"
          >
            <span>先進入打包清單</span>
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};
