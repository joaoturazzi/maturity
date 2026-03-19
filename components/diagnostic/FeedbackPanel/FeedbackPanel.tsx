'use client';

import styles from './FeedbackPanel.module.css';

type Props = {
  feedback: string | null;
};

export function FeedbackPanel({ feedback }: Props) {
  if (!feedback) return null;

  return (
    <div className={styles.panel}>
      <span className={styles.icon}>&#9432;</span>
      <p className={styles.text}>{feedback}</p>
    </div>
  );
}
