import { SearchOutlined, TableOutlined } from '@ant-design/icons'
import { Button, Card, Modal, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type {
    StudentSemesterEnrollment,
    StudentSemesterPerformance,
    StudentSemesterPerformanceRow,
} from '../types/StudentSemesterPerformance'

interface StudentSemesterPerformanceSectionProps {
    studentCode: string
}

interface SemesterCreditStatus {
    label: string
    value: number
    total: number
    color: string
}

type SemesterPerformanceModule = {
    default: StudentSemesterPerformance[]
}

const semesterPerformanceRows = import.meta.glob<SemesterPerformanceModule>(
    '../data/graph/by_semester/*.json',
)

const creditStatusMocks: SemesterCreditStatus[] = [
    {
        label: 'หน่วยกิตที่เรียน',
        value: 124,
        total: 132,
        color: '#1677ff',
    },
    {
        label: 'หน่วยกิตที่เรียนเกิน',
        value: 12,
        total: 30,
        color: '#ff8a34',
    },
]

const semesterOrder: Record<string, number> = {
    ภาคฤดูร้อน: 0,
    ภาคต้น: 1,
    ภาคปลาย: 2,
}

const chartColors = {
    danger: '#ff5b5b',
    warning: '#ff8a34',
    success: '#8bcf8b',
    excellent: '#8bd2f2',
    gpax: '#000000',
    grid: '#d9dce3',
    axis: '#8c8c8c',
    text: '#666666',
}

const semesterChartCapacity = 16
const semesterChartStepWidth = 72
const semesterChartHorizontalSpace = 92

function getGradeColor(gpa: number) {
    if (gpa >= 3.25) {
        return chartColors.excellent
    }

    if (gpa >= 2) {
        return chartColors.success
    }

    if (gpa >= 1.75) {
        return chartColors.warning
    }

    return chartColors.danger
}

function formatDecimal(value: number) {
    return value.toFixed(2)
}

function formatDiff(value: string | number) {
    const numericValue = Number(value)

    if (Number.isNaN(numericValue)) {
        return String(value)
    }

    if (numericValue > 0) {
        return `+${formatDecimal(numericValue)}`
    }

    return formatDecimal(numericValue)
}

function getDiffColor(value: string | number) {
    const numericValue = Number(value)

    return !Number.isNaN(numericValue) && numericValue < 0
        ? '#ff0000'
        : '#008000'
}

function getStatusPercent(value: number, total: number) {
    if (total <= 0) {
        return 0
    }

    return Math.min((value / total) * 100, 100)
}

function buildRows(
    rows: StudentSemesterPerformance[],
): StudentSemesterPerformanceRow[] {
    return [...rows]
        .sort((a, b) => {
            if (a.semester_year_be !== b.semester_year_be) {
                return a.semester_year_be - b.semester_year_be
            }

            return (
                (semesterOrder[a.semester] ?? 99) -
                (semesterOrder[b.semester] ?? 99)
            )
        })
        .map((row, index) => ({
            ...row,
            key: `${row.semester_year_be}-${row.semester}-${index}`,
        }))
}

function StudentSemesterChart({
    rows,
}: {
    rows: StudentSemesterPerformanceRow[]
}) {
    const chartCapacity = Math.max(semesterChartCapacity, rows.length)
    const chartWidth =
        chartCapacity * semesterChartStepWidth +
        semesterChartHorizontalSpace
    const chartHeight = 440
    const margin = {
        top: 22,
        right: 24,
        bottom: 92,
        left: 42,
    }
    const innerWidth = chartWidth - margin.left - margin.right
    const innerHeight = chartHeight - margin.top - margin.bottom
    const stepWidth = innerWidth / Math.max(rows.length, 1)
    const barWidth = Math.min(46, stepWidth * 0.55)
    const yTicks = Array.from({ length: 9 }, (_, index) => index * 0.5)
    const getY = (value: number) =>
        margin.top + innerHeight - (Math.min(value, 4) / 4) * innerHeight
    const gpaxPoints = rows.map((row, index) => {
        const x = margin.left + stepWidth * index + stepWidth / 2
        const y = getY(row.gpax)

        return { x, y }
    })
    const gpaxLine = gpaxPoints
        .map((point) => `${point.x},${point.y}`)
        .join(' ')

    return (
        <div className="semester-chart-panel">
            <div className="semester-chart-scroll">
                <div className="grade-chart-legend">
                <span className="grade-legend-item">
                    <span
                        className="grade-legend-dot"
                        style={{ background: chartColors.danger }}
                    />
                    เกรด(0-1.74)
                </span>
                <span className="grade-legend-item">
                    <span
                        className="grade-legend-dot"
                        style={{ background: chartColors.warning }}
                    />
                    เกรด(1.75-1.99)
                </span>
                <span className="grade-legend-item">
                    <span
                        className="grade-legend-dot"
                        style={{ background: chartColors.success }}
                    />
                    เกรด(2.0-3.24)
                </span>
                <span className="grade-legend-item">
                    <span
                        className="grade-legend-dot"
                        style={{ background: chartColors.excellent }}
                    />
                    เกรด(3.25-4.00) ~ GPAX
                </span>
            </div>

            <svg
                className="semester-performance-chart"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label="กราฟแท่ง GPA และเส้น GPAX รายภาคการศึกษา"
            >
                {yTicks.map((tick) => {
                    const y = getY(tick)

                    return (
                        <g key={tick}>
                            <line
                                x1={margin.left}
                                x2={chartWidth - margin.right}
                                y1={y}
                                y2={y}
                                stroke={chartColors.grid}
                                strokeWidth="1"
                            />
                            <text
                                x={margin.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                fill={chartColors.text}
                                fontSize="12"
                            >
                                {tick === 0 ? '0' : tick.toFixed(1)}
                            </text>
                        </g>
                    )
                })}

                <line
                    x1={margin.left}
                    x2={margin.left}
                    y1={margin.top}
                    y2={margin.top + innerHeight}
                    stroke={chartColors.axis}
                />
                <line
                    x1={margin.left}
                    x2={chartWidth - margin.right}
                    y1={margin.top + innerHeight}
                    y2={margin.top + innerHeight}
                    stroke={chartColors.axis}
                />

                {rows.map((row, index) => {
                    const x =
                        margin.left + stepWidth * index + (stepWidth - barWidth) / 2
                    const y = getY(row.gpa)
                    const barHeight = margin.top + innerHeight - y

                    return (
                        <g key={row.key}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={getGradeColor(row.gpa)}
                                opacity="0.68"
                            />
                            <text
                                x={margin.left + stepWidth * index + stepWidth / 2}
                                y={margin.top + innerHeight + 28}
                                fill={chartColors.text}
                                fontSize="12"
                                textAnchor="end"
                                transform={`rotate(-25 ${
                                    margin.left + stepWidth * index + stepWidth / 2
                                } ${margin.top + innerHeight + 28})`}
                            >
                                {`ชั้นปี ${row.study_year} ${row.semester}`}
                            </text>
                        </g>
                    )
                })}

                {gpaxLine && (
                    <polyline
                        points={gpaxLine}
                        fill="none"
                        stroke={chartColors.gpax}
                        strokeWidth="3"
                    />
                )}

                {gpaxPoints.map((point, index) => (
                    <circle
                        key={rows[index].key}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="none"
                        stroke={chartColors.gpax}
                        strokeWidth="2"
                    />
                ))}
                </svg>
            </div>

            <div className="semester-credit-status-list" aria-label="สรุปหน่วยกิต">
                {creditStatusMocks.map((status) => {
                    const percent = getStatusPercent(status.value, status.total)

                    return (
                        <div className="semester-credit-status" key={status.label}>
                            <div className="semester-credit-status-header">
                                <span>{status.label}</span>
                                <strong>{status.value}</strong>
                            </div>
                            <div className="semester-credit-status-track">
                                <div
                                    className="semester-credit-status-fill"
                                    style={{
                                        width: `${percent}%`,
                                        background: status.color,
                                    }}
                                />
                            </div>
                            <div className="semester-credit-status-caption">
                                {status.value}/{status.total} หน่วยกิต
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function StudentSemesterPerformanceSection({
    studentCode,
}: StudentSemesterPerformanceSectionProps) {
    const [rows, setRows] = useState<StudentSemesterPerformanceRow[]>([])
    const [loading, setLoading] = useState(false)
    const [tableOpen, setTableOpen] = useState(false)
    const [detailRecord, setDetailRecord] =
        useState<StudentSemesterPerformanceRow | null>(null)

    useEffect(() => {
        const loadRows = async () => {
            try {
                setLoading(true)
                const importer =
                    semesterPerformanceRows[
                        `../data/graph/by_semester/${studentCode}.json`
                    ]

                if (!importer) {
                    setRows([])
                    return
                }

                const module = await importer()
                const records = Array.isArray(module.default)
                    ? module.default
                    : []
                setRows(buildRows(records))
            } catch (error) {
                console.error(error)
                message.error('โหลดรายงานผลการเรียนไม่สำเร็จ')
                setRows([])
            } finally {
                setLoading(false)
            }
        }

        loadRows()
    }, [studentCode])

    const columns = useMemo<ColumnsType<StudentSemesterPerformanceRow>>(
        () => [
            {
                title: 'ชั้นปี',
                dataIndex: 'study_year',
                key: 'study_year',
                render: (value: number) => `ชั้นปี ${value}`,
            },
            {
                title: 'ภาคการศึกษา',
                dataIndex: 'semester',
                key: 'semester',
                align: 'center',
            },
            {
                title: 'หน่วยกิต',
                dataIndex: 'credits',
                key: 'credits',
                align: 'center',
            },
            {
                title: 'GPA',
                dataIndex: 'gpa',
                key: 'gpa',
                align: 'center',
                render: (value: number) => formatDecimal(value),
            },
            {
                title: 'GPAX',
                dataIndex: 'gpax',
                key: 'gpax',
                align: 'center',
                render: (value: number) => formatDecimal(value),
            },
            {
                title: '+-GPAX',
                dataIndex: 'diff_gpax',
                key: 'diff_gpax',
                align: 'center',
                render: (value: string | number) => (
                    <span style={{ color: getDiffColor(value) }}>
                        {formatDiff(value)}
                    </span>
                ),
            },
            {
                title: 'รายละเอียด',
                key: 'detail',
                align: 'center',
                render: (_, record) => (
                    <Button
                        type="text"
                        icon={<SearchOutlined />}
                        aria-label={`ดูรายละเอียดผลการเรียน ${record.semester} ${record.semester_year_be}`}
                        onClick={() => setDetailRecord(record)}
                    />
                ),
            },
        ],
        [],
    )

    const detailColumns = useMemo<ColumnsType<StudentSemesterEnrollment>>(
        () => [
            {
                title: 'GPA',
                dataIndex: 'grade_letter',
                key: 'grade_letter',
                width: 100,
                render: (value: string | null) => value || '-',
            },
            {
                title: 'จำนวนหน่วยกิต',
                dataIndex: 'credit',
                key: 'credit',
                width: 180,
            },
            {
                title: 'รายชื่อวิชา',
                dataIndex: 'course_name',
                key: 'course_name',
            },
        ],
        [],
    )

    return (
        <Card
            title="รายงานผลการเรียนแต่ละภาคการศึกษา"
            size="small"
            loading={loading}
            extra={
                <Button
                    type="primary"
                    icon={<TableOutlined />}
                    onClick={() => setTableOpen(true)}
                >
                    ดูตาราง
                </Button>
            }
        >
            <StudentSemesterChart rows={rows} />

            <Modal
                title="ตารางผลการเรียนแต่ละภาคการศึกษา"
                open={tableOpen}
                width={1100}
                footer={null}
                destroyOnHidden
                onCancel={() => setTableOpen(false)}
            >
                <Table<StudentSemesterPerformanceRow>
                    className="semester-performance-table"
                    rowKey="key"
                    columns={columns}
                    dataSource={rows}
                    pagination={false}
                    scroll={{ x: 840 }}
                />
            </Modal>

            <Modal
                open={detailRecord !== null}
                width={860}
                footer={null}
                destroyOnHidden
                onCancel={() => setDetailRecord(null)}
            >
                {detailRecord && (
                    <>
                        <div className="semester-detail-summary">
                            <Typography.Text strong>
                                GPA {formatDecimal(detailRecord.gpa)}
                            </Typography.Text>
                            <Typography.Text strong>
                                GPAX {formatDecimal(detailRecord.gpax)}
                            </Typography.Text>
                            <Typography.Text
                                strong
                                style={{
                                    color: getDiffColor(detailRecord.diff_gpax),
                                }}
                            >
                                +-GPAX {formatDiff(detailRecord.diff_gpax)}
                            </Typography.Text>
                        </div>
                        <Typography.Title level={3}>
                            ผลการเรียนของนิสิตชั้นปี {detailRecord.study_year}{' '}
                            {detailRecord.semester} พ.ศ. {detailRecord.semester_year_be}
                        </Typography.Title>
                        <Table<StudentSemesterEnrollment>
                            className="semester-detail-table"
                            rowKey={(record, index) =>
                                `${record.course_name}-${index ?? 0}`
                            }
                            columns={detailColumns}
                            dataSource={detailRecord.enrollments}
                            pagination={false}
                        />
                    </>
                )}
            </Modal>
        </Card>
    )
}
