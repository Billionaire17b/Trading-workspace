import { useState, useRef, useCallback } from 'react';
import styles from './TweetSnapView.module.css';

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

const BADGE_PATH = 'M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-4.86 1.42 1.41-6.2 6.35z';
const X_LOGO_PATH = 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';
const DEFAULT_AVATAR = (
  <svg viewBox="0 0 24 24" width="78%" height="78%" fill="#99AAB5">
    <path d="M12 13c2.4 0 4.3-1.9 4.3-4.3S14.4 4.4 12 4.4 7.7 6.3 7.7 8.7 9.6 13 12 13z"/>
    <path d="M5.5 20.7v-.4c0-3.7 2.9-6.6 6.5-6.6s6.5 2.9 6.5 6.6v.4c0 .7-.5 1.3-1.2 1.3H6.7c-.7 0-1.2-.6-1.2-1.3z"/>
  </svg>
);

// Inject html2canvas from CDN once
let scriptLoaded = false;
function ensureHtml2Canvas(): Promise<void> {
  if (scriptLoaded && 'html2canvas' in window) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-html2canvas]');
    if (existing) { scriptLoaded = true; resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.setAttribute('data-html2canvas', 'true');
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(script);
  });
}

export default function TweetSnapView() {
  const [cardTheme, setCardTheme] = useState<'light' | 'dark'>('light');
  const [name, setName] = useState('y');
  const [handle, setHandle] = useState('@ysuckme');
  const [text, setText] = useState('stay far away from anything that cost you your peace of mind.');
  const [timestamp, setTimestamp] = useState('2:57 AM · Oct 24, 2025');
  const [verified, setVerified] = useState(true);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [fetchStatus, setFetchStatus] = useState('');
  const [fetchOk, setFetchOk] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState('');
  const [avatarOk, setAvatarOk] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloadOk, setDownloadOk] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = cardTheme === 'dark';

  /* ── Fetch from X link ────────────────────────────────── */
  const handleFetch = useCallback(async () => {
    if (!postUrl.trim()) {
      setFetchStatus('Paste a post URL first.');
      setFetchOk(false);
      return;
    }
    setFetchStatus('Fetching…');
    setFetchOk(false);
    try {
      const endpoint = 'https://publish.twitter.com/oembed?omit_script=true&url=' + encodeURIComponent(postUrl);
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const doc = new DOMParser().parseFromString(data.html, 'text/html');
      const blockquote = doc.querySelector('blockquote');
      let fetchedText = '', date = '', fetchedHandle = '';
      if (blockquote) {
        const p = blockquote.querySelector('p');
        fetchedText = p ? p.textContent?.trim() || '' : '';
        const links = blockquote.querySelectorAll('a');
        if (links.length) date = links[links.length - 1].textContent?.trim() || '';
        const m = blockquote.textContent?.match(/\(@([A-Za-z0-9_]+)\)/);
        if (m) fetchedHandle = '@' + m[1];
      }
      if (!fetchedHandle && data.author_url) fetchedHandle = '@' + data.author_url.split('/').pop();

      setName(data.author_name || '');
      setHandle(fetchedHandle);
      setText(fetchedText);
      if (date) setTimestamp(date);
      setFetchStatus('Loaded — adjust fields if needed.');
      setFetchOk(true);
    } catch {
      setFetchStatus('Could not fetch (browser blocked the request). Fill the fields below manually.');
      setFetchOk(false);
    }
  }, [postUrl]);

  /* ── Avatar upload ────────────────────────────────────── */
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setAvatarSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarUrl = useCallback(async () => {
    if (!avatarUrl.trim()) {
      setAvatarStatus('Paste an image URL first.');
      setAvatarOk(false);
      return;
    }
    setAvatarStatus('Loading…');
    setAvatarOk(false);
    try {
      const res = await fetch(avatarUrl, { mode: 'cors' });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new Error('not an image');
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarSrc(ev.target?.result as string);
        setAvatarStatus('Loaded.');
        setAvatarOk(true);
      };
      reader.readAsDataURL(blob);
    } catch {
      setAvatarStatus("Could not load that image (CORS). Try uploading the image instead.");
      setAvatarOk(false);
    }
  }, [avatarUrl]);

  /* ── Download PNG ─────────────────────────────────────── */
  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloadStatus('Rendering image…');
    setDownloadOk(false);
    try {
      await ensureHtml2Canvas();
      const canvas = await window.html2canvas(cardRef.current, {
        scale: 4,
        backgroundColor: isDark ? '#000' : '#fff',
      });
      const link = document.createElement('a');
      link.download = 'x-post.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloadStatus('Downloaded.');
      setDownloadOk(true);
    } catch {
      setDownloadStatus('Could not render image.');
      setDownloadOk(false);
    }
  }, [isDark]);

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.title}>X Post Snap</div>
        <div className={styles.subtitle}>Type it, snap it — generate clean tweet screenshots</div>
      </div>

      <div className={styles.layout}>
        {/* ── Left panel: controls ── */}
        <div className={styles.panel}>
          {/* Fetch from URL */}
          <div>
            <label className={styles.fieldLabel}>Post URL</label>
            <input
              type="text"
              className={styles.fieldInput}
              placeholder="https://x.com/user/status/..."
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
            />
            <button className={styles.btnPrimary} style={{ marginTop: 8 }} onClick={handleFetch}>
              Fetch from link
            </button>
            <div className={`${styles.statusMsg} ${fetchOk ? styles.statusOk : ''}`}>{fetchStatus}</div>
          </div>

          <hr className={styles.separator} />

          {/* Card theme */}
          <div>
            <label className={styles.fieldLabel}>Card theme</label>
            <div className={styles.themeToggle}>
              <button
                className={`${styles.themeBtn} ${!isDark ? styles.themeBtnActive : ''}`}
                onClick={() => setCardTheme('light')}
              >
                Light
              </button>
              <button
                className={`${styles.themeBtn} ${isDark ? styles.themeBtnActive : ''}`}
                onClick={() => setCardTheme('dark')}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Avatar */}
          <div>
            <label className={styles.fieldLabel}>Profile picture (optional)</label>
            <div className={styles.fieldRow}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFile}
              />
              <button className={styles.btnGhost} style={{ flex: 1 }} onClick={() => fileInputRef.current?.click()}>
                Upload image
              </button>
              <button className={styles.btnGhost} style={{ flex: '0 0 90px' }} onClick={clearAvatar}>
                Clear
              </button>
            </div>
            <input
              type="text"
              className={styles.fieldInput}
              placeholder="or paste an image URL"
              style={{ marginTop: 8 }}
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            <button className={styles.btnGhost} style={{ marginTop: 8, width: '100%' }} onClick={handleAvatarUrl}>
              Load image from URL
            </button>
            <div className={`${styles.statusMsg} ${avatarOk ? styles.statusOk : ''}`}>{avatarStatus}</div>
          </div>

          {/* Display name */}
          <div>
            <label className={styles.fieldLabel}>Display name</label>
            <input
              type="text"
              className={styles.fieldInput}
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Verified */}
          <div className={styles.toggleRow}>
            <span>Verified badge</span>
            <label className={styles.switch}>
              <input
                type="checkbox"
                className={styles.switchInput}
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />
              <span className={styles.switchSlider} />
            </label>
          </div>

          {/* Handle */}
          <div>
            <label className={styles.fieldLabel}>Handle</label>
            <input
              type="text"
              className={styles.fieldInput}
              placeholder="@username"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>

          {/* Post text */}
          <div>
            <label className={styles.fieldLabel}>Post text</label>
            <textarea
              className={styles.fieldInput}
              rows={4}
              placeholder="What's happening?"
              style={{ resize: 'vertical', minHeight: 80 }}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Timestamp */}
          <div>
            <label className={styles.fieldLabel}>Timestamp</label>
            <input
              type="text"
              className={styles.fieldInput}
              placeholder="2:57 AM · Oct 24, 2025"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>

          <hr className={styles.separator} />

          {/* Download */}
          <button className={styles.btnPrimary} onClick={handleDownload}>
            Download PNG
          </button>
          <div className={`${styles.statusMsg} ${downloadOk ? styles.statusOk : ''}`}>{downloadStatus}</div>
        </div>

        {/* ── Right: live preview ── */}
        <div className={styles.previewWrap}>
          <div className={styles.frame}>
            <div className={`${styles.corner} ${styles.cornerTl}`} />
            <div className={`${styles.corner} ${styles.cornerTr}`} />
            <div className={`${styles.corner} ${styles.cornerBl}`} />
            <div className={`${styles.corner} ${styles.cornerBr}`} />

            <div
              ref={cardRef}
              className={`${styles.card} ${isDark ? styles.cardDark : ''}`}
            >
              <div className={styles.cardHead}>
                <div className={styles.headLeft}>
                  <div className={`${styles.avatar} ${isDark ? styles.avatarDark : ''}`}>
                    {avatarSrc ? (
                      <img className={styles.avatarImg} src={avatarSrc} alt="" />
                    ) : (
                      DEFAULT_AVATAR
                    )}
                  </div>
                  <div className={styles.who}>
                    <div className={`${styles.nameLine} ${isDark ? styles.nameLineDark : ''}`}>
                      <span className={styles.nameText}>{name || 'Name'}</span>
                      {verified && (
                        <svg width="22" height="22" viewBox="0 0 24 24">
                          <path fill="#1D9BF0" d={BADGE_PATH} />
                        </svg>
                      )}
                    </div>
                    <span className={styles.handle}>{handle || '@handle'}</span>
                  </div>
                </div>
                <svg className={styles.xLogo} viewBox="0 0 24 24">
                  <path fill={isDark ? '#E7E9EA' : '#0F1419'} d={X_LOGO_PATH} />
                </svg>
              </div>
              <div className={styles.bodyText}>{text}</div>
              <div className={styles.timestamp}>{timestamp}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
