'use client';

import type { DimensionProgress } from '@/types/diagnostic';
import styles from './ProgressTracker.module.css';

type Props = {
  dimensions: DimensionProgress[];
};

export function ProgressTracker({ dimensions }: Props) {
  return (
    <div className={styles.container}>
      {dimensions.map((dp) => {
        const pct = dp.totalIndicators > 0
          ? Math.round((dp.answeredIndicators / dp.totalIndicators) * 100)
          : 0;
        const color = dp.dimension.color || '#1a1a1a';

        return (
          <div key={dp.dimension.id} className={styles.dimension}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{dp.dimension.name}</span>
              {dp.isComplete ? (
                <span
                  className={styles.checkmark}
                  style={{ background: color }}
                >
                  &#10003;
                </span>
              ) : (
                <span className={styles.count}>
                  {dp.answeredIndicators}/{dp.totalIndicators}
                </span>
              )}
            </div>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
