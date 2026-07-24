import { TableOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Modal, Popover, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
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
    text: '#666666',
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
    chartWidth,
}: {
    rows: StudentCourseGroupPerformanceRow[]
    chartWidth: number
}) {
    const xAxisLabels = rows.map((row) => wrapAxisLabel(row.course_group))
    const chartHeight = 460
    const margin = {
        top: 18,
        right: 20,
        bottom: 120,
        left: 42,
    }
    const innerWidth = chartWidth - margin.left - margin.right
    const innerHeight = chartHeight - margin.top - margin.bottom
    const stepWidth = innerWidth / Math.max(rows.length, 1)
    const barWidth = Math.min(118, stepWidth * 0.72)
    const yTicks = Array.from({ length: 9 }, (_, index) => index * 0.5)
    const getY = (value: number) =>
        margin.top + innerHeight - (Math.min(Math.max(value, 0), 4) / 4) * innerHeight

    return (
        <div className="course-group-chart-scroll">
            <div className="grade-chart-legend">
                <span className="grade-legend-item grade-legend-danger">
                    <span
                        className="grade-legend-dot"
                        style={{ background: chartColors.danger }}
                    />
                    เกรด(0-1.74)
                </span>
                <span className="grade-legend-item grade-legend-warning">
                    <span
                        className="grade-legend-dot"
                        style={{ background: chartColors.warning }}
                    />
                    เกรด(1.75-1.99)
                </span>
                <span className="grade-legend-item grade-legend-success">
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
                    เกรด(3.25-4.00)
                </span>
            </div>

            <svg
                className="course-group-performance-chart"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label="กราฟเกรดเฉลี่ยแยกตามหมวดวิชา"
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
                    const centerX =
                        margin.left + stepWidth * index + stepWidth / 2
                    const x = centerX - barWidth / 2
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
                                opacity="0.78"
                            />
                            <text
                                x={centerX}
                                y={margin.top + innerHeight + 27}
                                textAnchor="middle"
                                fill={chartColors.text}
                                fontSize="12"
                            >
                                <title>{row.course_group}</title>
                                {xAxisLabels[index].map((line, lineIndex) => (
                                    <tspan
                                        key={`${row.key}-${lineIndex}`}
                                        x={centerX}
                                        dy={lineIndex === 0 ? 0 : 18}
                                    >
                                        {line}
                                    </tspan>
                                ))}
                            </text>
                        </g>
                    )
                })}
            </svg>
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
                                    style={{
                                        background: `conic-gradient(${gradeColor} 0% ${percentage}%, #d9d9d9 ${percentage}% 100%)`,
                                    }}
                                    type="button"
                                    aria-label={`${row.course_group} เรียนแล้ว ${completedCredits} จาก ${totalCredits} หน่วยกิต กดเพื่อดูรายละเอียด`}
                                >
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
    const [selectedDataset, setSelectedDataset] =
        useState<CourseGroupDataset | null>(null)

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
    const sharedChartWidth = useMemo(
        () =>
            Math.max(
                760,
                ...datasets.map((dataset) => dataset.rows.length * 180 + 80),
            ),
        [datasets],
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
                    extra={
                        <Button
                            type="primary"
                            icon={<TableOutlined />}
                            onClick={() => setSelectedDataset(dataset)}
                        >
                            ดูตาราง
                        </Button>
                    }
                    size="small"
                    loading={loading}
                >
                    <CourseGroupChart
                        rows={dataset.rows}
                        chartWidth={sharedChartWidth}
                    />
                    <CourseGroupCreditCharts rows={dataset.rows} />
                </Card>
            ))}

            <Modal
                title="ตารางผลการเรียนในแต่ละหมวดวิชา"
                open={selectedDataset !== null}
                width={1100}
                footer={null}
                destroyOnHidden
                onCancel={() => setSelectedDataset(null)}
            >
                <Table<StudentCourseGroupPerformanceRow>
                    className="course-group-performance-table"
                    rowKey="key"
                    columns={columns}
                    dataSource={selectedDataset?.rows ?? []}
                    pagination={false}
                    scroll={{ x: 760 }}
                />
            </Modal>
        </div>
    )
}
