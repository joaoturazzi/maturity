'use client';

import type { ResponseOption } from '@/types/database';
import styles from './OptionSelector.module.css';

type Props = {
  options: ResponseOption[];
  selected: number | null;
  onSelect: (level: number) => void;
};

export function OptionSelector({ options, selected, onSelect }: Props) {
  const sorted = [...options].sort((a, b) => a.level - b.level);

  return (
    <div className={styles.list}>
      {sorted.map((option) => (
        <button
          key={option.level}
          type="button"
          className={`${styles.option} ${selected === option.level ? styles.selected : ''}`}
          onClick={() => onSelect(option.level)}
        >
          <span className={styles.badge}>{option.level}</span>
          <span className={styles.text}>{option.text}</span>
        </button>
      ))}
    </div>
  );
}
