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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileEditing, setMobileEditing] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const pptContainerRef = useRef<HTMLDivElement>(null);
  const pptViewerRef = useRef<HTMLDivElement>(null);
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
    const el = pptViewerRef.current;
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
  }, []);

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

  // Keyboard navigation for PPT slides + Escape for fullscreen
  useEffect(() => {
    if (!activeFile || activeFile.fileType !== 'ppt' || pptSlideImages.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
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
    if (file.fileType === 'ppt') {
      setPptLoading(true);
      setPptError(null);
      setPptSlideImages([]);
      try {
        const response = await fetch(`/${file.filename}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const buffer = await response.arrayBuffer();
        
        // Detect if it's a Git LFS pointer instead of a zip archive (PPTX)
        const textBytes = new Uint8Array(buffer.slice(0, 50));
        const headerText = new TextDecoder().decode(textBytes);
        if (headerText.includes('version https://git-lfs.github.com')) {
          throw new Error('This file is a Git LFS pointer. Your hosting provider (like Vercel/Netlify) needs Git LFS enabled to download the actual presentation.');
        }

        const handler = new PptxHandler();
        const data = await handler.load(buffer);
        
        // Extract one image per slide (these PPTs have full-slide picture elements)
        const images: string[] = [];
        for (const slide of data.slides) {
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
        }
        if (images.length === 0) throw new Error('No images found in presentation slides.');
        setPptSlideImages(images);
      } catch (err: any) {
        console.error('Failed to load PPT:', err);
        setPptError(err.message || 'Failed to load presentation');
      } finally {
        setPptLoading(false);
      }
    }
  };

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
          <div className={styles.pdfViewer}>
            <button className={styles.pptBackBtn} onClick={() => setActiveFile(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Library
            </button>
            <div className={styles.pdfScrollWrapper} ref={pdfScrollRef}>
              <Document
                file={`/${activeFile.filename}`}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                className={styles.pdfDocument}
                loading={<div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading PDF...</div>}
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
                  <div className={styles.pptSpinner} />
                  <span>Loading presentation...</span>
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
