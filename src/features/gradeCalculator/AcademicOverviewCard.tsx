import { Alert, Card, Empty, Statistic, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
    StudentAcademicHistory,
    StudentAcademicOverview,
} from '../../types/StudentAcademicOverview'
import { formatTerm } from './gradeCalculatorUtils'

interface AcademicOverviewCardProps {
    overview: StudentAcademicOverview | null
    loading: boolean
    hasMissingSections: boolean
}

const columns: ColumnsType<StudentAcademicHistory> = [
    {
        title: 'ชั้นปี',
        dataIndex: 'year',
        align: 'center',
        render: (value: number) => `ชั้นปี ${value}`,
    },
    { title: 'ภาคการเรียน', dataIndex: 'semester', align: 'center' },
    { title: 'หน่วยกิต', dataIndex: 'credits', align: 'center' },
    {
        title: 'GPA',
        dataIndex: 'gpa',
        align: 'center',
        render: (value: number) => value.toFixed(2),
    },
    {
        title: 'GPAX สะสม',
        dataIndex: 'gpax',
        align: 'center',
        render: (value: number) => value.toFixed(2),
    },
]

function formatDecimal(value: number | null): string {
    return value === null ? '-' : value.toFixed(2)
}

export default function AcademicOverviewCard({
    overview,
    loading,
    hasMissingSections,
}: AcademicOverviewCardProps) {
    const latestTerm = overview?.latest_completed_term

    return (
        <Card
            className="grade-calculator-card"
            title="ผลการเรียนรวมจากภาคการศึกษาที่ผ่านมา"
            loading={loading}
        >
            {overview ? (
                <>
                    {hasMissingSections && (
                        <Alert
                            className="grade-calculator-data-alert"
                            type="warning"
                            showIcon
                            message="ข้อมูลผลการเรียนบางส่วนยังไม่พร้อมใช้งาน"
                        />
                    )}
                    <div className="grade-summary-grid">
                        <Statistic
                            title="GPAX ปัจจุบัน"
                            value={formatDecimal(overview.gpax)}
                        />
                        <Statistic
                            title="หน่วยกิตสะสม"
                            value={overview.cumulative_credits ?? '-'}
                            suffix={
                                overview.cumulative_credits === null
                                    ? undefined
                                    : 'หน่วยกิต'
                            }
                        />
                        <Statistic
                            title="GPA ภาคการเรียนล่าสุด"
                            value={formatDecimal(overview.latest_gpa)}
                        />
                        <Statistic
                            title="ชั้นปีและภาคการศึกษาล่าสุด"
                            value={
                                latestTerm
                                    ? formatTerm(latestTerm.year, latestTerm.semester)
                                    : '-'
                            }
                        />
                    </div>
                    <Table<StudentAcademicHistory>
                        rowKey={(row) => `${row.academic_year}-${row.semester_order}`}
                        columns={columns}
                        dataSource={overview.academic_history}
                        locale={{ emptyText: 'ไม่พบประวัติผลการเรียน' }}
                        pagination={false}
                        size="small"
                        tableLayout="fixed"
                    />
                </>
            ) : (
                !loading && <Empty description="กรุณาเลือกนิสิตเพื่อดูข้อมูล" />
            )}
        </Card>
    )
}
