import { SearchOutlined } from '@ant-design/icons'
import type { DualAxesConfig } from '@ant-design/plots'
import {
    Button,
    Card,
    Progress,
    Spin,
    Table,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Suspense, lazy, useMemo, useState } from 'react'
import type { StudentSemesterPerformanceRow } from '../../../types/StudentSemesterPerformance'
import type {
    StudentSemesterChartProps,
    StudentSemesterPerformanceSectionProps,
} from './StudentSemesterPerformanceSection.types'
import {
    getGradeColor,
    getGradeRange,
    gradeRangeColors,
    gradeRanges,
} from '../../../utils/grade'
import {
    formatDecimal,
    formatDiff,
    getDiffColor,
} from '../../../utils/performanceFormat'
import SemesterDetailModal from './SemesterDetailModal'

const chartColors = {
    gpaxLine: '#4b5563',
    grid: '#d9dce3',
    axis: '#8c8c8c',
    text: '#262626',
}

const DualAxes = lazy(() =>
    import('@ant-design/plots').then((chartModule) => ({
        default: chartModule.DualAxes,
    })),
)

function getStatusPercent(value: number, total: number) {
    if (total <= 0) {
        return 0
    }

    return Math.min((value / total) * 100, 100)
}

function StudentSemesterChart({
    creditStatuses,
    rows,
}: StudentSemesterChartProps) {
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
        xField: 'semesterLabel',
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
                    optionalAngles: [0, 25, 45, 90],
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
                    fillOpacity: 0.78,
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
                    stroke: chartColors.gpaxLine,
                    lineWidth: 3,
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
                        style={{ color: chartColors.gpaxLine }}
                    >
                        <span className="grade-legend-line" />
                        GPAX
                    </span>
                </div>

                <div
                    className="semester-performance-chart"
                    role="img"
                    aria-label="กราฟแท่ง GPA และกราฟเส้น GPAX รายภาคการศึกษา"
                >
                    <Suspense
                        fallback={
                            <div className="chart-loading">
                                <Spin />
                            </div>
                        }
                    >
                        <DualAxes {...chartConfig} />
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
    creditStatuses,
    rows,
    loading = false,
}: StudentSemesterPerformanceSectionProps) {
    const [detailRecord, setDetailRecord] =
        useState<StudentSemesterPerformanceRow | null>(null)

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

            <SemesterDetailModal
                record={detailRecord}
                onClose={() => setDetailRecord(null)}
            />
        </Card>
    )
}
