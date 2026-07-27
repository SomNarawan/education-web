import { SearchOutlined } from '@ant-design/icons'
import type { DualAxesConfig } from '@ant-design/plots'
import {
    Button,
    Card,
    Modal,
    Progress,
    Spin,
    Table,
    Typography,
    message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
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
    gpa: number
}

interface SemesterCreditStatusRecord {
    type: string
    credits_study: number
    credits_all: number
    gpa: number
}

type SemesterPerformanceModule = {
    default: StudentSemesterPerformance[]
}

type SemesterCreditStatusModule = {
    default: SemesterCreditStatusRecord[]
}

const semesterPerformanceRows = import.meta.glob<SemesterPerformanceModule>(
    '../data/graph/by_semester/*.json',
)

const semesterCreditStatusRows = import.meta.glob<SemesterCreditStatusModule>(
    '../data/graph/by_credit/*.json',
)

const creditStatusLabels: Record<string, string> = {
    credit_study: 'หน่วยกิตที่เรียน',
    credit_over: 'หน่วยกิตที่เรียนเกิน',
}

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
    gpax: '#4b5563',
    grid: '#d9dce3',
    axis: '#8c8c8c',
    text: '#262626',
}

const gradeRanges = [
    'เกรด(0-1.74)',
    'เกรด(1.75-1.99)',
    'เกรด(2.0-3.24)',
    'เกรด(3.25-4.00)',
]

const gradeRangeColors = [
    chartColors.danger,
    chartColors.warning,
    chartColors.success,
    chartColors.excellent,
]

function getGradeRange(gpa: number) {
    if (gpa >= 3.25) {
        return gradeRanges[3]
    }

    if (gpa >= 2) {
        return gradeRanges[2]
    }

    if (gpa >= 1.75) {
        return gradeRanges[1]
    }

    return gradeRanges[0]
}

const DualAxes = lazy(() =>
    import('@ant-design/plots').then((chartModule) => ({
        default: chartModule.DualAxes,
    })),
)

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

function buildCreditStatuses(
    rows: SemesterCreditStatusRecord[],
): SemesterCreditStatus[] {
    return rows.map((row) => ({
        label: creditStatusLabels[row.type] ?? row.type,
        value: row.credits_study,
        total: row.credits_all,
        gpa: row.gpa,
    }))
}

function StudentSemesterChart({
    creditStatuses,
    rows,
}: {
    creditStatuses: SemesterCreditStatus[]
    rows: StudentSemesterPerformanceRow[]
}) {
    const chartData = rows.map((row) => ({
        semesterLabel: `ชั้นปี ${row.study_year} ${row.semester}`,
        gpa: row.gpa,
        gpax: row.gpax,
        gradeRange: getGradeRange(row.gpa),
    }))
    const chartConfig: DualAxesConfig = {
        data: chartData,
        height: 440,
        autoFit: true,
        transpose: true,
        xField: 'semesterLabel',
        scale: {
            y: {
                domain: [0, 4],
                tickCount: 9,
                nice: false,
            },
            color: {
                domain: gradeRanges,
                range: gradeRangeColors,
            },
        },
        axis: {
            x: {
                title: false,
                line: true,
                lineStroke: chartColors.axis,
                lineStrokeOpacity: 1,
                tick: true,
                tickStroke: chartColors.axis,
                tickStrokeOpacity: 1,
                labelFontSize: 11,
                labelFill: chartColors.text,
                labelFillOpacity: 1,
                labelFontWeight: 400,
                labelAutoHide: false,
                labelAutoRotate: {
                    optionalAngles: [0, 25, 45],
                    recoverWhenFailed: true,
                },
            },
            y: {
                title: false,
                line: true,
                lineStroke: chartColors.axis,
                lineStrokeOpacity: 1,
                tick: true,
                tickStroke: chartColors.axis,
                tickStrokeOpacity: 1,
                tickCount: 9,
                grid: true,
                gridStroke: chartColors.grid,
                labelFontSize: 11,
                labelFill: chartColors.text,
                labelFillOpacity: 1,
                labelFontWeight: 400,
                labelFormatter: (value: string) => {
                    const numericValue = Number(value)

                    return numericValue === 0
                        ? '0'
                        : numericValue.toFixed(1)
                },
            },
        },
        legend: false,
        interaction: {
            tooltip: {
                shared: false,
                series: false,
                mount: 'body',
                css: {
                    '.g2-tooltip': {
                        'z-index': 1000,
                    },
                },
            },
        },
        children: [
            {
                type: 'interval',
                yField: 'gpa',
                colorField: 'gradeRange',
                scale: {
                    y: {
                        domain: [0, 4],
                        key: 'semesterGradeScale',
                        independent: false,
                    },
                },
                style: {
                    fillOpacity: 0.68,
                },
                tooltip: {
                    title: 'semesterLabel',
                    items: [
                        {
                            field: 'gpa',
                            name: 'GPA',
                            valueFormatter: (value: number) =>
                                formatDecimal(value),
                        },
                    ],
                },
            },
            {
                type: 'line',
                yField: 'gpax',
                scale: {
                    y: {
                        domain: [0, 4],
                        key: 'semesterGradeScale',
                        independent: false,
                    },
                },
                style: {
                    stroke: chartColors.gpax,
                    lineWidth: 3,
                },
                tooltip: false,
            },
            {
                type: 'point',
                yField: 'gpax',
                scale: {
                    y: {
                        domain: [0, 4],
                        key: 'semesterGradeScale',
                        independent: false,
                    },
                },
                style: {
                    fill: '#ffffff',
                    stroke: chartColors.gpax,
                    lineWidth: 2,
                    r: 4,
                },
                tooltip: {
                    title: 'semesterLabel',
                    items: [
                        {
                            field: 'gpax',
                            name: 'GPAX',
                            valueFormatter: (value: number) =>
                                formatDecimal(value),
                        },
                    ],
                },
            },
        ],
    }

    return (
        <div className="semester-chart-panel">
            <div className="semester-chart-scroll">
                <div className="grade-chart-legend">
                    {gradeRanges.map((gradeRange, index) => (
                        <span
                            className="grade-legend-item"
                            key={gradeRange}
                            style={{ color: gradeRangeColors[index] }}
                        >
                            <span
                                className="grade-legend-dot"
                                style={{
                                    background: gradeRangeColors[index],
                                }}
                            />
                            {gradeRange}
                        </span>
                    ))}
                    <span
                        className="grade-legend-item"
                        style={{ color: chartColors.gpax }}
                    >
                        <span className="grade-legend-line" />
                        GPAX
                    </span>
                </div>

                <div
                    className="semester-performance-chart"
                    role="img"
                    aria-label="กราฟแท่ง GPA และเส้น GPAX รายภาคการศึกษา"
                >
                    <Suspense
                        fallback={
                            <div className="chart-loading">
                                <Spin />
                            </div>
                        }
                    >
                        <DualAxes
                            key={'semester-performance-tooltip-v3'}
                            {...chartConfig}
                        />
                    </Suspense>
                </div>
            </div>

            <div className="semester-credit-status-list" aria-label="สรุปหน่วยกิต">
                {creditStatuses.map((status) => {
                    const percent = getStatusPercent(status.value, status.total)
                    const statusColor = getGradeColor(status.gpa)

                    return (
                        <div className="semester-credit-status" key={status.label}>
                            <div className="semester-credit-status-header">
                                <span>{status.label}</span>
                                <strong>{status.value}</strong>
                            </div>
                            <Progress
                                percent={Number(percent.toFixed(2))}
                                showInfo={false}
                                strokeColor={statusColor}
                                railColor="#eef2f7"
                                size={['100%', 14]}
                                aria-label={`${status.label} ${status.value} จาก ${status.total} หน่วยกิต`}
                            />
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
    const [creditStatuses, setCreditStatuses] = useState<SemesterCreditStatus[]>(
        [],
    )
    const [rows, setRows] = useState<StudentSemesterPerformanceRow[]>([])
    const [loading, setLoading] = useState(false)
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
                const creditStatusImporter =
                    semesterCreditStatusRows[
                        `../data/graph/by_credit/${studentCode}.json`
                    ]

                if (!importer) {
                    setCreditStatuses([])
                    setRows([])
                    return
                }

                const [module, creditStatusModule] = await Promise.all([
                    importer(),
                    creditStatusImporter?.() ?? Promise.resolve({ default: [] }),
                ])
                const records = Array.isArray(module.default)
                    ? module.default
                    : []
                const creditStatusRecords = Array.isArray(
                    creditStatusModule.default,
                )
                    ? creditStatusModule.default
                    : []
                setCreditStatuses(buildCreditStatuses(creditStatusRecords))
                setRows(buildRows(records))
            } catch (error) {
                console.error(error)
                message.error('โหลดรายงานผลการเรียนไม่สำเร็จ')
                setCreditStatuses([])
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
        >
            <div className="performance-chart-table-layout">
                <StudentSemesterChart
                    creditStatuses={creditStatuses}
                    rows={rows}
                />
                <section
                    className="performance-table-panel"
                    aria-label="ตารางผลการเรียนแต่ละภาคการศึกษา"
                >
                    <Table<StudentSemesterPerformanceRow>
                        className="semester-performance-table"
                        rowKey="key"
                        columns={columns}
                        dataSource={rows}
                        pagination={false}
                        size="small"
                        tableLayout="fixed"
                    />
                </section>
            </div>

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
