import { AIIcon, CheckIcon, CommentIcon } from '@/shared/ui/icons';
import landingPageStyles from './LandingPage.module.scss';

const CodeReviewIllustration = () => (
  <div className={landingPageStyles.landingHeroArt} aria-hidden="true">
    <div className={[landingPageStyles.panel, landingPageStyles.isCode].join(' ')}>
      <div className={landingPageStyles.bar}>
        <span />
        <span />
        <span />
      </div>
      <div className={[landingPageStyles.line, landingPageStyles.isWide].join(' ')} />
      <div className={[landingPageStyles.line, landingPageStyles.isAccent].join(' ')} />
      <div className={[landingPageStyles.line, landingPageStyles.isShort].join(' ')} />
      <div className={landingPageStyles.comment}>
        <CommentIcon />
        <span>inline review</span>
      </div>
    </div>

    <div className={[landingPageStyles.panel, landingPageStyles.isAi].join(' ')}>
      <AIIcon />
      <div>
        <strong>AI score</strong>
        <span>87/100</span>
      </div>
    </div>

    <div className={[landingPageStyles.panel, landingPageStyles.isThread].join(' ')}>
      <CheckIcon />
      <span>SOLID: ok</span>
    </div>
  </div>
);

export default CodeReviewIllustration;
