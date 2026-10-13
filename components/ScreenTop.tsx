// The top of each sign-up screen: a round back arrow and the 4-step progress bar.

type ScreenTopProps = {
  onBack: () => void;
  /** 1–4: email, code, name, birthday. Leave out to hide the bar (returning users). */
  step?: number;
};

export default function ScreenTop({ onBack, step }: ScreenTopProps) {
  return (
    <div className="screen-top">
      <button type="button" className="back-button" onClick={onBack} aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      {step !== undefined && (
        <div
          className="progress"
          role="progressbar"
          aria-label="Sign-up progress"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={step}
        >
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={n <= step ? "done" : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
