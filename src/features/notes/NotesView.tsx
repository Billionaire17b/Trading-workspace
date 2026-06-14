import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
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

const PDFS = [
  { id: 'pdf1', title: 'Futures Risk Management & Trade Plan', filename: 'Futures risk management and trade plan (1).pdf' },
  { id: 'pdf2', title: 'MMXM 2325', filename: 'MMXM 2325.pdf' },
  { id: 'pdf3', title: 'Notes', filename: 'notes (1).pdf' },
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
  const [activePdf, setActivePdf] = useState<typeof PDFS[0] | null>(null);
  const [numPages, setNumPages] = useState<number>();
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileEditing, setMobileEditing] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);

  const selectedNote = notes.find((n) => n.id === selectedId) || null;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

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
              PDF Library
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
        activePdf ? (
          <div className={styles.pdfViewer}>
            <button className={styles.mobileBack} onClick={() => setActivePdf(null)} style={{ display: 'flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Library
            </button>
            <div className={styles.pdfScrollWrapper}>
              <Document
                file={`/${activePdf.filename}`}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                className={styles.pdfDocument}
                loading={<div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading PDF...</div>}
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    className={styles.pdfPage}
                    width={Math.min(window.innerWidth - 32, 800)} // Responsive width
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ))}
              </Document>
            </div>
          </div>
        ) : (
          <div className={styles.libraryGrid}>
            {PDFS.map(pdf => (
              <div key={pdf.id} onClick={() => setActivePdf(pdf)} className={styles.fileCard}>
                <div className={styles.fileIcon}>📄</div>
                <div className={styles.fileName}>{pdf.title}</div>
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
