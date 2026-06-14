import { useState } from 'react';
import styles from './PsychologyView.module.css';

type Tab = 'tips' | 'daily' | 'core';

const TRADING_RULES = [
  "You should trade what is happening not what you think is going to happen",
  "Stop trading price and start trading time and liquidity",
  "Trade an eval like a master, don't mix it",
  "If it takes more than 20 days to pass a eval you're doing it wrong",
  "Some setups fail but the system still works, trust your strategy and process",
  "Your best trades feels boring if it feels exciting, you sized it too big",
  "If you're adjusting rules in mid trade, you never had rules to begin with",
  "If you need to trade everyday, you don't have an edge you have a habit",
  "Chasing payouts keeps you small, scaling keeps you funded",
  "If the RR isn't worth it, skip the trade",
  "One model. Mastered. Not ten half-learned.",
  "Trading ICT is cope. If your edge needs endless model names, it's not an edge. Real money is made on liquidity + execution, not narratives.",
  "Wins don't build traders. Non reactive losses do.",
  "The market doesn't trap you with bad trades. It traps you by making you feel smart right before you lose",
  "Your success in trading depends more on psychology and risk management than any strategy",
  "If you don't know what the Fed wants, stay flat. Clarity pays more than activity",
  "A missed trade costs nothing, but a forced one can cost you months of progress",
  "If you need hope for a trade to work, it's already the wrong trade",
  "No risk, no glory",
  "Wait for price to come to you. Chasing is expensive",
  "One good trade beats ten random ones",
  "Capital doesn't grow because you trade more. It grows because you lose less",
  "Everyone trades price. You trade time",
  "You don't need to be perfect, you just need to be consistent",
  "A losing trade is fine. A losing mindset is expensive",
  "Best trades don't need motivation. If you're convincing yourself to enter, skip it.",
  "A winning strategy with bad execution is still a losing strategy",
  "If you don't know why price should move, don't guess where it will.",
  "Breakeven isn't safety. It's fear management use it deliberately, not emotionally",
  "Knowing dozens of strategies won't make you profitable, mastering and consistently executing just one will.",
  "Is it truly a risk if the risk is leaving behind a life you never wanted to live anyway",
  "Your strategy makes money only if your emotions stay out of the trade",
  "If you're unsure, protect your capital. Opportunities are endless, capital is limited",
  "Never go against your own rules and if you start to feel stressed and your mental clarity slowly goes away, close the charts. Never trade if you're feeling bad"
];

function TipsTab() {
  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Trading Tips</h2>
          <p className={styles.subtitle}>Core rules to internalize</p>
        </div>
      </div>
      <div className={styles.rulesGrid}>
        {TRADING_RULES.map((rule, idx) => (
          <div key={idx} className={styles.ruleCard}>
            <div className={styles.ruleNum}>{String(idx + 1).padStart(2, '0')}</div>
            <div className={styles.ruleText}>{rule}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyFrameworkTab() {
  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Daily Framework</h2>
          <p className={styles.subtitle}>Routines and reflections</p>
        </div>
      </div>

      <div className={styles.frameworkGrid}>
        <div>
          <div className={styles.fwSection}>
            <div className={styles.fwTitle}>Stop trading if you feel...</div>
            <div className={styles.stopTags}>
              {['Anxious', 'Tilted', 'Tired', 'Greedy', 'In a rush', 'Pressured to make money'].map(t => (
                <span key={t} className={styles.stopTag}>{t}</span>
              ))}
            </div>

            <div className={styles.actionBox}>
              <div className={styles.actionBoxTitle}>Action Protocol</div>
              <div className={styles.actionBoxText}>
                Don't Rush. Stay calm. Wait. Execute.
                <span className={styles.actionBoxHighlight}>Detach from the outcome.</span>
              </div>
            </div>

            <div className={styles.focusBox}>
              <div className={styles.focusTitle}>Next Level Trading:</div>
              <div className={styles.focusItem}>Master <span className={styles.focusAccent}>ONE</span> model.</div>
              <div className={styles.focusItem}>Master <span className={styles.focusAccent}>ONE</span> asset.</div>
              <div className={styles.focusItem}>Master <span className={styles.focusAccent}>ONE</span> session.</div>
              <div className={styles.focusItem}>Master <span className={styles.focusAccent}>ONE</span> window of time.</div>
            </div>
          </div>
        </div>

        <div>
          <div className={styles.fwSection}>
            <div className={styles.fwTitle}>Weekly Report</div>
            <div className={styles.fwSubtitle}>Journal every single day without fail, don't be lazy.</div>
            <ul className={styles.chkList}>
              {['Trade Quality', 'Entry Strategy / Execution', 'Trade Management', 'Risk Management', 'Exit Strategy / Execution', 'Opportunities Taken'].map(i => (
                <li key={i} className={styles.chkItem}>
                  <div className={styles.chkBox}></div>
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.fwSection}>
            <div className={styles.fwTitle}>Ask Yourself:</div>
            <div className={styles.fwSubtitle}>Track your emotions before, during, and after a trade. Don't repeat the same mistakes.</div>
            <div className={styles.askGrid}>
              {[
                "1. Why do I have these emotions?",
                "2. How did they affect my execution?",
                "3. How can I solve these emotions?",
                "4. What problems did I face this week?",
                "5. What lowered the overall performance?",
                "6. What actions can I take next week to improve?",
                "7. What did I do well / learn to carry through?"
              ].map(q => <div key={q} className={styles.askCard}>{q}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorePhilosophyTab() {
  return (
    <div className={styles.coreWrap}>
      <div className={styles.bigSlogan}>KEEP GRINDING.</div>
      <div className={styles.coreIntro}>
        Always remember why you started trading. Probably to get rich, right? <span className={styles.coreIntroBold}>You will never get rich if you're gonna let your psychology affect your trading.</span> Always do your best to stay patient, calm, and mindful while trading these markets.<br /><br />
        <span className={styles.coreIntroRose}>Never go against your own rules and if you start to feel stressed and your mental clarity slowly goes away, close the charts. Never trade if you're feeling bad.</span>
      </div>

      <div className={styles.quotesGrid}>
        <div className={styles.quoteBlock}>
          <div className={styles.quoteText}>"To achieve a state of objectivity, you need to operate out of beliefs that allow for anything to happen.<br /><br />Let go of things that you can't control. Your goal as a trader is to fight today and live for another day. The one thing you can control is yourself."</div>
          <div className={styles.quoteAuthor}>- Mark Douglas</div>
        </div>

        <div className={`${styles.quoteBlock} ${styles.quoteBlockPurple}`}>
          <div className={styles.quoteText}>"To be a successful trader, you need to have a complete absence of fear and regret. Every moment in the market is unique.<br /><br />Waste no more time arguing what a good man should be. Be One."</div>
          <div className={`${styles.quoteAuthor} ${styles.quoteAuthorPurple}`}>- Marcus Aurelius</div>
        </div>
      </div>

      <div className={styles.bruteTruth}>
        <div className={styles.bruteTruthTitle}>The Brutal Truth</div>
        <div className={styles.bruteTruthText}>
          In trading, you need to handle rejection—make a decision, stick to it, and if it goes against you, <span className={styles.coreIntroRose}>take the loss and move on.</span>
        </div>
        <div className={styles.bruteTruthText}>
          You have to understand that even if your model occurs, that doesn't mean you have to take it. Now you know when it's low probability. So, you will be well organized with only high probability setups.
        </div>

        <div className={styles.bruteCards}>
          <div className={styles.bruteCard}>
            <div className={`${styles.bruteCardTitle} ${styles.bruteCardTitleCyan}`}>By detachment from the outcome:</div>
            • Don't focus on the P/L.<br />
            • Focus on building the right habits.<br />
            • And the edge will come.
          </div>
          <div className={`${styles.bruteCard} ${styles.bruteCardPurple}`}>
            <div className={`${styles.bruteCardTitle} ${styles.bruteCardTitlePurple}`}>After understanding this:</div>
            Your trading plan will deliberately avoid unnecessary losses. That's where your wins will matter. The rest is about following the absolute plan.
          </div>
        </div>

        <div className={styles.lockIn}>
          <div className={styles.lockInMain}>
            Be Cold minded. Fuck your tired body.<br />
            Growth is painful, <u style={{ textDecorationColor: 'var(--accent-cyan)' }}>But worth it.</u>
          </div>
          <div style={{ marginTop: 20 }}>
            Take the biggest fucking risks of your entire life right now.
            <div className={styles.lockInAccent}>LOCK IN.</div>
            <div className={styles.lockInDiscipline}>Be Disciplined.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PsychologyView() {
  const [tab, setTab] = useState<Tab>('tips');

  return (
    <div>
      <div className={styles.tabNav}>
        {([
          { id: 'tips',    label: 'Trading Tips' },
          { id: 'daily',   label: 'Daily Framework' },
          { id: 'core',    label: 'Core Philosophy' }
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

      {tab === 'tips'    && <TipsTab />}
      {tab === 'daily'   && <DailyFrameworkTab />}
      {tab === 'core'    && <CorePhilosophyTab />}
    </div>
  );
}
