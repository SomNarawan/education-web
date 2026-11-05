import { EyeOutlined } from '@ant-design/icons'
import { Button, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import { appColors } from '../../config/appColors'
import type {
    AcademicPeriodSummary,
    AcademicPeriodSummaryStatus,
    AcademicPeriodSyncStatus,
    StudentAcademicPeriodSyncHistory,
} from '../../types/StudentAcademicPeriodSync'
import { formatThaiDateTime } from '../../utils/dateFormat'
import {
    academicPeriodHistoryStatusDisplay,
    academicPeriodSummaryStatusDisplay,
} from './academicPeriodSync.constants'

const { Text } = Typography

export const academicPeriodSummaryColumns: TableColumnsType<AcademicPeriodSummary> = [
    {
        title: 'ปีการศึกษาที่เข้า',
        dataIndex: 'entry_year_be',
        key: 'entry_year_be',
        render: (value: number) => <Text strong>{value}</Text>,
    },
    {
        title: 'จำนวนนิสิต',
        dataIndex: 'student_count',
        key: 'student_count',
        align: 'right',
        render: (value: number) => `${value.toLocaleString()} คน`,
    },
    {
        title: 'ชั้นปีจากระบบ',
        dataIndex: 'study_year',
        key: 'study_year',
        align: 'center',
        render: (value: number | null) =>
            value === null ? '-' : `ชั้นปีที่ ${value}`,
    },
    {
        title: 'ปี/ภาคการศึกษาที่จะ Sync',
        key: 'targetPeriod',
        render: (_, record) =>
            record.academic_year_be && record.term_name_th
                ? `${record.academic_year_be} / ${record.term_name_th}`
                : '-',
    },
    {
        title: 'รายการอัปเดต',
        dataIndex: 'update_count',
        key: 'update_count',
        align: 'right',
        render: (value: number) => `${value.toLocaleString()} รายการ`,
    },
    {
        title: 'รายการไม่อัปเดต',
        dataIndex: 'unchanged_count',
        key: 'unchanged_count',
        align: 'right',
        render: (value: number) => `${value.toLocaleString()} รายการ`,
    },
    {
        title: 'สถานะ',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        render: (status: AcademicPeriodSummaryStatus) => {
            const display = academicPeriodSummaryStatusDisplay[status]
            return <Tag color={display.color}>{display.label}</Tag>
        },
    },
]

export function createAcademicPeriodHistoryColumns(
    onSelectHistory: (record: StudentAcademicPeriodSyncHistory) => void,
): TableColumnsType<StudentAcademicPeriodSyncHistory> {
    return [
        {
            title: 'ปี / ภาคการศึกษา',
            key: 'period',
            render: (_, record) =>
                record.academic_year && record.term_name_th
                    ? `${record.academic_year + 543} / ${record.term_name_th}`
                    : '-',
        },
        {
            title: 'นิสิตทั้งหมด',
            dataIndex: 'total_students',
            key: 'total_students',
            align: 'right',
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: 'รายการอัปเดต',
            dataIndex: 'updated_count',
            key: 'updated_count',
            align: 'right',
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: 'รายการไม่อัปเดต',
            dataIndex: 'skipped_count',
            key: 'skipped_count',
            align: 'right',
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: 'ไม่สำเร็จ',
            dataIndex: 'failed_count',
            key: 'failed_count',
            align: 'right',
            render: (value: number) => value.toLocaleString(),
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            render: (status: AcademicPeriodSyncStatus) => {
                const display = academicPeriodHistoryStatusDisplay[status]
                return <Tag color={display.color}>{display.label}</Tag>
            },
        },
        {
            title: 'ดำเนินการโดย',
            dataIndex: 'created_by',
            key: 'created_by',
        },
        {
            title: 'วันที่ Sync',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (value: string) => formatThaiDateTime(value),
        },
        {
            title: 'จัดการ',
            key: 'action',
            width: 70,
            align: 'center',
            render: (_, record) => (
                <Button
                    icon={<EyeOutlined />}
                    aria-label="ดูรายละเอียดประวัติ Sync"
                    style={{
                        borderColor: appColors.info,
                        color: appColors.info,
                    }}
                    onClick={() => onSelectHistory(record)}
                />
            ),
        },
    ]
}
