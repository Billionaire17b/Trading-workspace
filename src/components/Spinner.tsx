import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: number;
}

export default function Spinner({ size = 24 }: SpinnerProps) {
  return (
    <div
      className={styles.spinner}
      style={{ width: size, height: size }}
    />
  );
}
