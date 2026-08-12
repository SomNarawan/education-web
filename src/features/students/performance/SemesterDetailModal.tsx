import { Modal, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
    StudentSemesterEnrollment,
    StudentSemesterPerformanceRow,
} from '../../../types/StudentSemesterPerformance'
import {
    formatDecimal,
    formatDiff,
    getDiffColor,
} from '../../../utils/performanceFormat'

interface SemesterDetailModalProps {
    record: StudentSemesterPerformanceRow | null
    onClose: () => void
}

const columns: ColumnsType<StudentSemesterEnrollment> = [
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
]

export default function SemesterDetailModal({
    record,
    onClose,
}: SemesterDetailModalProps) {
    return (
        <Modal
            open={record !== null}
            width={860}
            footer={null}
            destroyOnHidden
            onCancel={onClose}
        >
            {record && (
                <>
                    <div className="semester-detail-summary">
                        <Typography.Text strong>
                            GPA {formatDecimal(record.gpa)}
                        </Typography.Text>
                        <Typography.Text strong>
                            GPAX {formatDecimal(record.gpax)}
                        </Typography.Text>
                        <Typography.Text
                            strong
                            style={{ color: getDiffColor(record.diff_gpax) }}
                        >
                            +-GPAX {formatDiff(record.diff_gpax)}
                        </Typography.Text>
                    </div>
                    <Typography.Title level={3}>
                        ผลการเรียนของนิสิตชั้นปี {record.study_year}{' '}
                        {record.semester} พ.ศ. {record.semester_year_be}
                    </Typography.Title>
                    <Table<StudentSemesterEnrollment>
                        className="semester-detail-table"
                        rowKey={(enrollment, index) =>
                            `${enrollment.course_name}-${index ?? 0}`
                        }
                        columns={columns}
                        dataSource={record.enrollments}
                        pagination={false}
                    />
                </>
            )}
        </Modal>
    )
}
