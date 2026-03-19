'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDiagnosticStore } from '@/store/diagnosticStore';
import { useDiagnostic } from '@/hooks/useDiagnostic';
import { QuestionCard } from '@/components/diagnostic/QuestionCard/QuestionCard';
import { ProgressTracker } from '@/components/diagnostic/ProgressTracker/ProgressTracker';
import { FeedbackPanel } from '@/components/diagnostic/FeedbackPanel/FeedbackPanel';
import type { DimensionProgress } from '@/types/diagnostic';
import type { Indicator } from '@/types/database';
import styles from './DiagnosticFlow.module.css';

type DimWithIndicators = {
  id: string;
  name: string;
  color: string | null;
  indicators: Array<{
    id: string;
    title: string;
    description: string | null;
    responseOptions: Array<{ level: number; text: string }>;
    feedbackPerLevel: Array<{ level: number; feedback: string }>;
  }>;
};

type Props = {
  cycleId: string;
  dimensions: DimWithIndicators[];
};

export function DiagnosticFlow({ cycleId, dimensions }: Props) {
  const router = useRouter();
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    currentDimensionIndex,
    currentIndicatorIndex,
    responses,
    isSubmitting,
    setCycleId,
    setCurrentDimension,
    setCurrentIndicator,
    setResponse,
    setSubmitting,
  } = useDiagnosticStore();

  const { saveResponse, submitDiagnostic } = useDiagnostic(cycleId);

  useEffect(() => {
    setCycleId(cycleId);
  }, [cycleId, setCycleId]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const currentDimension = dimensions[currentDimensionIndex] ?? null;
  const currentRawIndicator = currentDimension?.indicators[currentIndicatorIndex] ?? null;

  const currentIndicator: Indicator | null = useMemo(() => {
    if (!currentRawIndicator || !currentDimension) return null;
    return {
      id: currentRawIndicator.id,
      dimension_id: currentDimension.id,
      title: currentRawIndicator.title,
      description: currentRawIndicator.description,
      weight: 1,
      order_index: currentIndicatorIndex,
      response_options: currentRawIndicator.responseOptions,
      feedback_per_level: currentRawIndicator.feedbackPerLevel,
      created_at: '',
    };
  }, [currentRawIndicator, currentDimension, currentIndicatorIndex]);

  const currentResponse = currentIndicator ? responses[currentIndicator.id] : undefined;

  const activeFeedback = useMemo(() => {
    if (!currentResponse || !currentRawIndicator) return null;
    const entry = currentRawIndicator.feedbackPerLevel.find(
      (f) => f.level === currentResponse.score
    );
    return entry?.feedback ?? null;
  }, [currentResponse, currentRawIndicator]);

  const dimensionProgress: DimensionProgress[] = useMemo(() => {
    return dimensions.map((dim) => {
      const answered = dim.indicators.filter((ind) => responses[ind.id]).length;
      return {
        dimension: {
          id: dim.id,
          name: dim.name,
          description: null,
          color: dim.color,
          order_index: null,
          is_active: true,
          target_score: 5,
          company_id: null,
          created_at: '',
        },
        totalIndicators: dim.indicators.length,
        answeredIndicators: answered,
        isComplete: answered === dim.indicators.length && dim.indicators.length > 0,
      };
    });
  }, [dimensions, responses]);

  const allComplete = dimensionProgress.every((dp) => dp.isComplete);

  const totalIndicators = dimensions.reduce((sum, d) => sum + d.indicators.length, 0);
  const totalAnswered = Object.keys(responses).length;

  const isFirstQuestion = currentDimensionIndex === 0 && currentIndicatorIndex === 0;
  const isLastIndicatorInDimension =
    currentDimension != null &&
    currentIndicatorIndex === currentDimension.indicators.length - 1;
  const isLastDimension = currentDimensionIndex === dimensions.length - 1;

  const goNext = useCallback(() => {
    if (!currentDimension) return;
    if (currentIndicatorIndex < currentDimension.indicators.length - 1) {
      setCurrentIndicator(currentIndicatorIndex + 1);
    } else if (currentDimensionIndex < dimensions.length - 1) {
      setCurrentDimension(currentDimensionIndex + 1);
    }
  }, [currentDimension, currentDimensionIndex, currentIndicatorIndex, dimensions.length, setCurrentDimension, setCurrentIndicator]);

  const goPrev = useCallback(() => {
    if (currentIndicatorIndex > 0) {
      setCurrentIndicator(currentIndicatorIndex - 1);
    } else if (currentDimensionIndex > 0) {
      const prevDim = dimensions[currentDimensionIndex - 1];
      setCurrentDimension(currentDimensionIndex - 1);
      if (prevDim) {
        setTimeout(() => setCurrentIndicator(prevDim.indicators.length - 1), 0);
      }
    }
  }, [currentDimensionIndex, currentIndicatorIndex, dimensions, setCurrentDimension, setCurrentIndicator]);

  const handleAnswer = useCallback(
    (score: number) => {
      if (!currentIndicator || !currentDimension) return;

      setResponse(currentIndicator.id, {
        indicatorId: currentIndicator.id,
        dimensionId: currentDimension.id,
        score,
        desiredScore: score,
        deficiencyType: null,
      });

      const feedbackEntry = currentRawIndicator?.feedbackPerLevel.find(
        (f) => f.level === score
      );

      saveResponse({
        indicatorId: currentIndicator.id,
        dimensionId: currentDimension.id,
        score,
        feedbackShown: feedbackEntry?.feedback ?? '',
      });

      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => {
        if (!(isLastIndicatorInDimension && isLastDimension)) {
          goNext();
        }
      }, 2000);
    },
    [currentIndicator, currentDimension, currentRawIndicator, setResponse, saveResponse, goNext, isLastIndicatorInDimension, isLastDimension]
  );

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    await submitDiagnostic();
    setSubmitting(false);
    router.push(`/diagnostic/${cycleId}/result`);
  }, [cycleId, router, setSubmitting, submitDiagnostic]);

  if (dimensions.length === 0) {
    return (
      <div className={styles.container}>
        <p>Nenhuma dimensao encontrada para este diagnostico.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.progressSection}>
        <ProgressTracker dimensions={dimensionProgress} />
      </div>

      <div className={styles.dimensionTabs}>
        {dimensions.map((dim, idx) => (
          <button
            key={dim.id}
            type="button"
            className={`${styles.tab} ${idx === currentDimensionIndex ? styles.tabActive : ''}`}
            onClick={() => setCurrentDimension(idx)}
          >
            {dim.name}
          </button>
        ))}
      </div>

      {currentDimension && currentIndicator && (
        <>
          <p className={styles.dimensionLabel}>{currentDimension.name}</p>
          <p className={styles.indicatorCount}>
            Indicador {currentIndicatorIndex + 1} de {currentDimension.indicators.length}
            {' '}&middot;{' '}
            {totalAnswered} de {totalIndicators} respondidos
          </p>

          <QuestionCard
            key={currentIndicator.id}
            indicator={currentIndicator}
            onAnswer={handleAnswer}
          />

          <FeedbackPanel feedback={activeFeedback} />

          <div className={styles.navigation}>
            <button
              type="button"
              className={styles.navBtn}
              disabled={isFirstQuestion}
              onClick={goPrev}
            >
              &larr; Anterior
            </button>

            {allComplete ? (
              <button
                type="button"
                className={styles.submitBtn}
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Enviando...' : 'Finalizar Diagnostico'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.navBtn}
                disabled={isLastIndicatorInDimension && isLastDimension}
                onClick={goNext}
              >
                Proximo &rarr;
              </button>
            )}
          </div>
        </>
      )}

      {allComplete && !currentIndicator && (
        <div className={styles.completeBanner}>
          <h2 className={styles.completeTitle}>Diagnostico completo!</h2>
          <p className={styles.completeText}>
            Todas as dimensoes foram respondidas. Clique abaixo para finalizar.
          </p>
          <button
            type="button"
            className={styles.submitBtn}
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Enviando...' : 'Finalizar Diagnostico'}
          </button>
        </div>
      )}
    </div>
  );
}
