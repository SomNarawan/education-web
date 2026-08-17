import { Card, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import type { FailedPlannedCourseRow } from '../../../types/CurriculumDetail'
import type {
    CourseResultTableProps,
    StudentFailedPlannedCoursesSectionProps,
} from './StudentFailedPlannedCoursesSection.types'
import { useStudentFailedPlannedCourses } from './useStudentFailedPlannedCourses'

const columns: ColumnsType<FailedPlannedCourseRow> = [
    {
        title: 'ชั้นปี',
        dataIndex: 'study_year',
        key: 'study_year',
        width: '8%',
        align: 'center',
        render: (value: number) => value ?? '-',
    },
    {
        title: 'ภาคการเรียน',
        dataIndex: 'semester',
        key: 'semester',
        width: '12%',
        align: 'center',
        render: (value: string) => value || '-',
    },
    {
        title: 'หมวดรายวิชา',
        dataIndex: 'course_group',
        key: 'course_group',
        width: '21%',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'รหัสวิชา',
        dataIndex: 'course_code',
        key: 'course_code',
        width: '12%',
        align: 'center',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'ชื่อรายวิชายังไม่ผ่าน',
        dataIndex: 'course_name',
        key: 'course_name',
        width: '30%',
        render: (value: string) => (
            <span className="course-result-name-cell">{value || '-'}</span>
        ),
    },
    {
        title: 'หน่วยกิต',
        dataIndex: 'credit',
        key: 'credit',
        width: '9%',
        align: 'center',
        render: (value: number) => value ?? '-',
    },
    {
        title: 'สถานะ',
        dataIndex: 'grade_letter',
        key: 'grade_letter',
        width: '8%',
        align: 'center',
        render: (value: string | null) => value || '-',
    },
]

function buildColumns(courseNameTitle: string): ColumnsType<FailedPlannedCourseRow> {
    return columns.map((column) =>
        column.key === 'course_name'
            ? {
                  ...column,
                  title: courseNameTitle,
              }
            : column,
    )
}

function CourseResultTable({
    title,
    courseNameTitle,
    rows,
    loading,
}: CourseResultTableProps) {
    const totalCredit = useMemo(
        () => rows.reduce((total, row) => total + row.credit, 0),
        [rows],
    )
    const tableColumns = useMemo(
        () => buildColumns(courseNameTitle),
        [courseNameTitle],
    )

    return (
        <Card
            className="failed-planned-courses-card"
            title={title}
            size="small"
        >
            <Table<FailedPlannedCourseRow>
                className="failed-planned-courses-table"
                rowKey="key"
                columns={tableColumns}
                dataSource={rows}
                loading={loading}
                pagination={false}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4}>
                            <strong>รวม</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                            {rows.length}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                            {totalCredit}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} />
                    </Table.Summary.Row>
                )}
            />
        </Card>
    )
}

export default function StudentFailedPlannedCoursesSection({
    studentCode,
}: StudentFailedPlannedCoursesSectionProps) {
    const {
        failedRows,
        clearedBacklogRows,
        overCurriculumRows,
        loading,
    } = useStudentFailedPlannedCourses(studentCode)

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <CourseResultTable
                title="ผลการเรียนวิชาที่ไม่ผ่านตามแผน"
                courseNameTitle="ชื่อรายวิชายังไม่ผ่าน"
                rows={failedRows}
                loading={loading}
            />
            <CourseResultTable
                title="ผลการเรียนวิชาที่วิชาตกค้างที่ผ่านแล้ว"
                courseNameTitle="ชื่อรายวิชาผ่านแล้ว"
                rows={clearedBacklogRows}
                loading={loading}
            />
            <CourseResultTable
                title="วิชาเรียนที่เรียนเกินหลักสูตร"
                courseNameTitle="ชื่อรายวิชา"
                rows={overCurriculumRows}
                loading={loading}
            />
        </Space>
    )
}
