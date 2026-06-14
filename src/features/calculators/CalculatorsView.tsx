import React, { useState, useRef, useCallback } from 'react';
import styles from './CalculatorsView.module.css';

/* ── Types ──────────────────────────────────────────────── */
type Tab = 'futures' | 'consistency';

interface ConsistencyResult {
  score: number;
  required: number;
  progress: number;
  profitTargetAmount: number | null;
  passes: boolean;
  message: string;
}

interface InstrumentSpec {
  label: string;
  point: number;
  tick: number;
}

const SPECS: Record<string, InstrumentSpec> = {
  NQ:   { label: 'E-mini NQ',        point: 20,    tick: 5      },
  MNQ:  { label: 'Micro NQ',         point: 2,     tick: 0.5    },
  ES:   { label: 'E-mini ES',        point: 50,    tick: 12.5   },
  MES:  { label: 'Micro ES',         point: 5,     tick: 1.25   },
  YM:   { label: 'E-mini YM',        point: 5,     tick: 5      },
  MYM:  { label: 'Micro YM',         point: 0.5,   tick: 0.5    },
  RTY:  { label: 'E-mini RTY',       point: 50,    tick: 5      },
  MRTY: { label: 'Micro RTY',        point: 5,     tick: 0.5    },
  GC:   { label: 'Gold (GC)',        point: 100,   tick: 10     },
  MGC:  { label: 'Micro Gold (MGC)', point: 10,    tick: 1      },
  SI:   { label: 'Silver (SI)',      point: 50,    tick: 25     },
  MSI:  { label: 'Micro Silver',     point: 5,     tick: 2.5    },
  CL:   { label: 'Crude Oil (CL)',   point: 1000,  tick: 10     },
  MCL:  { label: 'Micro Crude (MCL)',point: 100,   tick: 1      },
};

/* ── Stepper Component ────────────────────────────────────── */
function StepperInput({
  label, value, onChange, placeholder, step = 1
}: {
  label: string; value: string | number; onChange: (val: string) => void;
  placeholder?: string; step?: number;
}) {
  const timeoutRef = useRef<number | undefined>(undefined);
  const intervalRef = useRef<number | undefined>(undefined);
  const valueRef = useRef(value);
  valueRef.current = value;

  const handleStep = useCallback((dir: number) => {
    const current = parseFloat(valueRef.current as string) || 0;
    onChange(String(Math.max(0, current + dir * step)));
  }, [onChange, step]);

  const startHold = useCallback((dir: number, e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // Only left clicks
    // Clear any existing hold
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    
    // Increment immediately
    handleStep(dir);

    // After 400ms delay, start fast repeating
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        handleStep(dir);
      }, 80);
    }, 400);
  }, [handleStep]);

  const stopHold = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
  }, []);

  return (
    <div className={styles.stepperGroup}>
      <label className={styles.formLabel}>{label}</label>
      <div className={styles.stepper}>
        <input
          className={styles.stepperInput} type="number" placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
        <button
          className={`${styles.stepBtn} ${styles.stepBtnRight}`}
          onPointerDown={(e) => startHold(-1, e)}
          onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: 'none' }}
        >−</button>
        <button
          className={`${styles.stepBtn} ${styles.stepBtnRight}`}
          onPointerDown={(e) => startHold(1, e)}
          onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: 'none' }}
        >+</button>
      </div>
    </div>
  );
}

/* ── Futures Calculator ─────────────────────────────────── */
function FuturesCalc() {
  const [instrument, setInstrument] = useState('NQ');
  const [contracts,  setContracts]  = useState<string>('0');
  const [points,     setPoints]     = useState<string>('0');
  const [ticks,      setTicks]      = useState<string>('0');
  const spec = SPECS[instrument];
  const c = parseInt(contracts) || 0;
  const p = parseInt(points) || 0;
  const t = parseInt(ticks) || 0;
  const total = c * (p * spec.point + t * spec.tick);

  const reset = () => { setContracts('0'); setPoints('0'); setTicks('0'); };

  return (
    <div className={styles.calcSection}>
      <div className={styles.calcTitle}>Futures Calculator</div>
      <div className={styles.calcSubtitle}>Calculate P&L for futures instruments in USD</div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
          <label className={styles.formLabel}>Instrument</label>
          <select
            className={styles.formSelect}
            value={instrument}
            onChange={e => setInstrument(e.target.value)}
          >
            {Object.entries(SPECS).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </div>

        <StepperInput
          label="Contracts" value={contracts} onChange={setContracts}
        />
        <StepperInput
          label="Points" value={points} onChange={setPoints}
        />
        <StepperInput
          label="Ticks" value={ticks} onChange={setTicks}
        />

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Tick Size</label>
          <div className={styles.resultCard} style={{ padding: '12px 14px' }}>
            <div className={styles.resultValue} style={{ fontSize: 16 }}>
              1 pt = ${spec.point} &nbsp;|&nbsp; 1 tick = ${spec.tick}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.btnRow}>
        <button className={styles.resetBtn} onClick={reset}>Reset</button>
      </div>

      <div className={styles.futuresResult}>
        <div className={styles.futuresResultAmount}>
          ${total.toFixed(2)} USD
        </div>
        <div className={styles.futuresResultNote}>
          {c} contract{c !== 1 ? 's' : ''} × ({p} pts + {t} ticks) on {spec.label}
        </div>
      </div>
    </div>
  );
}

/* ── Consistency Rule Calculator ────────────────────────── */
function ConsistencyCalc() {
  const [accountSize,      setAccountSize]      = useState('');
  const [profitTargetPct,  setProfitTargetPct]  = useState('');
  const [totalNetProfit,   setTotalNetProfit]   = useState('');
  const [bestDayProfit,    setBestDayProfit]    = useState('');
  const [limitPct,         setLimitPct]         = useState('40');
  const [result, setResult] = useState<ConsistencyResult | null>(null);

  const calculate = () => {
    const tnp  = parseFloat(totalNetProfit);
    const bdp  = parseFloat(bestDayProfit);
    const lim  = parseFloat(limitPct) || 40;
    const acc  = parseFloat(accountSize) || 0;
    const tgt  = parseFloat(profitTargetPct) || 0;
    if (isNaN(tnp) || isNaN(bdp) || tnp <= 0 || bdp <= 0) return;

    const score    = (bdp / tnp) * 100;
    const required = bdp / (lim / 100);
    const progress = Math.min((tnp / required) * 100, 100);
    const passes   = score <= lim;
    const profitTargetAmount = acc > 0 && tgt > 0 ? acc * (tgt / 100) : null;
    const pctLeft  = (lim - score).toFixed(1);
    const message  = passes
      ? `✓ Passing — best day is ${score.toFixed(1)}% of net profit (limit ${lim}%). You have ${pctLeft}% of room left.`
      : `✗ Failing — best day is ${score.toFixed(1)}% of net profit (limit ${lim}%). Reduce single-day gains or grow total profit.`;

    setResult({ score, required, progress, profitTargetAmount, passes, message });
  };

  const example = () => {
    setAccountSize('50000'); setProfitTargetPct('10');
    setTotalNetProfit('2000'); setBestDayProfit('600'); setLimitPct('40');
    setResult(null);
  };

  return (
    <div className={styles.calcSection}>
      <div className={styles.calcTitle}>Consistency Rule Calculator</div>
      <div className={styles.calcSubtitle}>Check whether your best trading day stays within the consistency rule limit</div>

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Account Size (Optional)</label>
          <input className={styles.formInput} type="number" placeholder="e.g. 50000"
            value={accountSize} onChange={e => setAccountSize(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Profit Target % (Optional)</label>
          <input className={styles.formInput} type="number" placeholder="e.g. 10"
            value={profitTargetPct} onChange={e => setProfitTargetPct(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Total Net Profit ($)</label>
          <input className={styles.formInput} type="number" placeholder="e.g. 2000"
            value={totalNetProfit} onChange={e => setTotalNetProfit(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Best Day Profit ($)</label>
          <input className={styles.formInput} type="number" placeholder="e.g. 600"
            value={bestDayProfit} onChange={e => setBestDayProfit(e.target.value)} />
        </div>
        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
          <label className={styles.formLabel}>Consistency Rule Limit (%)</label>
          <input className={styles.formInput} type="number" placeholder="40"
            value={limitPct} onChange={e => setLimitPct(e.target.value)} />
        </div>
      </div>

      <div className={styles.btnRow}>
        <button className={styles.calcBtn} onClick={calculate}>Calculate</button>
        <button className={styles.resetBtn} onClick={example}>Load Example</button>
      </div>

      {result && (
        <>
          <div className={styles.resultsGrid}>
            <div className={styles.resultCard}>
              <div className={styles.resultLabel}>Consistency Score</div>
              <div className={styles.resultValue}>{result.score.toFixed(1)}%</div>
              <div className={styles.progressBarWrap}>
                <div className={styles.progressBarFill} style={{ width: `${Math.min(result.score, 100)}%` }} />
              </div>
            </div>
            <div className={styles.resultCard}>
              <div className={styles.resultLabel}>Required Total Profit</div>
              <div className={styles.resultValue}>${result.required.toFixed(0)}</div>
              <div className={styles.resultUnit}>to pass at current best day</div>
            </div>
            <div className={styles.resultCard}>
              <div className={styles.resultLabel}>Progress to Required</div>
              <div className={styles.resultValue}>{result.progress.toFixed(1)}%</div>
              <div className={styles.progressBarWrap}>
                <div className={styles.progressBarFill} style={{ width: `${result.progress}%` }} />
              </div>
            </div>
            {result.profitTargetAmount !== null && (
              <div className={styles.resultCard}>
                <div className={styles.resultLabel}>Profit Target Amount</div>
                <div className={styles.resultValue}>${result.profitTargetAmount.toFixed(0)}</div>
                <div className={styles.resultUnit}>at {profitTargetPct}% of account</div>
              </div>
            )}
          </div>

          <div className={`${styles.statusCard} ${result.passes ? styles.statusPass : styles.statusFail}`}>
            {result.message}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main view ──────────────────────────────────────────── */
export default function CalculatorsView() {
  const [tab, setTab] = useState<Tab>('futures');

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Calculators</h2>
        <p className={styles.subtitle}>Professional trading calculators for every scenario</p>
      </div>

      <div className={styles.tabNav}>
        {([
          { id: 'futures',     label: 'Futures'       },
          { id: 'consistency', label: 'Consistency'   },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            className={`${styles.tabBtn} ${tab === t.id ? styles.tabBtnActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'futures'     && <FuturesCalc />}
      {tab === 'consistency' && <ConsistencyCalc />}
    </div>
  );
}
