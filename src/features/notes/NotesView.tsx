import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PptxHandler } from 'pptx-viewer-core';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import styles from './NotesView.module.css';

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const STORAGE_KEY = 'tw-notes';

type FileItem = { id: string; title: string; filename: string; fileType: 'pdf' | 'ppt' };
type FolderItem = { id: string; title: string; type: 'folder'; children: FileItem[] };
type LibraryItem = FileItem | FolderItem;

const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'folder-my-notes',
    title: 'my notes',
    type: 'folder',
    children: [
      { id: 'pdf1', title: 'Futures Risk Management & Trade Plan', filename: 'Futures risk management and trade plan (1).pdf', fileType: 'pdf' },
      { id: 'pdf2', title: 'MMXM 2325', filename: 'MMXM 2325.pdf', fileType: 'pdf' },
      { id: 'pdf3', title: 'Notes', filename: 'notes (1).pdf', fileType: 'pdf' },
    ]
  },
  {
    id: 'folder-mmxm-notes',
    title: 'MMXM notes',
    type: 'folder',
    children: [
      { id: 'ppt1', title: 'MMXM Trader Posts', filename: 'MMXM TRADER POSTS.pptx', fileType: 'ppt' },
      { id: 'ppt2', title: "The MMXM Trader's 1st Course - Bread & Butter Approach Notes", filename: 'The MMXM Trader\'s 1st Course Bread & Butter Approach Notes.pptx', fileType: 'ppt' },
      { id: 'ppt3', title: 'The X Model Notes', filename: 'The X Model Notes.pptx', fileType: 'ppt' },
    ]
  },
  {
    id: 'folder-4500px',
    title: '4500px',
    type: 'folder',
    children: [
      { id: 'pdf4', title: 'Crypto Range Trading', filename: '4500px/CryptoRangeTrading.pdf', fileType: 'pdf' },
      { id: 'pdf5', title: 'March Trades', filename: '4500px/MarchTrades.pdf', fileType: 'pdf' },
      { id: 'pdf6', title: 'Monthly recap', filename: '4500px/Monthly recap.pdf', fileType: 'pdf' },
      { id: 'pdf7', title: 'Past Plays Same Process', filename: '4500px/PastPlaysSameProcess.pdf', fileType: 'pdf' },
      { id: 'pdf8', title: 'Unicorn', filename: '4500px/Unicorn.pdf', fileType: 'pdf' },
    ]
  },
  {
    id: 'folder-juno-trading',
    title: 'Juno Trading',
    type: 'folder',
    children: [
      { id: 'pdf9', title: 'Feb 24 Unicorn Model Data', filename: 'JunoTrading/Feb_24_Unicorn_Model_Data.pdf', fileType: 'pdf' },
      { id: 'pdf10', title: 'Jan 24 Unicorn Model Data', filename: 'JunoTrading/Jan_24_Unicorn_Model_Data.pdf', fileType: 'pdf' },
      { id: 'pdf11', title: 'Smooth Edges', filename: 'JunoTrading/Smooth Edges - byJunotrading.pdf', fileType: 'pdf' },
      { id: 'pdf12', title: 'Stat Map Unicorn Juno', filename: 'JunoTrading/Stat-Map-Unicorn-Juno.pdf', fileType: 'pdf' },
      { id: 'pdf13', title: 'Unicorn Model Data Sep 2025', filename: 'JunoTrading/Unicorn_Model_Data_Sep2025.pdf', fileType: 'pdf' },
    ]
  }
];

function loadNotes(): Note[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export default function NotesView() {
  const [view, setView] = useState<'notes'|'library'>('library');
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [numPages, setNumPages] = useState<number>();
  const [pptSlideImages, setPptSlideImages] = useState<string[]>([]);
  const [pptLoading, setPptLoading] = useState(false);
  const [pptError, setPptError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileEditing, setMobileEditing] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const pptContainerRef = useRef<HTMLDivElement>(null);
  const pptViewerRef = useRef<HTMLDivElement>(null);
  const pdfViewerRef = useRef<HTMLDivElement>(null);
  const pdfScrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(Math.min(window.innerWidth - 32, 800));

  const selectedNote = notes.find((n) => n.id === selectedId) || null;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  // Track container width for responsive PDF/PPT sizing
  useEffect(() => {
    const el = pdfScrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setContainerWidth(Math.min(w - 32, 800));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeFile]);

  const createNote = () => {
    const note: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
    setMobileEditing(true);
  };

  const updateNote = (field: 'title' | 'content', value: string) => {
    if (!selectedId) return;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, [field]: value, updatedAt: new Date().toISOString() }
          : n
      )
    );

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {}, 500);
  };

  const deleteNote = () => {
    if (!selectedId) return;
    setNotes((prev) => prev.filter((n) => n.id !== selectedId));
    setSelectedId(null);
    setMobileEditing(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // PPT slide navigation
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(Math.max(0, Math.min(index, pptSlideImages.length - 1)));
  }, [pptSlideImages.length]);

  const nextSlide = useCallback(() => goToSlide(currentSlide + 1), [currentSlide, goToSlide]);
  const prevSlide = useCallback(() => goToSlide(currentSlide - 1), [currentSlide, goToSlide]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    const el = activeFile?.fileType === 'pdf' ? pdfViewerRef.current : pptViewerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen not supported:', err);
    }
  }, [activeFile?.fileType]);

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, []);

  // Keyboard navigation for PPT slides + F key for fullscreen
  useEffect(() => {
    if (!activeFile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Presentation slide navigation
      if (activeFile.fileType === 'ppt' && pptSlideImages.length > 0) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          nextSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          prevSlide();
        }
      }
      
      // Global fullscreen shortcut
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, pptSlideImages.length, nextSlide, prevSlide, toggleFullscreen]);

  // Touch swipe handlers for PPT slides
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Only trigger if horizontal swipe is dominant and threshold met
    if (absDeltaX > 50 && absDeltaX > absDeltaY * 1.5) {
      if (deltaX < 0) nextSlide();
      else prevSlide();
    }
    touchStartRef.current = null;
  }, [nextSlide, prevSlide]);

  const handleFileOpen = async (file: FileItem) => {
    setActiveFile(file);
    setCurrentSlide(0);
    setCurrentPdfPage(1);
    setLoadProgress(0);
    setLoadingStage('Downloading');
    if (file.fileType === 'ppt') {
      setPptLoading(true);
      setPptError(null);
      setPptSlideImages([]);
      try {
        const response = await fetch(encodeURI(`/${file.filename}`));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        // Stream-based download with progress tracking
        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
        let buffer: ArrayBuffer;

        if (totalBytes > 0 && response.body) {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let receivedBytes = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedBytes += value.length;
            // Download is 0-60% of the overall progress
            setLoadProgress(Math.round((receivedBytes / totalBytes) * 60));
          }

          const allChunks = new Uint8Array(receivedBytes);
          let position = 0;
          for (const chunk of chunks) {
            allChunks.set(chunk, position);
            position += chunk.length;
          }
          buffer = allChunks.buffer;
        } else {
          // Fallback: no content-length, simulate progress
          setLoadProgress(30);
          buffer = await response.arrayBuffer();
          setLoadProgress(60);
        }
        
        // Detect if it's a Git LFS pointer instead of a zip archive (PPTX)
        const textBytes = new Uint8Array(buffer.slice(0, 50));
        const headerText = new TextDecoder().decode(textBytes);
        if (headerText.includes('version https://git-lfs.github.com')) {
          throw new Error('This file is a Git LFS pointer. Your hosting provider (like Vercel/Netlify) needs Git LFS enabled to download the actual presentation.');
        }

        setLoadingStage('Parsing slides');
        setLoadProgress(65);
        const handler = new PptxHandler();
        const data = await handler.load(buffer);
        setLoadProgress(75);
        
        // Extract one image per slide (these PPTs have full-slide picture elements)
        setLoadingStage('Extracting images');
        const images: string[] = [];
        const totalSlides = data.slides.length;
        for (let si = 0; si < totalSlides; si++) {
          const slide = data.slides[si];
          for (const element of slide.elements) {
            const el = element as any;
            if (el.type === 'image' || el.type === 'picture') {
              // Try imageData first (inline data), then imagePath via getImageData
              if (el.imageData) {
                images.push(el.imageData);
                break;
              } else if (el.imagePath) {
                const imgData = await handler.getImageData(el.imagePath);
                if (imgData) {
                  images.push(imgData);
                  break;
                }
              }
            }
          }
          // Image extraction is 75-98% of overall progress
          setLoadProgress(75 + Math.round(((si + 1) / totalSlides) * 23));
        }
        if (images.length === 0) throw new Error('No images found in presentation slides.');
        setLoadProgress(100);
        setLoadingStage('Done');
        setPptSlideImages(images);
      } catch (err: any) {
        console.error('Failed to load PPT:', err);
        setPptError(err.message || 'Failed to load presentation');
      } finally {
        setPptLoading(false);
      }
    }
  };

  const handlePdfScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!numPages) return;
    const el = e.currentTarget;
    const pageHeight = el.scrollHeight / numPages;
    const currentPage = Math.min(
      numPages,
      Math.max(1, Math.floor((el.scrollTop + el.clientHeight / 2) / pageHeight) + 1)
    );
    setCurrentPdfPage(currentPage);
  }, [numPages]);

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Trading Hub</h2>
          <div className={styles.tabNav}>
            <button 
              className={`${styles.tabBtn} ${view === 'library' ? styles.tabBtnActive : ''}`} 
              onClick={() => setView('library')}
            >
              Library
            </button>
            <button 
              className={`${styles.tabBtn} ${view === 'notes' ? styles.tabBtnActive : ''}`} 
              onClick={() => setView('notes')}
            >
              My Notes
            </button>
          </div>
        </div>
        {view === 'notes' && <button className={styles.addBtn} onClick={createNote}>+ New Note</button>}
      </div>

      {view === 'library' ? (
        activeFile ? (
          activeFile.fileType === 'pdf' ? (
          <div className={`${styles.pdfViewer} ${isFullscreen ? styles.pptFullscreen : ''}`} ref={pdfViewerRef}>
            <div className={styles.pptTopBar}>
              <button className={styles.pptBackBtn} onClick={() => { if (isFullscreen) toggleFullscreen(); setActiveFile(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              <div className={styles.pptSlideTitle}>{activeFile.title}</div>
              {numPages ? (
                <div className={styles.pptSlideCounter}>
                  {currentPdfPage} / {numPages}
                </div>
              ) : null}
              <button className={styles.pptFullscreenBtn} onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                {isFullscreen ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 8 14 8 18" />
                    <polyline points="20 10 16 10 16 6" />
                    <polyline points="14 4 14 8 18 8" />
                    <polyline points="10 20 10 16 6 16" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <polyline points="21 3 14 10" />
                    <polyline points="3 21 10 14" />
                  </svg>
                )}
              </button>
            </div>
            <div className={styles.pdfScrollWrapper} ref={pdfScrollRef} onScroll={handlePdfScroll}>
              <Document
                file={encodeURI(`/${activeFile.filename}`)}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadProgress={({ loaded, total }) => {
                  if (total > 0) {
                    setLoadProgress(Math.round((loaded / total) * 100));
                  }
                }}
                className={styles.pdfDocument}
                loading={
                  <div className={styles.pptLoading}>
                    <div className={styles.pptProgressRing}>
                      <svg className={styles.pptProgressSvg} viewBox="0 0 120 120">
                        <defs>
                          <linearGradient id="pdfProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#38bdf8" />
                          </linearGradient>
                        </defs>
                        <circle className={styles.pptProgressTrack} cx="60" cy="60" r="52" />
                        <circle
                          className={styles.pptProgressFill}
                          cx="60" cy="60" r="52"
                          stroke="url(#pdfProgressGrad)"
                          strokeDasharray={`${2 * Math.PI * 52}`}
                          strokeDashoffset={`${2 * Math.PI * 52 * (1 - loadProgress / 100)}`}
                        />
                      </svg>
                      <div className={styles.pptProgressPercent}>{loadProgress}%</div>
                    </div>
                    <div className={styles.pptProgressLabel}>Loading PDF</div>
                  </div>
                }
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    className={styles.pdfPage}
                    width={containerWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ))}
              </Document>
            </div>
          </div>
          ) : (
          <div className={`${styles.pptViewer} ${isFullscreen ? styles.pptFullscreen : ''}`} ref={pptViewerRef}>
            <div className={styles.pptTopBar}>
              <button className={styles.pptBackBtn} onClick={() => { if (isFullscreen) toggleFullscreen(); setActiveFile(null); setPptSlideImages([]); setPptError(null); setCurrentSlide(0); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
              {pptSlideImages.length > 0 && (
                <div className={styles.pptSlideTitle}>{activeFile.title}</div>
              )}
              {pptSlideImages.length > 0 && (
                <div className={styles.pptSlideCounter}>
                  {currentSlide + 1} / {pptSlideImages.length}
                </div>
              )}
              {pptSlideImages.length > 0 && (
                <button className={styles.pptFullscreenBtn} onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                  {isFullscreen ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 14 8 14 8 18" />
                      <polyline points="20 10 16 10 16 6" />
                      <polyline points="14 4 14 8 18 8" />
                      <polyline points="10 20 10 16 6 16" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <polyline points="21 3 14 10" />
                      <polyline points="3 21 10 14" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            <div
              className={styles.pptViewerWrapper}
              ref={pptContainerRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {pptLoading ? (
                <div className={styles.pptLoading}>
                  <div className={styles.pptProgressRing}>
                    <svg className={styles.pptProgressSvg} viewBox="0 0 120 120">
                      <defs>
                        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#38bdf8" />
                        </linearGradient>
                      </defs>
                      <circle className={styles.pptProgressTrack} cx="60" cy="60" r="52" />
                      <circle
                        className={styles.pptProgressFill}
                        cx="60" cy="60" r="52"
                        stroke="url(#progressGrad)"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - loadProgress / 100)}`}
                      />
                    </svg>
                    <div className={styles.pptProgressPercent}>{loadProgress}%</div>
                  </div>
                  <div className={styles.pptProgressLabel}>{loadingStage}</div>
                  <div className={styles.pptProgressSubLabel}>
                    {loadProgress < 60 ? 'Fetching file...' : loadProgress < 75 ? 'Processing PPTX...' : loadProgress < 98 ? `Slide ${Math.min(Math.ceil((loadProgress - 75) / 23 * (pptSlideImages.length || 1)) + 1, pptSlideImages.length || 1)}...` : 'Almost ready!'}
                  </div>
                </div>
              ) : pptError ? (
                <div className={styles.pptErrorState}>
                  <div className={styles.pptErrorIcon}>⚠️</div>
                  <div className={styles.pptErrorTitle}>Failed to load presentation</div>
                  <div className={styles.pptErrorMsg}>{pptError}</div>
                </div>
              ) : pptSlideImages.length > 0 ? (
                <>
                  <div className={styles.pptSlideStage}>
                    <img
                      key={`slide_${currentSlide}`}
                      src={pptSlideImages[currentSlide]}
                      alt={`Slide ${currentSlide + 1}`}
                      className={styles.pptSlideImage}
                      draggable={false}
                    />
                  </div>
                  {/* Navigation arrows - hidden on very small screens, use swipe there */}
                  <button
                    className={`${styles.pptNavBtn} ${styles.pptNavPrev}`}
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    aria-label="Previous slide"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    className={`${styles.pptNavBtn} ${styles.pptNavNext}`}
                    onClick={nextSlide}
                    disabled={currentSlide === pptSlideImages.length - 1}
                    aria-label="Next slide"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className={styles.pptLoading}>No slides found</div>
              )}
            </div>
            {/* Bottom dot navigation for mobile/iPad */}
            {pptSlideImages.length > 1 && (
              <div className={styles.pptDotNav}>
                {pptSlideImages.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.pptDot} ${i === currentSlide ? styles.pptDotActive : ''}`}
                    onClick={() => goToSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          )
        ) : currentFolder ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button className={styles.pptBackBtn} onClick={() => setCurrentFolder(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Library
            </button>
            <div className={styles.libraryGrid}>
              {currentFolder.children.map((file) => (
                <div key={file.id} onClick={() => handleFileOpen(file)} className={styles.fileCard}>
                  <div className={file.fileType === 'ppt' ? styles.pptIcon : styles.fileIcon}>
                    {file.fileType === 'ppt' ? '📊' : '📄'}
                  </div>
                  <div className={styles.fileName}>{file.title}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.libraryGrid}>
            {LIBRARY_ITEMS.map((item) => (
              <div 
                key={item.id} 
                onClick={() => {
                  if ('type' in item && item.type === 'folder') {
                    setCurrentFolder(item);
                  } else {
                    handleFileOpen(item as FileItem);
                  }
                }} 
                className={styles.fileCard}
              >
                <div className={'type' in item && item.type === 'folder' ? styles.folderIcon : styles.fileIcon}>
                  {'type' in item && item.type === 'folder' ? '📁' : '📄'}
                </div>
                <div className={styles.fileName}>{item.title}</div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {notes.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📓</div>
              <div className={styles.emptyText}>No notes yet</div>
              <div className={styles.emptySubtext}>Create your first trading note</div>
            </div>
          ) : (
            <div className={styles.container}>
              {/* Notes list */}
              <div
                className={`${styles.notesList} ${mobileEditing ? styles.hideMobile : ''}`}
              >
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`${styles.noteItem} ${
                      note.id === selectedId ? styles.noteItemActive : ''
                    }`}
                    onClick={() => {
                      setSelectedId(note.id);
                      setMobileEditing(true);
                    }}
                  >
                    <div className={styles.noteItemTitle}>
                      {note.title || 'Untitled'}
                    </div>
                    <div className={styles.noteItemDate}>{formatDate(note.updatedAt)}</div>
                    {note.content && (
                      <div className={styles.noteItemPreview}>{note.content}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Editor */}
              <div className={`${!mobileEditing ? styles.hideMobile : ''}`}>
                {selectedNote ? (
                  <div className={styles.editor}>
                    <button
                      className={styles.mobileBack}
                      onClick={() => setMobileEditing(false)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Back
                    </button>

                    <input
                      className={styles.editorTitleInput}
                      placeholder="Note title..."
                      value={selectedNote.title}
                      onChange={(e) => updateNote('title', e.target.value)}
                    />

                    <textarea
                      className={styles.editorTextarea}
                      placeholder="Start writing..."
                      value={selectedNote.content}
                      onChange={(e) => updateNote('content', e.target.value)}
                    />

                    <div className={styles.editorFooter}>
                      <span className={styles.charCount}>
                        {selectedNote.content.length} characters
                      </span>
                      <button className={styles.deleteNoteBtn} onClick={deleteNote}>
                        Delete Note
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.noSelection}>
                    <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.2 }}>📝</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>Select a note or create a new one</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
