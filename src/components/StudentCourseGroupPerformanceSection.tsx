import type { ColumnConfig, PieConfig } from '@ant-design/plots'
import { Card, Empty, Popover, Spin, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import type {
    StudentCourseGroupPerformance,
    StudentCourseGroupPerformanceRow,
} from '../types/StudentCourseGroupPerformance'

interface StudentCourseGroupPerformanceSectionProps {
    studentCode: string
}

interface CourseGroupDataset {
    id: string
    rows: StudentCourseGroupPerformanceRow[]
}

type CourseGroupPerformanceModule = {
    default: StudentCourseGroupPerformance[]
}

const courseGroupPerformanceModules =
    import.meta.glob<CourseGroupPerformanceModule>(
        '../data/graph/by_group/*.json',
    )

const chartColors = {
    danger: '#ff5b5b',
    warning: '#ff8a34',
    success: '#8bcf8b',
    excellent: '#8bd2f2',
    grid: '#d9dce3',
    axis: '#8c8c8c',
    text: '#262626',
}

const Column = lazy(() =>
    import('@ant-design/plots').then((chartModule) => ({
        default: chartModule.Column,
    })),
)

const Pie = lazy(() =>
    import('@ant-design/plots').then((chartModule) => ({
        default: chartModule.Pie,
    })),
)

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

function getDatasetOrder(path: string) {
    const match = path.match(/_(\d+)\.json$/)

    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER
}

function wrapAxisLabel(label: string, maxCharactersPerLine = 20) {
    const characters = Array.from(label.trim())
    const lines: string[] = []

    for (
        let startIndex = 0;
        startIndex < characters.length;
        startIndex += maxCharactersPerLine
    ) {
        lines.push(
            characters
                .slice(startIndex, startIndex + maxCharactersPerLine)
                .join(''),
        )
    }

    return lines.length > 0 ? lines : ['']
}

function CourseGroupChart({
    rows,
}: {
    rows: StudentCourseGroupPerformanceRow[]
}) {
    const chartData = rows.map((row) => ({
        courseGroup: row.course_group,
        gpa: row.gpa,
        gradeRange: getGradeRange(row.gpa),
    }))
    const chartConfig: ColumnConfig = {
        data: chartData,
        height: 460,
        autoFit: true,
        transpose: true,
        xField: 'courseGroup',
        yField: 'gpa',
        colorField: 'gradeRange',
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
            x: {
                padding: 0.28,
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
                size: 120,
                labelFontSize: 11,
                labelFill: chartColors.text,
                labelFillOpacity: 1,
                labelFontWeight: 400,
                labelAutoHide: false,
                labelFormatter: (label: string) =>
                    wrapAxisLabel(label).join('\n'),
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
        style: {
            fillOpacity: 0.78,
        },
        tooltip: {
            items: [
                {
                    field: 'gpa',
                    name: 'เกรดเฉลี่ย',
                    valueFormatter: (value: number) => value.toFixed(2),
                },
            ],
        },
    }

    return (
        <div className="course-group-chart-scroll">
            <div className="grade-chart-legend">
                {gradeRanges.map((gradeRange, index) => (
                    <span
                        className="grade-legend-item"
                        key={gradeRange}
                        style={{ color: gradeRangeColors[index] }}
                    >
                        <span
                            className="grade-legend-dot"
                            style={{ background: gradeRangeColors[index] }}
                        />
                        {gradeRange}
                    </span>
                ))}
            </div>

            <div
                className="course-group-performance-chart"
                role="img"
                aria-label="กราฟเกรดเฉลี่ยแยกตามหมวดวิชา"
            >
                <Suspense
                    fallback={
                        <div className="chart-loading">
                            <Spin />
                        </div>
                    }
                >
                    <Column {...chartConfig} />
                </Suspense>
            </div>
        </div>
    )
}

function CourseGroupCreditCharts({
    rows,
}: {
    rows: StudentCourseGroupPerformanceRow[]
}) {
    return (
        <div
            className="course-group-credit-chart-section"
            aria-label="สรุปจำนวนหน่วยกิตแยกตามหมวดวิชา"
        >
            <div className="course-group-credit-chart-title">
                จำนวนหน่วยกิตการเรียน
            </div>
            <div
                className="course-group-credit-chart-grid"
                style={{
                    gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`,
                }}
            >
                {rows.map((row) => {
                    const totalCredits = Math.max(row.credits, 0)
                    const completedCredits = Math.min(
                        Math.max(row.completed_credits, 0),
                        totalCredits,
                    )
                    const percentage =
                        totalCredits > 0
                            ? (completedCredits / totalCredits) * 100
                            : 0
                    const gradeColor = getGradeColor(row.gpa)
                    const remainingCredits = Math.max(
                        totalCredits - completedCredits,
                        0,
                    )
                    const pieData = [
                        {
                            status: 'เรียนแล้ว',
                            chartCredits: completedCredits,
                            credits: completedCredits,
                        },
                        {
                            status: 'คงเหลือ',
                            chartCredits:
                                totalCredits > 0 ? remainingCredits : 1,
                            credits: remainingCredits,
                        },
                    ]
                    const pieConfig: PieConfig = {
                        data: pieData,
                        height: 150,
                        autoFit: true,
                        angleField: 'chartCredits',
                        colorField: 'status',
                        innerRadius: 0.58,
                        radius: 0.92,
                        scale: {
                            color: {
                                domain: ['เรียนแล้ว', 'คงเหลือ'],
                                range: [gradeColor, '#d9d9d9'],
                            },
                        },
                        legend: false,
                        label: false,
                        tooltip: {
                            items: [
                                {
                                    field: 'credits',
                                    name: 'หน่วยกิต',
                                    valueFormatter: (value: number) =>
                                        value.toString(),
                                },
                            ],
                        },
                    }

                    return (
                        <div
                            className="course-group-credit-chart-card"
                            key={`credit-${row.key}`}
                        >
                            <div className="course-group-credit-chart-label">
                                <span>หน่วยกิตการเรียน</span>
                                <strong>{row.course_group}</strong>
                            </div>
                            <Popover
                                trigger="click"
                                title={row.course_group}
                                content={
                                    <div className="course-group-credit-popover">
                                        <span>
                                            หน่วยกิตทั้งหมด{' '}
                                            <strong>{totalCredits}</strong>
                                        </span>
                                        <span>
                                            เรียนแล้ว{' '}
                                            <strong>{completedCredits}</strong>
                                        </span>
                                        <span>
                                            คงเหลือ{' '}
                                            <strong>
                                                {Math.max(
                                                    totalCredits -
                                                        completedCredits,
                                                    0,
                                                )}
                                            </strong>
                                        </span>
                                    </div>
                                }
                            >
                                <button
                                    className="course-group-credit-donut"
                                    type="button"
                                    aria-label={`${row.course_group} เรียนแล้ว ${completedCredits} จาก ${totalCredits} หน่วยกิต กดเพื่อดูรายละเอียด`}
                                >
                                    <Suspense fallback={null}>
                                        <Pie {...pieConfig} />
                                    </Suspense>
                                    <span className="course-group-credit-donut-center">
                                        <strong>
                                            {Number.isInteger(percentage)
                                                ? percentage.toFixed(0)
                                                : percentage.toFixed(2)}
                                            %
                                        </strong>
                                        <span>{row.gpa.toFixed(2)}</span>
                                    </span>
                                </button>
                            </Popover>
                            <div className="course-group-credit-chart-caption">
                                {completedCredits}/{totalCredits} หน่วยกิต
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function StudentCourseGroupPerformanceSection({
    studentCode,
}: StudentCourseGroupPerformanceSectionProps) {
    const [datasets, setDatasets] = useState<CourseGroupDataset[]>([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        const loadDatasets = async () => {
            try {
                setLoading(true)
                const prefix = `../data/graph/by_group/${studentCode}_`
                const matchingModules = Object.entries(
                    courseGroupPerformanceModules,
                )
                    .filter(([path]) => path.startsWith(prefix))
                    .sort(([firstPath], [secondPath]) => {
                        return (
                            getDatasetOrder(firstPath) -
                            getDatasetOrder(secondPath)
                        )
                    })

                const loadedDatasets = await Promise.all(
                    matchingModules.map(async ([path, importer]) => {
                        const module = await importer()
                        const records = Array.isArray(module.default)
                            ? module.default
                            : []

                        return {
                            id: path,
                            rows: records.map((record, index) => ({
                                ...record,
                                key: `${path}-${index}`,
                            })),
                        }
                    }),
                )

                setDatasets(loadedDatasets)
            } catch (error) {
                console.error(error)
                message.error('โหลดผลการเรียนแยกตามหมวดวิชาไม่สำเร็จ')
                setDatasets([])
            } finally {
                setLoading(false)
            }
        }

        loadDatasets()
    }, [studentCode])

    const columns = useMemo<
        ColumnsType<StudentCourseGroupPerformanceRow>
    >(
        () => [
            {
                title: 'หมวดวิชา',
                dataIndex: 'course_group',
                key: 'course_group',
            },
            {
                title: 'เกรดเฉลี่ย',
                dataIndex: 'gpa',
                key: 'gpa',
                align: 'center',
                render: (value: number) => value.toFixed(2),
            },
            {
                title: 'หน่วยกิตทั้งหมด',
                dataIndex: 'credits',
                key: 'credits',
                align: 'center',
            },
            {
                title: (
                    <>
                        จำนวนหน่วยกิตที่
                        <span className="course-group-completed-heading">
                            เรียนไปแล้ว
                        </span>
                    </>
                ),
                dataIndex: 'completed_credits',
                key: 'completed_credits',
                align: 'center',
                render: (value: number) => (
                    <span className="course-group-completed-value">{value}</span>
                ),
            },
            {
                title: (
                    <>
                        จำนวนหน่วยกิตที่
                        <span className="course-group-remaining-heading">
                            ยังไม่เรียน
                        </span>
                    </>
                ),
                dataIndex: 'remaining_credits',
                key: 'remaining_credits',
                align: 'center',
                render: (value: number) => (
                    <span className="course-group-remaining-value">{value}</span>
                ),
            },
        ],
        [],
    )
    if (datasets.length === 0) {
        return (
            <Card
                title="ผลการเรียนในแต่ละหมวดวิชา"
                size="small"
                loading={loading}
            >
                {!loading && (
                    <Empty description="ไม่พบข้อมูลผลการเรียนแยกตามหมวดวิชา" />
                )}
            </Card>
        )
    }

    return (
        <div className="course-group-performance-list">
            {datasets.map((dataset, index) => (
                <Card
                    key={dataset.id}
                    title={
                        dataset.rows[0]?.course_group
                            ? `ผลการเรียนในแต่ละหมวดวิชา: ${dataset.rows[0].course_group}`
                            : datasets.length > 1
                              ? `ผลการเรียนในแต่ละหมวดวิชา: ชุดที่ ${index + 1}`
                              : 'ผลการเรียนในแต่ละหมวดวิชา'
                    }
                    size="small"
                    loading={loading}
                >
                    <div
                        className={`performance-chart-table-layout${
                            dataset.rows.length === 1
                                ? ' performance-chart-table-layout--credit-table'
                                : ''
                        }`}
                    >
                        {dataset.rows.length === 1 ? (
                            <CourseGroupCreditCharts rows={dataset.rows} />
                        ) : (
                            <CourseGroupChart rows={dataset.rows} />
                        )}
                        <section
                            className="performance-table-panel"
                            aria-label="ตารางผลการเรียนในแต่ละหมวดวิชา"
                        >
                            <Table<StudentCourseGroupPerformanceRow>
                                className="course-group-performance-table"
                                rowKey="key"
                                columns={columns}
                                dataSource={dataset.rows}
                                pagination={false}
                                size="small"
                                tableLayout="fixed"
                            />
                        </section>
                    </div>
                    {dataset.rows.length > 1 && (
                        <CourseGroupCreditCharts rows={dataset.rows} />
                    )}
                </Card>
            ))}
        </div>
    )
}
