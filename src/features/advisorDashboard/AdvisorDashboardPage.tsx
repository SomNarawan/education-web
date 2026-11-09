import { Suspense, createContext, lazy, useContext, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightOutlined, BookOutlined, CheckCircleOutlined, ClockCircleOutlined, ExpandOutlined, InfoCircleOutlined, ReloadOutlined, SafetyCertificateOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Empty, Modal, Progress, Row, Segmented, Select, Skeleton, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ColumnConfig } from '@ant-design/plots'
import { chartColors } from '../../config/appColors'
import type { AdvisorAcademicTerm, AdvisorHistoryStudent, AdvisorSummary, AdvisorSummaryBlock, AdvisorSummaryEntryYear, GpaxRanges } from '../../types/AdvisorSummary'
import { useAdvisorSummary } from './useAdvisorSummary'
import AdvisorStudentModal from './AdvisorStudentModal'
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
    { key: 'unknown', label: 'รอข้อมูล', color: '#94a3b8' },
]
const PLAN_RULE = 'ตามแผน: ผ่านทุกรายวิชาในแผนที่ถึงกำหนดจนถึงภาคล่าสุดที่นำเข้าเกรด • ไม่ตามแผน: ยังมีวิชาที่ถึงกำหนดแต่ยังไม่ผ่านหรือยังไม่ได้เรียน'
const number = (value: number) => value.toLocaleString('th-TH')
const cohortLabel = (year: number) => `รุ่น ${String((year + 543) % 100).padStart(2, '0')}`
const percent = (value: number, total: number) => total > 0 ? Math.round(value / total * 100) : 0
const ExpandedChartContext = createContext(false)

function PlanProgress({ available, value }: { available: boolean; value: number }) {
    const expanded = useContext(ExpandedChartContext)
    return (
        <Progress
            type="circle"
            size={expanded ? 200 : 112}
            percent={value}
            strokeColor="#64b396"
            trailColor="#edf2f7"
            format={() => <span className="advisor-plan-indicator">
                <strong>{available ? `${value}%` : '—'}</strong>
                <small>{available ? 'ตามแผน' : 'รอข้อมูล'}</small>
            </span>}
        />
    )
}

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
            <ExpandedChartContext.Provider value>{children}</ExpandedChartContext.Provider>
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
interface StackRow { category: string; counts: Record<string, number> }
interface StackDatum { category: string; series: string; count: number; percent: number }

function StackChart({ title, rows, series, percentBase = 'category', note }: { title: string; rows: StackRow[]; series: StackSeries[]; percentBase?: 'category' | 'all'; note?: string }) {
    const [mode, setMode] = useState<string>('count')
    const [expanded, setExpanded] = useState(false)
    if (!rows.some((row) => series.some((item) => row.counts[item.key] > 0))) {
        return <div className="advisor-chart-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีนิสิตกลุ่มนี้" /></div>
    }
    const allCount = rows.reduce((sum, row) => sum + series.reduce((count, item) => count + (row.counts[item.key] ?? 0), 0), 0)
    const data: StackDatum[] = rows.flatMap((row) => {
        const total = percentBase === 'all' ? allCount : series.reduce((sum, item) => sum + (row.counts[item.key] ?? 0), 0)
        return series.map((item) => ({ category: row.category, series: item.label, count: row.counts[item.key] ?? 0, percent: total > 0 ? (row.counts[item.key] ?? 0) / total * 100 : 0 }))
    })
    const config: ColumnConfig = {
        data, xField: 'category', yField: mode === 'percent' ? 'percent' : 'count', colorField: 'series', stack: true,
        height: 270, autoFit: true,
        scale: { color: { domain: series.map((item) => item.label), range: series.map((item) => item.color) }, ...(mode === 'percent' ? { y: { domain: [0, 100] } } : { y: { tickMinStep: 1 } }) },
        legend: false,
        axis: { x: { title: false }, y: { title: mode === 'percent' ? 'ร้อยละ (%)' : 'จำนวน (คน)', labelFormatter: mode === 'percent' ? (value: string) => `${value}%` : undefined } },
        style: { maxWidth: 44 },
        tooltip: { items: [(datum: StackDatum) => ({ name: datum.series, value: `${number(datum.count)} คน (${datum.percent.toFixed(1)}%)` })] },
    }
    const renderChart = (large: boolean) => (
        <div className="advisor-chart">
            <div className="advisor-chart-toolbar">
                <div className="advisor-legend">{series.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}</div>
                <Space size={8}>
                    <Segmented size="small" aria-label={`หน่วยแสดงกราฟ ${title}`} value={mode} onChange={setMode} options={[{ label: 'คน', value: 'count' }, { label: '%', value: 'percent' }]} />
                    {!large && <ExpandChartButton title={title} onClick={() => setExpanded(true)} />}
                </Space>
            </div>
            {mode === 'percent' && <p className="advisor-chart-unit">{percentBase === 'all' ? 'ร้อยละของนิสิตทั้งหมดที่ระบุชั้นปี' : 'ร้อยละของนิสิตในแต่ละรุ่น'}</p>}
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
    return <StackChart title={title} rows={populated.map((row) => ({ category: cohortLabel(row.entry_year), counts: pick(row) }))}
        note="GPAX 0.00 อาจเกิดจากยังไม่ได้นำเข้าเกรด ควรตรวจสอบข้อมูลก่อนตีความช่วงผลการเรียน"
        series={[...gpaxRanges.map((range) => ({ key: range.key, label: range.label, color: range.color })), ...(populated.some((row) => pick(row).no_gpax > 0) ? [noGpaxSeries] : [])]} />
}

function PendingPanel({ title, block, children }: { title: string; block: AdvisorSummaryBlock; children: ReactNode }) {
    return <div className="advisor-pending"><span className="advisor-pending-icon"><ClockCircleOutlined /></span>
        <div><h3>{title}</h3><Tag>{block.available ? 'รอแสดงผล' : 'ข้อมูลยังไม่พร้อม'}</Tag><p>{children}</p></div>
    </div>
}

function HistoricalSections({ summary }: { summary: AdvisorSummary }) {
    const [detail, setDetail] = useState<{ title: string; students: AdvisorHistoryStudent[]; gradeContext: 'annual' | 'term' } | null>(null)
    const [offPlanTerm, setOffPlanTerm] = useState<AdvisorAcademicTerm | null>(null)
    const [latestOffPlanOpen, setLatestOffPlanOpen] = useState(false)
    const [year, setYear] = useState<number | 'all'>('all')
    const terms = summary.academic_terms.filter((term) => year === 'all' || term.academic_year === year)
    const years = [...new Set(summary.academic_terms.map((term) => term.academic_year))]
    const latest = latestTermOf(summary)
    // "รอข้อมูล" only appears when some student cannot be compared with a study plan.
    const showUnknown = summary.plan_status.unknown > 0 || terms.some((term) => term.unknown > 0)
    const termColumns: ColumnsType<AdvisorAcademicTerm> = [
        { title: 'ปีการศึกษา', dataIndex: 'academic_year', render: (value: number) => value + 543 },
        { title: 'ภาคเรียน', dataIndex: 'semester_name' },
        { title: 'ตามแผน', dataIndex: 'on_plan', key: 'on_plan', align: 'right' },
        { title: 'ไม่ตามแผน', dataIndex: 'off_plan', key: 'off_plan', align: 'right',
            render: (_: number, term: AdvisorAcademicTerm) => term.off_plan === 0 ? 0 : <Tooltip title="ดูรายชื่อและวิชาที่ค้าง ณ ภาคนี้"><Button danger type="link" size="small" className="advisor-off-plan-count" aria-label={`ดูนิสิตไม่ตามแผน ${term.term_label} ${number(term.off_plan)} คน`} onClick={() => setOffPlanTerm(term)}>{number(term.off_plan)}</Button></Tooltip> },
        { title: 'พ้นสภาพ', dataIndex: 'retired', key: 'retired', align: 'right', render: (value: number) => value > 0 ? value : <Tooltip title="ยังไม่มีข้อมูลพ้นสภาพรายภาค"><span>—</span></Tooltip> },
        ...(showUnknown ? [{ title: 'รอข้อมูล', dataIndex: 'unknown', key: 'unknown', align: 'right' as const }] : []),
        { title: 'รายละเอียด', key: 'detail', align: 'center', render: (_, term) => <Button type="text" icon={<SearchOutlined />} aria-label={`ดูนิสิต ${term.term_label}`} onClick={() => setDetail({ title: term.term_label, students: term.students, gradeContext: 'term' })} /> },
    ]
    return <>
        <div className="advisor-history-heading"><h2>ผลการเรียนในแต่ละชั้นปี</h2><p>GPA เฉพาะชั้นปี คำนวณถ่วงน้ำหนักด้วยหน่วยกิตจากทุกภาคเรียนที่มีผลการเรียนในปีการศึกษานั้น รวมภาคฤดูร้อน</p></div>
        {summary.blocks.gpa_by_study_year.available ? <Row gutter={[20, 20]}>
            {summary.gpa_by_study_year.map((group) => <Col xs={24} lg={12} key={group.study_year}>
                <SectionCard title={`ช่วงเกรดนิสิตปีที่ ${group.study_year}`} description="เปรียบเทียบช่วง GPA ของแต่ละรุ่น" extra={<Button size="small" onClick={() => setDetail({ title: `GPA ชั้นปีที่ ${group.study_year}`, students: group.cohorts.flatMap((cohort) => cohort.students), gradeContext: 'annual' })}>ดูรายชื่อ</Button>}>
                    <StackChart title={`ช่วงเกรดนิสิตปีที่ ${group.study_year}`} rows={group.cohorts.map((cohort) => ({ category: cohortLabel(cohort.entry_year), counts: cohort.ranges }))} series={gpaxRanges.map((range) => ({ key: range.key, label: range.label, color: range.color }))} />
                </SectionCard>
            </Col>)}
        </Row> : <PendingPanel title="ช่วงเกรดนิสิตปีที่ 1–4" block={summary.blocks.gpa_by_study_year}>ต้องมีผลการเรียนรายวิชาที่ระบุปีและภาคการศึกษา จึงจะคำนวณ GPA ของแต่ละชั้นปีได้</PendingPanel>}
        <SectionCard title="สถานะตามแผนรายภาคเรียน" description="สถานะของนิสิต ณ สิ้นแต่ละภาคเรียน • ผลที่ผ่านภายหลังไม่เปลี่ยนตัวเลขย้อนหลัง" extra={<Select aria-label="กรองปีการศึกษาย้อนหลัง" value={year} onChange={setYear} style={{ minWidth: 150 }} options={[{ label: 'ทุกปีการศึกษา', value: 'all' as const }, ...years.map((value) => ({ label: String(value + 543), value }))]} />}>
            {summary.blocks.gpa_by_academic_term.available ? <>
                <StackChart title="สถานะตามแผนรายภาคเรียน" rows={terms.map((term) => ({ category: term.term_label, counts: { on_plan: term.on_plan, off_plan: term.off_plan, retired: term.retired, unknown: term.unknown } }))} series={planSeries} />
                <Table<AdvisorAcademicTerm> className="advisor-cohort-table" rowKey={(term) => `${term.academic_year}-${term.semester_order}`} dataSource={terms} columns={termColumns} size="middle" scroll={{ x: 1100 }} pagination={{ pageSize: 8, showSizeChanger: false }}
                    summary={() => <><Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2}><strong>สรุปสถานะล่าสุด</strong></Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right"><strong>{number(summary.plan_status.on_plan)}</strong></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">{summary.plan_status.off_plan === 0 ? <strong>0</strong> : <Tooltip title="ดูรายชื่อและวิชาที่ยังเหลือ"><Button danger type="link" size="small" className="advisor-off-plan-count" aria-label={`ดูสรุปนิสิตที่ยังไม่ตามแผน ${number(summary.plan_status.off_plan)} คน`} onClick={() => setLatestOffPlanOpen(true)}><strong>{number(summary.plan_status.off_plan)}</strong></Button></Tooltip>}</Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">—</Table.Summary.Cell>
                        {showUnknown && <Table.Summary.Cell index={5} align="right"><strong>{number(summary.plan_status.unknown)}</strong></Table.Summary.Cell>}
                        <Table.Summary.Cell index={showUnknown ? 6 : 5} />
                    </Table.Summary.Row></>} />
            </> : <PendingPanel title="สถานะนิสิตรายภาคเรียน" block={summary.blocks.gpa_by_academic_term}>ต้องมีเกรดหรือประวัติสถานะรายภาคเรียน จึงจะแสดงข้อมูลส่วนนี้ได้</PendingPanel>}
        </SectionCard>
        <AdvisorStudentModal key={`latest-off-plan-${latestOffPlanOpen}`} title="นิสิตที่ยังไม่ตามแผน · สรุปสถานะล่าสุด" students={latestOffPlanOpen ? summary.off_plan_students : null} showPending summaryLabel="นิสิตที่ยังไม่ตามแผน" pendingRule="แสดงเฉพาะวิชาหรือเงื่อนไขที่ยังเหลือตามข้อมูลล่าสุดของแต่ละคน วิชาที่แก้ผ่านแล้วไม่แสดง" latestTermById={latest.byId} dataThrough={latest.dataThrough} onClose={() => setLatestOffPlanOpen(false)} />
        <AdvisorStudentModal key={detail?.title ?? 'closed'} title={detail?.title ?? ''} students={detail?.students ?? null} gradeContext={detail?.gradeContext} onClose={() => setDetail(null)} />
        <AdvisorStudentModal key={`off-plan-term-${offPlanTerm?.academic_year}-${offPlanTerm?.semester_order}`} title={offPlanTerm ? `นิสิตไม่ตามแผน · ปีการศึกษา ${offPlanTerm.term_label}` : ''} students={offPlanTerm ? offPlanTerm.students.filter((student) => student.plan_status === 'off_plan') : null} gradeContext="term" showPending pendingTermLabel={offPlanTerm ? `ปีการศึกษา ${offPlanTerm.term_label}` : undefined} onClose={() => setOffPlanTerm(null)} />
    </>
}

function latestTermOf(summary: AdvisorSummary) {
    const byId: Record<number, string> = {}
    for (const term of summary.academic_terms) for (const student of term.students) byId[student.id] = term.term_label
    return { byId, dataThrough: summary.academic_terms.at(-1)?.term_label }
}

function CohortSection({ summary }: { summary: AdvisorSummary }) {
    const [detail, setDetail] = useState<AdvisorSummaryEntryYear | null>(null)
    const [offPlanCohort, setOffPlanCohort] = useState<AdvisorSummaryEntryYear | null>(null)
    const [entryYear, setEntryYear] = useState<number | 'all'>('all')
    const latest = latestTermOf(summary)
    const rows = summary.by_entry_year.filter((row) => entryYear === 'all' || row.entry_year === entryYear)
    const cohortStudentIds = new Set(offPlanCohort?.students.map((student) => student.id) ?? [])
    const offPlanStudents = offPlanCohort === null ? null : summary.off_plan_students.filter((student) => cohortStudentIds.has(student.id))
    const planAvailable = summary.blocks.plan_status.available
    const columns: ColumnsType<AdvisorSummaryEntryYear> = [
        { title: 'รุ่น', dataIndex: 'entry_year', fixed: 'left', width: 100, render: (year: number) => <strong>{cohortLabel(year)}</strong>, sorter: (a, b) => a.entry_year - b.entry_year },
        { title: 'ทั้งหมด', dataIndex: 'total', align: 'right', sorter: (a, b) => a.total - b.total },
        { title: 'กำลังศึกษา', dataIndex: 'studying', align: 'right' },
        { title: <Tooltip title={PLAN_RULE}>ตามแผน <InfoCircleOutlined /></Tooltip>, key: 'on_plan', align: 'right', render: (_, row) => planAvailable ? row.plan.on_plan : '—' },
        { title: 'ไม่ตามแผน', key: 'off_plan', align: 'right', render: (_, row) => !planAvailable ? '—' : row.plan.off_plan === 0 ? 0 : <Tooltip title="ดูรายชื่อและวิชาที่ยังค้างของรุ่นนี้"><Button danger type="link" size="small" className="advisor-off-plan-count" aria-label={`ดูนิสิตไม่ตามแผน${cohortLabel(row.entry_year)} ${number(row.plan.off_plan)} คน`} onClick={() => setOffPlanCohort(row)}>{number(row.plan.off_plan)}</Button></Tooltip> },
        { title: 'รอประเมินแผน', key: 'unknown', align: 'right', render: (_, row) => row.plan.unknown },
        { title: 'จบการศึกษา', dataIndex: 'graduated', align: 'right' },
        { title: 'พ้นสภาพ', dataIndex: 'retired', align: 'right' },
        { title: 'อื่น ๆ', dataIndex: 'other', align: 'right' },
        { title: '', key: 'detail', render: (_, row) => <Button size="small" type="text" icon={<SearchOutlined />} aria-label={`ดูนิสิต${cohortLabel(row.entry_year)}`} onClick={() => setDetail(row)} /> },
    ]
    const totals = rows.reduce((sum, row) => sum.map((value, index) => value + [row.total, row.studying, row.plan.on_plan, row.plan.off_plan, row.plan.unknown, row.graduated, row.retired, row.other][index]), Array<number>(8).fill(0))
    return <SectionCard title="นิสิตแยกตามรุ่น" description="ดูสัดส่วนสถานะและจำนวนจริงของแต่ละรุ่น • หน่วย: คน" extra={
        <Select aria-label="เลือกรุ่นนิสิต" value={entryYear} onChange={setEntryYear} options={[{ label: 'ทุกรุ่น', value: 'all' as const }, ...summary.by_entry_year.map((row) => ({ label: `${cohortLabel(row.entry_year)} · เข้าเรียน ${row.entry_year + 543}`, value: row.entry_year }))]} style={{ minWidth: 185 }} />
    }>
        <StackChart title={entryYear === 'all' ? 'นิสิตแยกตามรุ่น' : `นิสิต${cohortLabel(entryYear)}`} rows={rows.map((row) => ({ category: cohortLabel(row.entry_year), counts: { ...row.plan, graduated: row.graduated, retired: row.retired, other: row.other } }))} series={[...planSeries, { key: 'graduated', label: 'จบการศึกษา', color: '#4f91db' }, { key: 'other', label: 'สถานะอื่น', color: '#cbd5e1' }]} />
        <Table<AdvisorSummaryEntryYear> className="advisor-cohort-table" rowKey="entry_year" size="middle" columns={columns} dataSource={rows} pagination={false} scroll={{ x: 950 }}
            summary={() => <Table.Summary.Row><Table.Summary.Cell index={0}><strong>รวม</strong></Table.Summary.Cell>{totals.map((value, index) => <Table.Summary.Cell key={index} index={index + 1} align="right"><strong>{!planAvailable && (index === 2 || index === 3) ? '—' : number(value)}</strong></Table.Summary.Cell>)}</Table.Summary.Row>} />
        <p className="advisor-footnote">กดตัวเลข “ไม่ตามแผน” เพื่อดูรายชื่อและรายการค้างของรุ่นนั้น • ตามแผน/ไม่ตามแผนของรุ่นนับเฉพาะนิสิตที่ยังกำลังศึกษาในปัจจุบัน (รุ่นที่จบแล้วจึงเป็น 0) • รอประเมินแผน = ยังไม่มีข้อมูลสำหรับเทียบแผนการเรียน</p>
        <AdvisorStudentModal key={detail?.entry_year ?? 'closed'} title={detail ? cohortLabel(detail.entry_year) : ''} students={detail?.students ?? null} onClose={() => setDetail(null)} />
        <AdvisorStudentModal key={`off-plan-${offPlanCohort?.entry_year ?? 'closed'}`} title={offPlanCohort ? `นิสิตที่ยังไม่ตามแผน · ${cohortLabel(offPlanCohort.entry_year)} (เข้าเรียน ${offPlanCohort.entry_year + 543})` : ''} students={offPlanStudents} showPending latestTermById={latest.byId} dataThrough={latest.dataThrough} onClose={() => setOffPlanCohort(null)} />
    </SectionCard>
}

function SummaryContent({ summary }: { summary: AdvisorSummary }) {
    const [offPlanOpen, setOffPlanOpen] = useState(false)
    const { totals, studying_gpax: gpax, plan_status: plan } = summary
    const planAvailable = summary.blocks.plan_status.available
    const knownPlan = plan.on_plan + plan.off_plan
    const dataIssues = summary.data_quality.gpax_missing + summary.data_quality.gpax_zero
    const metrics = [
        { label: 'นิสิตทั้งหมด', value: totals.all, icon: <TeamOutlined />, tone: 'blue', detail: 'รวมทุกสถานะในความดูแล' },
        { label: 'กำลังศึกษา', value: totals.studying, icon: <BookOutlined />, tone: 'indigo', detail: `${percent(totals.studying, totals.all)}% ของนิสิตทั้งหมด` },
        { label: 'จบการศึกษา', value: totals.graduated, icon: <SafetyCertificateOutlined />, tone: 'green', detail: 'นิสิตที่เคยอยู่ในที่ปรึกษา' },
        { label: 'พ้นสภาพนิสิต', value: totals.retired, icon: <InfoCircleOutlined />, tone: 'rose', detail: `สถานะอื่น ๆ อีก ${number(totals.other)} คน` },
    ]
    if (totals.all === 0) return <Card><Empty description="ไม่พบนิสิตในที่ปรึกษา" /><div className="advisor-empty-action"><Link to="/students/advisor">ดูรายชื่อนิสิตในที่ปรึกษา <ArrowRightOutlined /></Link></div></Card>
    return <div className="advisor-content">
        <div className="advisor-metrics">{metrics.map((metric) => <Card key={metric.label} className={`advisor-metric advisor-tone-${metric.tone}`}>
            <div className="advisor-metric-top"><span>{metric.label}</span><span className="advisor-metric-icon">{metric.icon}</span></div>
            <div className="advisor-metric-value">{number(metric.value)}<span>คน</span></div><p>{metric.detail}</p>
        </Card>)}</div>
        {dataIssues > 0 && <div className="advisor-attention"><span className="advisor-attention-icon"><InfoCircleOutlined /></span>
            <div><strong>{dataIssues > 0 ? 'ตรวจสอบความครบถ้วนของผลการเรียนก่อนใช้ตัวเลขติดตามนิสิต' : 'ข้อมูลสำหรับติดตามนิสิตในที่ปรึกษา'}</strong>
                <p>{dataIssues > 0 ? `นิสิตที่กำลังศึกษาหรือจบการศึกษามี GPAX 0.00 จำนวน ${number(summary.data_quality.gpax_zero)} คน และไม่มีค่า GPAX ${number(summary.data_quality.gpax_missing)} คน ค่า 0.00 อาจเกิดจากยังไม่ได้นำเข้าเกรด จึงยังสรุปไม่ได้ว่าเป็นผลการเรียนต่ำจริง` : 'ใช้ช่วง GPAX ร่วมกับความก้าวหน้าตามแผนการเรียน เพื่อประกอบการให้คำปรึกษา'}</p>
            </div><Link to="/students/advisor">ดูรายชื่อ <ArrowRightOutlined /></Link>
        </div>}
        <Row gutter={[20, 20]}>
            <Col xs={24} xl={14}><SectionCard expandable title="ผลการเรียนของนิสิตปัจจุบัน" description={`ช่วง GPAX ของนิสิตที่กำลังศึกษา ${number(totals.studying)} คน`} extra={<Tag color="blue">GPAX</Tag>}>
                <div className="advisor-gpax-grid">{gpaxRanges.map((range) => <div key={range.key} className="advisor-gpax-item" style={{ '--range-color': range.color, '--range-text': range.text } as CSSProperties}>
                    <div className="advisor-range-label"><i />{range.label}</div><div className="advisor-range-value">{number(gpax[range.key])}<span>คน</span></div>
                    <Progress percent={percent(gpax[range.key], totals.studying)} showInfo={false} strokeColor={range.color} size="small" />
                    <span className="advisor-range-caption">{percent(gpax[range.key], totals.studying)}% ของนิสิตที่กำลังศึกษา</span>
                </div>)}</div><div className="advisor-card-note"><InfoCircleOutlined /> ไม่มีค่า GPAX {number(gpax.no_gpax)} คน (แยกจาก 4 ช่วงข้างต้น)</div>
            </SectionCard></Col>
            <Col xs={24} xl={10}><SectionCard expandable title="ความก้าวหน้าตามแผนการเรียน" description="ประเมินถึงภาคล่าสุดที่นำเข้าเกรด" extra={<Tooltip title={PLAN_RULE}><Button type="text" shape="circle" aria-label="เกณฑ์การประเมินแผนการเรียน" icon={<InfoCircleOutlined />} /></Tooltip>}>
                <div className="advisor-plan-summary"><PlanProgress available={planAvailable} value={percent(plan.on_plan, knownPlan)} />
                    <div><strong>{planAvailable ? `${number(knownPlan)} / ${number(totals.studying)} คน` : 'ยังประเมินแผนไม่ได้'}</strong><p>{planAvailable ? 'มีข้อมูลสำหรับประเมินแผนการเรียน' : 'ต้องมีข้อมูลเกรดเพื่อเทียบกับแผนการเรียน'}</p></div>
                </div>
                <div className="advisor-plan-rows">{[{ label: 'ตามแผนการเรียน', value: planAvailable ? plan.on_plan : null, color: '#64b396' }, { label: 'ยังไม่ตามแผน ตามผลการเรียนล่าสุด', value: planAvailable ? plan.off_plan : null, color: '#de7a80' }, { label: 'รอข้อมูลเพื่อประเมิน', value: plan.unknown, color: '#94a3b8' }].map((item) => <div key={item.label}><span><i style={{ background: item.color }} />{item.label}</span><strong>{item.value === null ? '—' : number(item.value)} <small>คน</small></strong></div>)}</div>
                <p className="advisor-footnote">ร้อยละคิดจากนิสิตที่ประเมินได้ {number(knownPlan)} คน</p>
                <Button className="advisor-off-plan-button" block icon={<SearchOutlined />} onClick={() => setOffPlanOpen(true)}>ดูนิสิตที่ยังไม่ตามแผน <span>{number(plan.off_plan)} คน</span><ArrowRightOutlined /></Button>
            </SectionCard></Col>
        </Row>
        <CohortSection summary={summary} />
        <Row gutter={[20, 20]}>
            <Col xs={24} xl={10}><SectionCard title="นิสิตปัจจุบันแยกตามชั้นปี" description="จำนวนนิสิตที่กำลังศึกษาในแต่ละชั้นปี">
                <StackChart title="นิสิตปัจจุบันแยกตามชั้นปี" percentBase="all" rows={summary.studying_by_study_year.map((row) => ({ category: `ปี ${row.study_year}`, counts: { studying: row.count } }))} series={[statusSeries[0]]} />
                <div className="advisor-year-counts">{summary.studying_by_study_year.map((row) => <span key={row.study_year}>ปี {row.study_year}<strong>{number(row.count)} คน</strong></span>)}</div>
                {totals.studying > summary.studying_by_study_year.reduce((sum, row) => sum + row.count, 0) && <p className="advisor-footnote">ไม่ระบุชั้นปี {number(totals.studying - summary.studying_by_study_year.reduce((sum, row) => sum + row.count, 0))} คน</p>}
            </SectionCard></Col>
            <Col xs={24} xl={14}><SectionCard title="ข้อมูลที่ใช้ติดตามผลย้อนหลัง" description="ความครบถ้วนของข้อมูลและหลักการอ่านกราฟ">
                <div className="advisor-coverage"><div><strong>{number(summary.history_coverage.with_grades)}</strong><span>คนที่มีประวัติเกรด</span></div><div><strong>{number(summary.history_coverage.without_grades)}</strong><span>คนที่ยังไม่มีประวัติเกรด</span></div></div>
                <p className="advisor-footnote">กราฟปีที่ 1–4 ใช้ GPA ของปีนั้น รวมทุกภาคเรียนที่มีผลการเรียน รวมภาคฤดูร้อน โดยไม่นำวิชาที่ไม่คิด GPA มาคำนวณ</p>
                <p className="advisor-footnote">สถานะตามแผนย้อนหลังคำนวณจากวิชาที่ถึงกำหนดและเกรดที่มีถึงภาคนั้น ส่วนพ้นสภาพต้องมีบันทึกสถานะรายภาค</p>            </SectionCard></Col>
        </Row>
        <HistoricalSections summary={summary} />
        <Row gutter={[20, 20]}>
            <Col xs={24} xl={12}><SectionCard title="GPAX ของนิสิตปัจจุบันแยกตามรุ่น" description="นิสิตที่กำลังศึกษา • เปรียบเทียบจำนวนหรือร้อยละได้"><GpaxChart title="GPAX ของนิสิตปัจจุบันแยกตามรุ่น" rows={summary.by_entry_year} pick={(row) => row.gpax} /></SectionCard></Col>
            <Col xs={24} xl={12}><SectionCard title="GPAX ของนิสิตที่จบการศึกษา" description={`นิสิตจบการศึกษา ${number(totals.graduated)} คน • แยกตามรุ่น`}><GpaxChart title="GPAX ของนิสิตที่จบการศึกษา" rows={summary.by_entry_year} pick={(row) => row.graduated_gpax} /></SectionCard></Col>
        </Row>
        <div className="advisor-bottom-note"><CheckCircleOutlined /> สรุปจากข้อมูลที่มีในระบบ • “ไม่มีข้อมูล” แสดงแยกจากจำนวนศูนย์ • การเรียนตามแผนใช้เกณฑ์รายวิชาที่ถึงกำหนด</div>
        <AdvisorStudentModal key={offPlanOpen ? 'off-plan-open' : 'off-plan-closed'} title="นิสิตที่ยังเรียนไม่ตามแผน" students={offPlanOpen ? summary.off_plan_students : null} showPending latestTermById={latestTermOf(summary).byId} dataThrough={latestTermOf(summary).dataThrough} onClose={() => setOffPlanOpen(false)} />
    </div>
}

export default function AdvisorDashboardPage() {
    const { summary, loading, loadError, load } = useAdvisorSummary()
    return <div className="student-page advisor-dashboard">
        <div className="advisor-hero"><div><span className="advisor-eyebrow"><TeamOutlined /> สำหรับอาจารย์ที่ปรึกษา</span><h1>ภาพรวมนิสิตในที่ปรึกษา</h1>
            {summary?.teacher_full_name && <div className="advisor-teacher"><span />{summary.teacher_full_name}</div>}</div>
            <Space wrap><Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load()}>รีเฟรชข้อมูล</Button><Link className="advisor-primary-link" to="/students/advisor">รายชื่อนิสิต <ArrowRightOutlined /></Link></Space>
        </div>
        {loadError && <Alert className="advisor-load-error" type="error" showIcon title={loadError} action={<Button size="small" onClick={() => void load()}>ลองใหม่</Button>} />}
        {loading ? <div className="advisor-loading" aria-label="กำลังโหลดภาพรวมนิสิต"><Skeleton active paragraph={{ rows: 8 }} /></div> : summary ? <SummaryContent summary={summary} /> : !loadError && <Card><Empty description="ไม่มีข้อมูล" /></Card>}
    </div>
}
