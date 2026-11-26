import { Suspense, lazy, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightOutlined, CheckCircleOutlined, ClockCircleOutlined, ExpandOutlined, InfoCircleOutlined, ReloadOutlined, RightOutlined, TeamOutlined } from '@ant-design/icons'
import { Alert, Button, message, Card, Col, Empty, Modal, Progress, Row, Segmented, Select, Skeleton, Space, Table, Tabs, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ColumnConfig } from '@ant-design/plots'
import { chartColors } from '../../config/appColors'
import type { AdvisorAcademicTerm, AdvisorHistoryStudent, AdvisorSummary, AdvisorSummaryBlock, AdvisorSummaryEntryYear, GpaxRanges, AdvisorHistory } from '../../types/AdvisorSummary'
import { useAdvisorHistory } from './useAdvisorHistory'
import { useAdvisorSummary } from './useAdvisorSummary'
import { getAdvisorGpaxStudents, getAdvisorTermStudents } from '../../services/advisorSummaryService'
import AdvisorStudentModal from './AdvisorStudentModal'
import CourseBacklog from './CourseBacklog'
import './advisorDashboard.css'

const Column = lazy(() => import('@ant-design/plots').then((module) => ({ default: module.Column })))
const gpaxRanges = [
    { key: 'range_3_25_4_00', label: '3.25 – 4.00', color: chartColors.gradeExcellent, text: '#17658d' },
    { key: 'range_2_00_3_24', label: '2.00 – 3.24', color: chartColors.gradeGood, text: '#337446' },
    { key: 'range_1_75_1_99', label: '1.75 – 1.99', color: chartColors.gradeBelowStandard, text: '#a94a13' },
    { key: 'range_0_00_1_74', label: '0.00 – 1.74', color: chartColors.gradeLow, text: '#ba3434' },
] as const
const noGpaxSeries = { key: 'no_gpax', label: 'ไม่มีค่า GPAX', color: '#94a3b8' }
const statusSeries = [
    { key: 'studying', label: 'กำลังศึกษา', color: '#4f91db' },
    { key: 'graduated', label: 'จบการศึกษา', color: '#64b396' },
    { key: 'retired', label: 'พ้นสภาพ', color: '#de7a80' },
    { key: 'other', label: 'สถานะอื่น', color: '#94a3b8' },
]
const planSeries = [
    { key: 'on_plan', label: 'ตามแผน', color: '#64b396' },
    { key: 'off_plan', label: 'ไม่ตามแผน', color: '#f18484' },
    { key: 'retired', label: 'พ้นสภาพ', color: '#a65d68' },
    { key: 'unknown', label: 'รอประเมิน', color: '#94a3b8' },
]
const unavailableSeries = { key: 'curriculum_unavailable', label: 'โหลดข้อมูลหลักสูตรไม่ได้', color: '#cc9449' }
const curriculumMessage = 'ติดต่อ CMIS ไม่ได้ และยังไม่มีข้อมูลหลักสูตรที่บันทึกไว้ครบ ลองรีเฟรชอีกครั้งเมื่อเชื่อมต่อได้'
const PLAN_RULE = 'ตามแผน: ผ่านทุกรายวิชาในแผนที่ถึงกำหนดจนถึงภาคล่าสุดที่นำเข้าเกรด • ไม่ตามแผน: ยังมีวิชาที่ถึงกำหนดแต่ยังไม่ผ่านหรือยังไม่ได้เรียน'
const number = (value: number) => value.toLocaleString('th-TH')
const cohortLabel = (year: number) => `เข้าศึกษาปี ${year + 543}`
const percent = (value: number, total: number) => total > 0 ? Math.round(value / total * 100) : 0

function ChartModal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
    return (
        <Modal
            title={title}
            open={open}
            onCancel={onClose}
            footer={null}
            width="min(1200px, calc(100vw - 32px))"
            centered
            destroyOnHidden
            className="advisor-chart-modal"
        >
            {children}
        </Modal>
    )
}

function ExpandChartButton({ title, onClick }: { title: string; onClick: () => void }) {
    return (
        <Tooltip title="ขยายกราฟ">
            <Button
                size="small"
                icon={<ExpandOutlined />}
                aria-label={`ขยายกราฟ ${title}`}
                onClick={onClick}
            >
                ขยาย
            </Button>
        </Tooltip>
    )
}

function SectionCard({ title, description, extra, expandable = false, children }: { title: string; description?: string; extra?: ReactNode; expandable?: boolean; children: ReactNode }) {
    const [expanded, setExpanded] = useState(false)
    return <Card className="advisor-section">
        <div className="advisor-section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>
            <Space>{extra}{expandable && <ExpandChartButton title={title} onClick={() => setExpanded(true)} />}</Space>
        </div>
        {children}
        {expandable && <ChartModal title={title} open={expanded} onClose={() => setExpanded(false)}>
            {description && <p className="advisor-modal-description">{description}</p>}
            {children}
        </ChartModal>}
    </Card>
}

interface StackSeries { key: string; label: string; color: string }
interface StackRow { category: string; counts: Record<string, number | null> }
interface StackDatum { category: string; series: string; count: number | null; percent: number; total: number }

interface StackChartProps {
    title: string
    rows: StackRow[]
    series: StackSeries[]
    percentBase?: 'category' | 'all'
    defaultMode?: 'count' | 'percent'
    percentLabel?: string
    axisLabel?: (category: string) => string
    caption?: ReactNode
    note?: string
}

function StackChart({ title, rows, series, percentBase = 'category', defaultMode = 'count', percentLabel, axisLabel, caption, note }: StackChartProps) {
    const [mode, setMode] = useState<string>(defaultMode)
    const [expanded, setExpanded] = useState(false)
    if (!rows.some((row) => series.some((item) => (row.counts[item.key] ?? 0) > 0))) {
        return <div className="advisor-chart-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีนิสิตกลุ่มนี้" /></div>
    }
    const allCount = rows.reduce((sum, row) => sum + series.reduce((count, item) => count + (row.counts[item.key] ?? 0), 0), 0)
    const data: StackDatum[] = rows.flatMap((row) => {
        const total = percentBase === 'all' ? allCount : series.reduce((sum, item) => sum + (row.counts[item.key] ?? 0), 0)
        return series.map((item) => ({ category: row.category, series: item.label, count: row.counts[item.key], total, percent: total > 0 ? (row.counts[item.key] ?? 0) / total * 100 : 0 }))
    })
    const config: ColumnConfig = {
        data, xField: 'category', yField: mode === 'percent' ? 'percent' : 'count', colorField: 'series', stack: true,
        height: 270, autoFit: true,
        scale: { color: { domain: series.map((item) => item.label), range: series.map((item) => item.color) }, ...(mode === 'percent' ? { y: { domain: [0, 100] } } : { y: { tickMinStep: 1 } }) },
        legend: false,
        axis: { x: { title: false, ...(axisLabel && { labelFormatter: axisLabel, labelAutoRotate: false }) }, y: { title: mode === 'percent' ? 'ร้อยละ (%)' : 'จำนวน (คน)', labelFormatter: mode === 'percent' ? (value: string) => `${value}%` : undefined } },
        style: { maxWidth: 44 },
        tooltip: { items: [(datum: StackDatum) => ({ name: datum.series, value: datum.count == null ? 'ไม่มีข้อมูล' : `${number(datum.count)} จาก ${number(datum.total)} คน (${datum.percent.toFixed(1)}%)` })] },
    }
    const renderChart = (large: boolean) => (
        <div className="advisor-chart">
            {caption}
            <div className="advisor-chart-toolbar">
                <div className="advisor-legend">{series.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}</div>
                <Space size={8}>
                    <Segmented size="small" aria-label={`หน่วยแสดงกราฟ ${title}`} value={mode} onChange={setMode} options={[{ label: 'คน', value: 'count' }, { label: '%', value: 'percent' }]} />
                    {!large && <ExpandChartButton title={title} onClick={() => setExpanded(true)} />}
                </Space>
            </div>
            {mode === 'percent' && <p className="advisor-chart-unit">{percentLabel ?? (percentBase === 'all' ? 'ร้อยละของนิสิตทั้งหมดที่ระบุชั้นปี' : 'ร้อยละของนิสิตภายในแต่ละปีที่เข้าศึกษา')}</p>}
            <Suspense fallback={<Skeleton active paragraph={{ rows: 5 }} />}>
                <Column {...config} height={large ? 460 : 270} />
            </Suspense>
        </div>
    )
    return <>
        {renderChart(false)}
        <ChartModal title={title} open={expanded} onClose={() => setExpanded(false)}>
            {renderChart(true)}
            <p className="advisor-footnote">ชี้ที่แท่งกราฟเพื่อดูจำนวนคนและร้อยละ</p>
            {note && <p className="advisor-footnote"><InfoCircleOutlined /> {note}</p>}
        </ChartModal>
    </>
}

function GpaxChart({ title, rows, pick }: { title: string; rows: AdvisorSummaryEntryYear[]; pick: (row: AdvisorSummaryEntryYear) => GpaxRanges }) {
    const populated = rows.filter((row) => Object.values(pick(row)).some((count) => count > 0))
    return <StackChart title={title} rows={populated.map((row) => ({ category: String(row.entry_year + 543), counts: pick(row) }))}
        note="GPAX 0.00 อาจเกิดจากยังไม่ได้นำเข้าเกรด ควรตรวจสอบข้อมูลก่อนตีความช่วงผลการเรียน"
        series={[...gpaxRanges.map((range) => ({ key: range.key, label: range.label, color: range.color })), ...(populated.some((row) => pick(row).no_gpax > 0) ? [noGpaxSeries] : [])]} />
}

function PendingPanel({ title, block, children }: { title: string; block: AdvisorSummaryBlock; children: ReactNode }) {
    return <div className="advisor-pending"><span className="advisor-pending-icon"><ClockCircleOutlined /></span>
        <div><h3>{title}</h3><Tag>{block.available ? 'รอแสดงผล' : 'ข้อมูลยังไม่พร้อม'}</Tag><p>{children}</p></div>
    </div>
}

interface AdvisorTermRow extends AdvisorAcademicTerm { total: number }
const termPercent = new Intl.NumberFormat('th-TH', { style: 'percent', maximumFractionDigits: 1 })

interface TermView {
    term: AdvisorAcademicTerm
    only: 'off_plan' | 'all'
    students: AdvisorHistoryStudent[] | null
}

function AnnualReport({ history }: { history: AdvisorHistory }) {
    const [year, setYear] = useState(1)
    const [detailOpen, setDetailOpen] = useState(false)
    const group = history.gpa_by_study_year.find((item) => item.study_year === year)
    const cohorts = group?.cohorts ?? []
    const title = `GPA ชั้นปีที่ ${year}`
    return <SectionCard title="ผลการเรียนตามชั้นปี" description="GPA ของชั้นปีที่เลือก คำนวณถ่วงน้ำหนักตามหน่วยกิต รวมภาคฤดูร้อน" extra={
        <Segmented aria-label="เลือกชั้นปีสำหรับดู GPA" value={year} onChange={setYear}
            options={history.gpa_by_study_year.map((item) => ({ label: `ปี ${item.study_year}`, value: item.study_year }))} />
    }>
        <StackChart title={title} series={[...gpaxRanges]} rows={cohorts.map((cohort) => ({ category: String(cohort.entry_year + 543), counts: cohort.ranges }))} />
        <Button disabled={!cohorts.length} onClick={() => setDetailOpen(true)}>ดูรายชื่อชั้นปีที่ {year}</Button>
        <AdvisorStudentModal key={title} title={title} students={detailOpen ? cohorts.flatMap((cohort) => cohort.students) : null}
            gradeContext="annual" onClose={() => setDetailOpen(false)} />
    </SectionCard>
}

function TermReport({ history }: { history: AdvisorHistory }) {
    const [termView, setTermView] = useState<TermView | null>(null)
    const requestSequence = useRef(0)
    const [selectedYear, setSelectedYear] = useState<number | 'all'>()
    const allTerms = history.academic_terms.toSorted((a, b) => a.academic_year - b.academic_year || a.semester_order - b.semester_order)
    const years = [...new Set(allTerms.map((term) => term.academic_year))].reverse()
    const year = selectedYear === 'all' || (selectedYear !== undefined && years.includes(selectedYear)) ? selectedYear : years[0]
    const terms = year === 'all' ? allTerms : allTerms.filter((term) => term.academic_year === year)
    const axisLabels = new Map(terms.map((term, index) => {
        const firstOfYear = term.academic_year !== terms[index - 1]?.academic_year
        const yearLabel = firstOfYear ? String(term.academic_year + 543) : ''
        return [term.term_label, year === 'all' ? yearLabel : term.semester_name]
    }))
    const closeTerm = () => {
        requestSequence.current++
        setTermView(null)
    }
    const openTerm = async (term: AdvisorAcademicTerm, only: TermView['only']) => {
        const request = ++requestSequence.current
        setTermView({ term, only, students: null })
        try {
            const students = await getAdvisorTermStudents(term.academic_year, term.semester_order)
            if (request === requestSequence.current) setTermView({ term, only, students })
        } catch {
            if (request === requestSequence.current) {
                void message.error('โหลดรายชื่อนิสิตของภาคนี้ไม่สำเร็จ')
                setTermView(null)
            }
        }
    }
    const termRows = terms.map((term) => ({
        ...term,
        total: term.on_plan + term.off_plan + term.unknown + (term.curriculum_unavailable ?? 0),
    }))
    const hasUnavailable = terms.some(term => term.curriculum_unavailable)
    const columns: ColumnsType<AdvisorTermRow> = [
        { title: 'ภาคเรียน', key: 'term', render: (_, term) => `${term.semester_name} ${term.academic_year + 543}` },
        { title: 'มีผลการเรียน (คน)', dataIndex: 'total', align: 'right', render: number },
        { title: 'ตามแผน', dataIndex: 'on_plan', align: 'right' },
        { title: 'ไม่ตามแผน', dataIndex: 'off_plan', align: 'right', render: (_, term) => term.off_plan === 0 ? (term.total > 0 ? '0 (0%)' : '0') :
            <Button type="link" danger size="small" className="advisor-off-plan-count" aria-label={`ดูนิสิตไม่ตามแผน ${term.term_label} ${number(term.off_plan)} จาก ${number(term.total)} คน`}
                onClick={() => void openTerm(term, 'off_plan')}>{number(term.off_plan)} ({termPercent.format(term.off_plan / term.total)})</Button> },
        { title: 'รอประเมิน', dataIndex: 'unknown', align: 'right' },
        ...(hasUnavailable ? [{ title: unavailableSeries.label, dataIndex: unavailableSeries.key, render: (count?: number) => number(count ?? 0) }] : []),
        { title: 'รายชื่อ', key: 'detail', render: (_, term) => <Button type="link" size="small" aria-label={`ดูรายชื่อทั้งภาค ${term.term_label}`}
            onClick={() => void openTerm(term, 'all')}>ดูรายชื่อทั้งภาค</Button> },
    ]
    const students = termView?.students ?? null
    const termStudents = termView?.only === 'off_plan' ? students?.filter((student) => student.plan_status === 'off_plan') ?? null : students
    const title = 'สถานะตามแผนเมื่อสิ้นภาคเรียน'
    const countsByTerm = <ul className="advisor-term-counts">{termRows.map((term) =>
        <li key={term.term_label}>{term.semester_name}{year === 'all' ? ` ${term.academic_year + 543}` : ''} <strong>{number(term.total)} คน</strong></li>)}</ul>
    const countLabel = 'จำนวนนิสิตที่มีข้อมูลผลการเรียนในแต่ละภาค'
    const caption = year === 'all' ? <details className="advisor-term-caption"><summary>{countLabel}</summary>{countsByTerm}</details>
        : <div className="advisor-term-caption">{countLabel}{countsByTerm}</div>
    return <SectionCard title={title} description="ดูว่านิสิตเรียนตามแผนหรือไม่ โดยใช้ผลการเรียนจนถึงสิ้นภาคนั้น" extra={
        years.length > 0 && <Select aria-label="กรองปีการศึกษาย้อนหลัง" value={year} onChange={setSelectedYear} style={{ width: '12rem' }}
            options={[...years.map((value) => ({ label: `ปีการศึกษา ${value + 543}`, value })), { label: 'ทุกปีการศึกษา', value: 'all' as const }]} />
    }>
        {terms.length === 0 ? <Empty description="ยังไม่มีผลการเรียนรายภาค" /> : <>
            <StackChart title={title} caption={caption} defaultMode="percent" percentLabel="ร้อยละของนิสิตที่มีข้อมูลผลการเรียนในภาคนั้น"
                axisLabel={(category) => axisLabels.get(category) ?? category} series={[...planSeries.filter((item) => item.key !== 'retired'), ...(hasUnavailable ? [unavailableSeries] : [])]}
                rows={terms.map((term) => ({ category: term.term_label, counts: { on_plan: term.on_plan, off_plan: term.off_plan, unknown: term.unknown, curriculum_unavailable: term.curriculum_unavailable ?? 0 } }))} />
            <Table<AdvisorTermRow> key={year} className="advisor-cohort-table" rowKey={(term) => `${term.academic_year}-${term.semester_order}`}
                columns={columns} dataSource={termRows.toReversed()} size="middle" scroll={{ x: 790 }}
                pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }} />
            {terms.some(term => term.incomplete_curriculum) && <p className="advisor-footnote">{curriculumMessage}</p>}
            <p className="advisor-footnote">“รอประเมิน” คือนิสิตที่มีข้อมูลผลการเรียนในภาคนั้น แต่ข้อมูลยังไม่พอที่จะเทียบกับแผนการเรียน</p>
        </>}
        <AdvisorStudentModal key={`term-${termView?.only}-${termView?.term.term_label}`}
            title={termView ? `${termView.only === 'off_plan' ? 'นิสิตไม่ตามแผน' : 'รายชื่อนิสิต'} · ปีการศึกษา ${termView.term.term_label}` : ''}
            students={termStudents} loading={termView !== null && students === null} gradeContext="term" showPending={termView?.only === 'off_plan'}
            pendingTermLabel={termView?.only === 'off_plan' ? `ปีการศึกษา ${termView.term.term_label}` : undefined} onClose={closeTerm} />
    </SectionCard>
}

function HistoryReport({ state, annual = false }: { state: ReturnType<typeof useAdvisorHistory>; annual?: boolean }) {
    const { history, loading, loadError, load } = state
    if (loadError) return <Alert type="error" showIcon title={loadError} action={<Button size="small" onClick={() => void load()}>ลองใหม่</Button>} />
    if (!history) return <Skeleton active={loading} paragraph={{ rows: 6 }} />
    return <>
        {annual ? <AnnualReport history={history} /> : <TermReport history={history} />}
        <p className="advisor-footnote">มีประวัติเกรด {number(history.history_coverage.with_grades)} คน · ยังไม่มีประวัติเกรด {number(history.history_coverage.without_grades)} คน</p>
    </>
}

function CohortSection({ summary }: { summary: AdvisorSummary }) {
    const [detail, setDetail] = useState<AdvisorSummaryEntryYear | null>(null)
    const [offPlanCohort, setOffPlanCohort] = useState<AdvisorSummaryEntryYear | null>(null)
    const [entryYear, setEntryYear] = useState<number | 'all'>('all')
    const rows = summary.by_entry_year.filter((row) => entryYear === 'all' || row.entry_year === entryYear)
    const cohortStudentIds = new Set(offPlanCohort?.students.map((student) => student.id) ?? [])
    const offPlanStudents = offPlanCohort === null ? null : summary.off_plan_students.filter((student) => cohortStudentIds.has(student.id))
    const planAvailable = summary.blocks.plan_status.available
    const hasUnavailable = rows.some(row => row.plan.curriculum_unavailable)
    const columns: ColumnsType<AdvisorSummaryEntryYear> = [
        { title: 'ปีที่เข้าศึกษา', dataIndex: 'entry_year', fixed: 'left', width: 120, render: (year: number) => <strong>{year + 543}</strong>, sorter: (a, b) => a.entry_year - b.entry_year },
        { title: 'ทั้งหมด', dataIndex: 'total', align: 'right', sorter: (a, b) => a.total - b.total },
        { title: 'กำลังศึกษา', dataIndex: 'studying', align: 'right' },
        { title: <Tooltip title={PLAN_RULE}>ตามแผน <InfoCircleOutlined /></Tooltip>, key: 'on_plan', align: 'right', render: (_, row) => planAvailable ? row.plan.on_plan : '—' },
        { title: 'ไม่ตามแผน', key: 'off_plan', align: 'right', render: (_, row) => !planAvailable ? '—' : row.plan.off_plan === 0 ? 0 : <Tooltip title="ดูรายชื่อและวิชาที่ยังค้างของรุ่นนี้"><Button danger type="link" size="small" className="advisor-off-plan-count" aria-label={`ดูนิสิตไม่ตามแผน · ${cohortLabel(row.entry_year)} ${number(row.plan.off_plan)} คน`} onClick={() => setOffPlanCohort(row)}>{number(row.plan.off_plan)}</Button></Tooltip> },
        { title: 'รอประเมินแผน', key: 'unknown', align: 'right', render: (_, row) => row.plan.unknown },
        { title: 'จบการศึกษา', dataIndex: 'graduated', align: 'right' },
        { title: 'พ้นสภาพ', dataIndex: 'retired', align: 'right' },
        { title: 'อื่น ๆ', dataIndex: 'other', align: 'right' },
        ...(hasUnavailable ? [{ title: unavailableSeries.label, key: unavailableSeries.key, render: (_: unknown, row: AdvisorSummaryEntryYear) => number(row.plan.curriculum_unavailable ?? 0) }] : []),
        { title: 'รายชื่อในรุ่น', key: 'detail', width: 112, align: 'left', render: (_, row) =>
            <Button type="link" className="advisor-cohort-roster" aria-haspopup="dialog"
                aria-label={`ดูรายชื่อนิสิตที่${cohortLabel(row.entry_year)}`} onClick={() => setDetail(row)}>
                <span>ดูรายชื่อ</span><RightOutlined aria-hidden="true" />
            </Button> },
    ]
    const totals = rows.reduce((sum, row) => sum.map((value, index) => value + [row.total, row.studying, row.plan.on_plan, row.plan.off_plan, row.plan.unknown, row.graduated, row.retired, row.other][index]), Array<number>(8).fill(0))
    return <div className="advisor-content"><SectionCard title="สถานะนิสิตแยกตามปีที่เข้าศึกษา" description="สถานะล่าสุดของนิสิตที่เริ่มเรียนในปีเดียวกัน" extra={
        <Select aria-label="กรองปีที่เข้าศึกษา" value={entryYear} onChange={setEntryYear} options={[{ label: 'ทุกปีที่เข้าศึกษา', value: 'all' as const }, ...summary.by_entry_year.map((row) => ({ label: cohortLabel(row.entry_year), value: row.entry_year }))]} style={{ minWidth: 185 }} />
    }>
        <StackChart title={entryYear === 'all' ? 'นิสิตแยกตามปีที่เข้าศึกษา' : `นิสิต${cohortLabel(entryYear)}`} rows={rows.map((row) => ({ category: String(row.entry_year + 543), counts: { ...row.plan, graduated: row.graduated, retired: row.retired, other: row.other } }))} series={[...planSeries, ...(hasUnavailable ? [unavailableSeries] : []), { key: 'graduated', label: 'จบการศึกษา', color: '#4f91db' }, { key: 'other', label: 'สถานะอื่น', color: '#cbd5e1' }]} />
        <Table<AdvisorSummaryEntryYear> className="advisor-cohort-table" rowKey="entry_year" size="middle" columns={columns} dataSource={rows} pagination={false} scroll={{ x: 950 }}
            summary={() => <Table.Summary.Row><Table.Summary.Cell index={0}><strong>รวม</strong></Table.Summary.Cell>{totals.map((value, index) => <Table.Summary.Cell key={index} index={index + 1} align="right"><strong>{!planAvailable && (index === 2 || index === 3) ? '—' : number(value)}</strong></Table.Summary.Cell>)}{hasUnavailable && <Table.Summary.Cell index={9}><strong>{number(rows.reduce((sum, row) => sum + (row.plan.curriculum_unavailable ?? 0), 0))}</strong></Table.Summary.Cell>}</Table.Summary.Row>} />
        <p className="advisor-footnote">กดตัวเลข “ไม่ตามแผน” เพื่อดูรายชื่อและรายการค้างของรุ่นนั้น • ตามแผน/ไม่ตามแผนของรุ่นนับเฉพาะนิสิตที่ยังกำลังศึกษาในปัจจุบัน (รุ่นที่จบแล้วจึงเป็น 0) • รอประเมินแผน = ข้อมูลยังไม่พอที่จะเทียบกับเกณฑ์ของหลักสูตร</p>
        <AdvisorStudentModal key={detail?.entry_year ?? 'closed'} title={detail ? cohortLabel(detail.entry_year) : ''} students={detail?.students ?? null} onClose={() => setDetail(null)} />
        <AdvisorStudentModal key={`off-plan-${offPlanCohort?.entry_year ?? 'closed'}`} title={offPlanCohort ? `นิสิตที่ยังไม่ตามแผน · ${cohortLabel(offPlanCohort.entry_year)}` : ''} students={offPlanStudents} showPending showLatestTerm onClose={() => setOffPlanCohort(null)} />
    </SectionCard>
        <Row gutter={[20, 20]}>
            <Col xs={24} xl={12}><SectionCard title="GPAX สะสมของนิสิตปัจจุบัน" description="นิสิตที่กำลังศึกษา • เปรียบเทียบจำนวนหรือร้อยละได้"><GpaxChart title="GPAX สะสมของนิสิตปัจจุบัน" rows={rows} pick={(row) => row.gpax} /></SectionCard></Col>
            <Col xs={24} xl={12}><SectionCard title="GPAX สะสมของนิสิตที่จบการศึกษา" description="นิสิตที่จบการศึกษา แยกตามปีที่เข้าศึกษา"><GpaxChart title="GPAX สะสมของนิสิตที่จบการศึกษา" rows={rows} pick={(row) => row.graduated_gpax} /></SectionCard></Col>
        </Row>
    </div>
}

function SummaryContent({ summary, historyState }: { summary: AdvisorSummary; historyState: ReturnType<typeof useAdvisorHistory> }) {
    const [offPlanOpen, setOffPlanOpen] = useState(false)
    const [gpaxView, setGpaxView] = useState<{ title: string; students: AdvisorHistoryStudent[] | null } | null>(null)
    const gpaxRequest = useRef(0)
    const closeGpax = () => {
        gpaxRequest.current++
        setGpaxView(null)
    }
    const openGpax = async (range: keyof GpaxRanges, title: string) => {
        const request = ++gpaxRequest.current
        setGpaxView({ title, students: null })
        try {
            const students = await getAdvisorGpaxStudents(range)
            if (request === gpaxRequest.current) setGpaxView({ title, students })
        } catch {
            if (request === gpaxRequest.current) {
                setGpaxView(null)
                void message.error('โหลดรายชื่อไม่สำเร็จ กรุณาเลือกช่วง GPAX อีกครั้ง')
            }
        }
    }
    const { totals, studying_gpax: gpax, plan_status: plan } = summary
    const planAvailable = summary.blocks.plan_status.available
    const knownPlan = plan.on_plan + plan.off_plan
    const dataIssues = summary.data_quality.gpax_missing + summary.data_quality.gpax_zero
    if (totals.all === 0) return <Card><Empty description="ไม่พบนิสิตในที่ปรึกษา" /><div className="advisor-empty-action"><Link to="/students/advisor">ดูรายชื่อนิสิตในที่ปรึกษา <ArrowRightOutlined /></Link></div></Card>
    return <div className="advisor-content">
        <SectionCard title="นิสิตในที่ปรึกษาปัจจุบัน" description="ประเมินตามภาคล่าสุดที่นำเข้าผลการเรียนของนิสิตแต่ละคน" extra={<Tooltip title={PLAN_RULE}><Button type="text" shape="circle" aria-label="เกณฑ์การประเมินแผนการเรียน" icon={<InfoCircleOutlined />} /></Tooltip>}>
            <div className="advisor-current-total">กำลังศึกษา <strong>{number(totals.studying)}</strong> คน</div>
            {planAvailable ? <>
                <div className="advisor-plan-bar" aria-hidden="true">
                    {([['on_plan', '#64b396'], ['off_plan', '#f18484'], ['unknown', '#94a3b8'], ['curriculum_unavailable', unavailableSeries.color]] as const).map(([key, color]) =>
                        (plan[key] ?? 0) > 0 && <span key={key} style={{ flexGrow: plan[key], background: color }} />)}
                </div>
                <div className="advisor-plan-counts">
                    <span>ตามแผน <strong>{number(plan.on_plan)} คน</strong></span>
                    {plan.off_plan > 0 ? <Button className="advisor-off-plan-count" type="link" danger onClick={() => setOffPlanOpen(true)}>ยังไม่ตามแผน {number(plan.off_plan)} คน · ดูรายชื่อ <ArrowRightOutlined /></Button> : <span>ยังไม่ตามแผน <strong>0 คน</strong></span>}
                    <span>รอประเมิน <strong>{number(plan.unknown)} คน</strong></span>
                    {!!plan.curriculum_unavailable && <span>{unavailableSeries.label} <strong>{number(plan.curriculum_unavailable)} คน</strong></span>}
                </div>
                <p className="advisor-footnote">ประเมินได้ {number(knownPlan)} จาก {number(totals.studying)} คน</p>
            </> : <PendingPanel title="สถานะตามแผนการเรียน" block={summary.blocks.plan_status}>{plan.unknown > 0 ? `ยังประเมินไม่ได้ ${number(plan.unknown)} คน ข้อมูลยังไม่พอที่จะเทียบกับเกณฑ์ของหลักสูตร` : 'ยังไม่มีข้อมูลเพียงพอสำหรับประเมินแผนการเรียน'}</PendingPanel>}
            {summary.blocks.plan_status.reason === 'imported_plan_result' && <Alert type="info" showIcon title="ติดต่อ CMIS ไม่ได้ สถานะของนิสิตที่ได้รับผลกระทบอ้างอิงจากการนำเข้าเกรดครั้งล่าสุด" />}
            {summary.blocks.plan_status.reason === 'curriculum_unavailable' && <Alert type="warning" showIcon title={curriculumMessage} />}
            <div className="advisor-lifetime"><span>นิสิตทั้งหมด {number(totals.all)} คน</span><span>จบการศึกษา {number(totals.graduated)} คน</span>
                <span>พ้นสภาพ {number(totals.retired)} คน</span><span>สถานะอื่น {number(totals.other)} คน</span></div>
        </SectionCard>
        <SectionCard title="นิสิตตกค้างรายวิชา" description="วิชาที่นิสิตในที่ปรึกษายังเรียนไม่ผ่าน แยกตามปีที่เข้าศึกษา">
            {summary.blocks.plan_status.reason === 'curriculum_unavailable' && <p className="advisor-footnote">แสดงเฉพาะรายการค้างที่ยืนยันได้ ข้อมูลหลักสูตรบางส่วนยังโหลดไม่ได้</p>}
            {summary.blocks.plan_status.reason === 'imported_plan_result' && <p className="advisor-footnote">บางรายการใช้ผลนำเข้าเกรดล่าสุด จะแสดงจำนวนหน่วยกิตหรือชั่วโมงเฉพาะเมื่อยืนยันหน่วยได้</p>}
            <CourseBacklog summary={summary} history={historyState.history} />
        </SectionCard>
        {dataIssues > 0 && <div className="advisor-attention"><span className="advisor-attention-icon"><InfoCircleOutlined /></span>
            <div><strong>{dataIssues > 0 ? 'ตรวจสอบความครบถ้วนของผลการเรียนก่อนใช้ตัวเลขติดตามนิสิต' : 'ข้อมูลสำหรับติดตามนิสิตในที่ปรึกษา'}</strong>
                <p>{dataIssues > 0 ? `นิสิตที่กำลังศึกษาหรือจบการศึกษามี GPAX 0.00 จำนวน ${number(summary.data_quality.gpax_zero)} คน และไม่มีค่า GPAX ${number(summary.data_quality.gpax_missing)} คน ค่า 0.00 อาจเกิดจากยังไม่ได้นำเข้าเกรด จึงยังสรุปไม่ได้ว่าเป็นผลการเรียนต่ำจริง` : 'ใช้ช่วง GPAX ร่วมกับความก้าวหน้าตามแผนการเรียน เพื่อประกอบการให้คำปรึกษา'}</p>
            </div><Link to="/students/advisor">ดูรายชื่อ <ArrowRightOutlined /></Link>
        </div>}
        <Row gutter={[20, 20]}>
            <Col xs={24} xl={14}><SectionCard expandable title="ผลการเรียนของนิสิตปัจจุบัน" description={`ช่วง GPAX ของนิสิตที่กำลังศึกษา ${number(totals.studying)} คน`} extra={<Tag color="blue">GPAX</Tag>}>
                <div className="advisor-gpax-grid">{gpaxRanges.map((range) => <div key={range.key} className="advisor-gpax-item" style={{ '--range-color': range.color, '--range-text': range.text } as CSSProperties}>
                    <div className="advisor-range-label"><i />{range.label}</div><div className="advisor-range-value">
                        {gpax[range.key] > 0 ? <button type="button" className="advisor-gpax-count"
                            aria-label={`ดูรายชื่อนิสิต GPAX ${range.label} จำนวน ${number(gpax[range.key])} คน`}
                            onClick={() => void openGpax(range.key, `นิสิตกำลังศึกษา · GPAX ${range.label}`)}>{number(gpax[range.key])}</button> : 0}<span>คน</span>
                    </div>
                    <Progress percent={percent(gpax[range.key], totals.studying)} showInfo={false} strokeColor={range.color} size="small" />
                    <span className="advisor-range-caption">{percent(gpax[range.key], totals.studying)}% ของนิสิตที่กำลังศึกษา</span>
                </div>)}</div><div className="advisor-card-note"><InfoCircleOutlined /> ไม่มีค่า GPAX {gpax.no_gpax > 0 ? <button type="button" className="advisor-gpax-count"
                    aria-label={`ดูรายชื่อนิสิตที่ไม่มีค่า GPAX จำนวน ${number(gpax.no_gpax)} คน`}
                    onClick={() => void openGpax('no_gpax', 'นิสิตกำลังศึกษา · ไม่มีค่า GPAX')}>{number(gpax.no_gpax)} คน</button> : '0 คน'}</div>
            </SectionCard></Col>
            <Col xs={24} xl={10}><SectionCard title="นิสิตปัจจุบันแยกตามชั้นปี" description="จำนวนนิสิตที่กำลังศึกษาในแต่ละชั้นปี">
                <StackChart title="นิสิตปัจจุบันแยกตามชั้นปี" percentBase="all" rows={summary.studying_by_study_year.map((row) => ({ category: `ปี ${row.study_year}`, counts: { studying: row.count } }))} series={[statusSeries[0]]} />
                <div className="advisor-year-counts">{summary.studying_by_study_year.map((row) => <span key={row.study_year}>ปี {row.study_year}<strong>{number(row.count)} คน</strong></span>)}</div>
                {totals.studying > summary.studying_by_study_year.reduce((sum, row) => sum + row.count, 0) && <p className="advisor-footnote">ไม่ระบุชั้นปี {number(totals.studying - summary.studying_by_study_year.reduce((sum, row) => sum + row.count, 0))} คน</p>}
            </SectionCard></Col>
        </Row>
        <Tabs className="advisor-report-tabs" defaultActiveKey="cohorts" items={[
            { key: 'cohorts', label: 'แยกตามปีที่เข้าศึกษา', children: <CohortSection summary={summary} /> },
            { key: 'terms', label: 'ย้อนหลังรายภาคเรียน', children: <HistoryReport state={historyState} /> },
            { key: 'annual', label: 'ผลการเรียนตามชั้นปี', children: <HistoryReport state={historyState} annual /> },
        ]} />
        <div className="advisor-bottom-note"><CheckCircleOutlined /> สรุปจากข้อมูลที่มีในระบบ • “ไม่มีข้อมูล” แสดงแยกจากจำนวนศูนย์ • การเรียนตามแผนใช้เกณฑ์รายวิชาที่ถึงกำหนด</div>
        <AdvisorStudentModal key={gpaxView?.title ?? 'gpax-closed'} title={gpaxView?.title ?? ''} students={gpaxView?.students ?? null}
            loading={gpaxView !== null && gpaxView.students === null} showLatestTerm onClose={closeGpax} />
        <AdvisorStudentModal key={offPlanOpen ? 'off-plan-open' : 'off-plan-closed'} title="นิสิตที่ยังเรียนไม่ตามแผน" students={offPlanOpen ? summary.off_plan_students : null} showPending showLatestTerm onClose={() => setOffPlanOpen(false)} />
    </div>
}

export default function AdvisorDashboardPage() {
    const { summary, loading, loadError, load } = useAdvisorSummary()
    const historyState = useAdvisorHistory()
    return <div className="student-page advisor-dashboard">
        <div className="advisor-hero"><div><span className="advisor-eyebrow"><TeamOutlined /> สำหรับอาจารย์ที่ปรึกษา</span><h1>ภาพรวมนิสิตในที่ปรึกษา</h1>
            {summary?.teacher_full_name && <div className="advisor-teacher"><span />{summary.teacher_full_name}</div>}</div>
            <Space wrap><Button icon={<ReloadOutlined />} loading={loading} onClick={() => { void load(); void historyState.load() }}>รีเฟรชข้อมูล</Button><Link className="advisor-primary-link" to="/students/advisor">รายชื่อนิสิต <ArrowRightOutlined /></Link></Space>
        </div>
        {loadError && <Alert className="advisor-load-error" type="error" showIcon title={loadError} action={<Button size="small" onClick={() => void load()}>ลองใหม่</Button>} />}
        {loading ? <div className="advisor-loading" aria-label="กำลังโหลดภาพรวมนิสิต"><Skeleton active paragraph={{ rows: 8 }} /></div> : summary ? <SummaryContent summary={summary} historyState={historyState} /> : !loadError && <Card><Empty description="ไม่มีข้อมูล" /></Card>}
    </div>
}
