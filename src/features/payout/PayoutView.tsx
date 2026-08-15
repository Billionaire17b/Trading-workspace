import { useState, useMemo } from 'react';
import styles from './PayoutView.module.css';

/* ── Account size options ───────────────────────────────── */
const ACCOUNT_SIZES = [10_000, 25_000, 50_000, 100_000, 150_000];

/* ── Preset configs ─────────────────────────────────────── */
const PRESETS: { label: string; return: number }[] = [
  { label: 'Conservative 1%', return: 1 },
  { label: 'Strong 3%',       return: 3 },
  { label: 'Elite 5%',        return: 5 },
];

/* ── Profit split options ───────────────────────────────── */
const SPLIT_OPTIONS = [50, 70, 75, 80, 85, 90];

export default function PayoutView() {
  const [accountSize, setAccountSize] = useState(50_000);
  const [monthlyReturn, setMonthlyReturn] = useState(3);
  const [profitSplit, setProfitSplit] = useState(90);

  const results = useMemo(() => {
    const grossProfit = accountSize * (monthlyReturn / 100);
    const yourShare = grossProfit * (profitSplit / 100);
    const annualEstimate = yourShare * 12;

    return {
      grossProfit,
      yourShare,
      annualEstimate,
    };
  }, [accountSize, monthlyReturn, profitSplit]);

  const isCustomReturn = !PRESETS.some(p => p.return === monthlyReturn);
  const isCustomSplit = !SPLIT_OPTIONS.includes(profitSplit);
  const sliderFillPct = Math.min((monthlyReturn / 10) * 100, 100);

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Payout Calculator</h2>
        <p className={styles.subtitle}>
          Estimate your monthly earnings based on account size, return rate, and profit split
        </p>
      </div>

      <div className={styles.wrapper}>
        {/* ── Left: Controls ──────────────────────── */}
        <div className={styles.controls}>
          {/* Account Size */}
          <div>
            <div className={styles.sectionLabel}>Account Size</div>
            <div className={styles.pillGroup}>
              {ACCOUNT_SIZES.map(size => (
                <button
                  key={size}
                  className={`${styles.pill} ${accountSize === size ? styles.pillActive : ''}`}
                  onClick={() => setAccountSize(size)}
                >
                  ${size.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Return Slider */}
          <div className={styles.sliderSection}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>Monthly Return</span>
              <div className={styles.customInputInline}>
                <input
                  type="number"
                  className={styles.customInlineField}
                  value={monthlyReturn}
                  min={0}
                  max={100}
                  step={0.1}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 0) setMonthlyReturn(v);
                  }}
                />
                <span className={styles.customInlineSuffix}>%</span>
              </div>
            </div>
            <div className={styles.sliderTrack}>
              <div className={styles.sliderFill} style={{ width: `${sliderFillPct}%` }} />
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={10}
                step={0.5}
                value={Math.min(monthlyReturn, 10)}
                onChange={e => setMonthlyReturn(parseFloat(e.target.value))}
              />
            </div>
            <div className={styles.sliderTicks}>
              <span className={styles.sliderTick}>0%</span>
              <span className={styles.sliderTick}>5%</span>
              <span className={styles.sliderTick}>10%</span>
            </div>
          </div>

          {/* Presets */}
          <div className={styles.presetsGroup}>
            <div className={styles.sectionLabel}>Presets</div>
            <div className={styles.presetPills}>
              {PRESETS.map(preset => (
                <button
                  key={preset.label}
                  className={`${styles.presetPill} ${!isCustomReturn && preset.return === monthlyReturn ? styles.presetActive : ''}`}
                  onClick={() => setMonthlyReturn(preset.return)}
                >
                  {preset.label}
                </button>
              ))}
              <button
                className={`${styles.presetPill} ${isCustomReturn ? styles.presetActive : ''}`}
                onClick={() => setMonthlyReturn(2.5)}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Profit Split */}
          <div className={styles.splitSection}>
            <div className={styles.sectionLabel}>Profit Split</div>
            <div className={styles.splitPills}>
              {SPLIT_OPTIONS.map(split => (
                <button
                  key={split}
                  className={`${styles.splitPill} ${!isCustomSplit && profitSplit === split ? styles.splitActive : ''}`}
                  onClick={() => setProfitSplit(split)}
                >
                  {split}%
                </button>
              ))}
              <button
                className={`${styles.splitPill} ${isCustomSplit ? styles.splitActive : ''}`}
                onClick={() => setProfitSplit(65)}
              >
                Custom
              </button>
            </div>
            {isCustomSplit && (
              <div className={styles.customInputRow}>
                <input
                  type="number"
                  className={styles.customInput}
                  value={profitSplit}
                  min={0}
                  max={100}
                  step={1}
                  placeholder="Enter %"
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 0 && v <= 100) setProfitSplit(v);
                  }}
                />
                <span className={styles.customInputSuffix}>%</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Results ──────────────────────── */}
        <div className={styles.results}>
          <div className={styles.resultHeader}>
            <span className={styles.resultHeaderLabel}>Estimated Monthly Payout</span>
            <span className={styles.resultMainValue}>
              ${results.yourShare.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className={styles.resultMainSub}>
              Per Month · Up to {profitSplit}% Profit Split
            </span>
          </div>

          <div className={styles.breakdown}>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Account Size</span>
              <span className={styles.breakdownValue}>${accountSize.toLocaleString()}</span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Monthly Return</span>
              <span className={styles.breakdownValue}>{monthlyReturn}%</span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Gross Profit</span>
              <span className={styles.breakdownValue}>
                ${results.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Your Share (Up to {profitSplit}%)</span>
              <span className={styles.breakdownValue}>
                ${results.yourShare.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>Annual Estimate</span>
              <span className={styles.breakdownValue}>
                ${results.annualEstimate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className={styles.disclaimer}>
            Example return rates. Actual results vary. Past performance does not guarantee future results.
          </div>
        </div>
      </div>
    </div>
  );
}
