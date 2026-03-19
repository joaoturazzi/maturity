'use client'

import { PeriodSelector } from '../PeriodSelector/PeriodSelector'
import { ExportButton } from '../ExportButton/ExportButton'
import dynamic from 'next/dynamic'

const IMETrendChart = dynamic(
  () => import('../IMETrendChart/IMETrendChart').then(m => m.IMETrendChart),
  { ssr: false, loading: () => <div style={{ height: 280, background: '#f0efec', borderRadius: 8 }} /> }
)
import { DimensionTrends } from '../DimensionTrends/DimensionTrends'
import { ActionPlanCompletion } from '../ActionPlanCompletion/ActionPlanCompletion'
import { TaskThroughput } from '../TaskThroughput/TaskThroughput'
import { AlertHistory } from '../AlertHistory/AlertHistory'
import styles from './ReportsClient.module.css'

type Period = {
  period: string
  cycleId: string
  imeScore: number
  maturityLevel: string | null
  submittedAt: Date | null
}

type ReportData = {
  period: string
  currentCycle: Period
  previousCycle: Period | null
  allCycles: Period[]
  dimensionScores: Array<{
    weightedScore: string | null
    priorityLevel: string | null
    prevScore: number | null
    delta: number | null
    dimension: { name: string; color: string | null } | null
  }>
  actionPlans: Array<{
    title: string
    priority: string | null
    completionPct: number
    doneTasks: number
    pendingTasks: number
    blockedTasks: number
    dimension: { name: string; color: string | null; colorBg: string | null } | null
  }>
  throughput: { completed: number; active: number; blocked: number }
  alertHistory: Array<{
    id: string
    alertType: string | null
    severity: string | null
    message: string | null
    isRead: boolean | null
    createdAt: Date | null
  }>
} | null

export function ReportsClient({
  periods,
  selectedPeriod,
  data,
}: {
  periods: Period[]
  selectedPeriod: string
  data: ReportData
}) {
  if (!data) return <p className={styles.empty}>Dados não encontrados para este período.</p>

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <PeriodSelector periods={periods} selected={selectedPeriod} />
        <ExportButton period={selectedPeriod} />
      </div>

      <IMETrendChart cycles={data.allCycles} />
      <DimensionTrends scores={data.dimensionScores} />

      <div className={styles.row}>
        <ActionPlanCompletion plans={data.actionPlans} />
        <TaskThroughput throughput={data.throughput} />
      </div>

      <AlertHistory alerts={data.alertHistory} />
    </div>
  )
}
