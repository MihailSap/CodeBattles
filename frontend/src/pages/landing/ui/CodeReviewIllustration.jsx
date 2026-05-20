import { AIIcon, CheckIcon, CommentIcon } from '@/shared/ui/icons';

const CodeReviewIllustration = () => (
  <div className="landing-hero-art" aria-hidden="true">
    <div className="landing-hero-art__panel landing-hero-art__panel--code">
      <div className="landing-hero-art__bar">
        <span />
        <span />
        <span />
      </div>
      <div className="landing-hero-art__line landing-hero-art__line--wide" />
      <div className="landing-hero-art__line landing-hero-art__line--accent" />
      <div className="landing-hero-art__line landing-hero-art__line--short" />
      <div className="landing-hero-art__comment">
        <CommentIcon />
        <span>inline review</span>
      </div>
    </div>

    <div className="landing-hero-art__panel landing-hero-art__panel--ai">
      <AIIcon />
      <div>
        <strong>AI score</strong>
        <span>87/100</span>
      </div>
    </div>

    <div className="landing-hero-art__panel landing-hero-art__panel--thread">
      <CheckIcon />
      <span>SOLID: ok</span>
    </div>
  </div>
);

export default CodeReviewIllustration;
