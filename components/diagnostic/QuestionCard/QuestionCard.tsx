'use client';

import { useState } from 'react';
import type { Indicator } from '@/types/database';
import { OptionSelector } from '@/components/diagnostic/OptionSelector/OptionSelector';
import styles from './QuestionCard.module.css';

type Props = {
  indicator: Indicator;
  onAnswer: (score: number) => void;
};

export function QuestionCard({ indicator, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (level: number) => {
    setSelected(level);
    onAnswer(level);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{indicator.title}</h3>
        {indicator.description && (
          <p className={styles.description}>{indicator.description}</p>
        )}
      </div>
      <OptionSelector
        options={indicator.response_options}
        selected={selected}
        onSelect={handleSelect}
      />
    </div>
  );
}
