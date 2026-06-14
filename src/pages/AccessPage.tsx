import { useState, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validateKey } from '../lib/validateKey';
import styles from './AccessPage.module.css';

export default function AccessPage() {
  const { isAuthed, setAuthed } = useAuth();
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  if (isAuthed) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateKey(key)) {
      setAuthed(true);
      navigate('/dashboard', { replace: true });
    } else {
      setError('Invalid access key. Please try again.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />

      <form
        onSubmit={handleSubmit}
        className={`${styles.card} ${shaking ? styles.shake : ''}`}
      >
        <p className={styles.subtitle} style={{ marginTop: '16px' }}>Enter your access key to continue</p>

        <label className={styles.label} htmlFor="access-key">
          Access Key
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="access-key"
            type="password"
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            placeholder="Enter your key..."
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError('');
            }}
            autoFocus
          />
        </div>
        <div className={styles.error}>{error}</div>

        <button type="submit" className={styles.submitBtn}>
          <span className={styles.btnGlow} />
          <span className={styles.btnText}>Unlock Workspace</span>
        </button>
      </form>

      <p className={styles.footer}>Protected workspace access</p>
    </div>
  );
}
