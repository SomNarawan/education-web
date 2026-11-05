import { Card, Table } from 'antd'
import { useMemo } from 'react'
import type { StudentAcademicPeriodSyncHistory } from '../../types/StudentAcademicPeriodSync'
import { createAcademicPeriodHistoryColumns } from './academicPeriodSync.columns'

interface AcademicPeriodHistoryProps {
    history: StudentAcademicPeriodSyncHistory[]
    loading: boolean
    onSelectHistory: (record: StudentAcademicPeriodSyncHistory) => void
}

export default function AcademicPeriodHistory({
    history,
    loading,
    onSelectHistory,
}: AcademicPeriodHistoryProps) {
    const columns = useMemo(
        () => createAcademicPeriodHistoryColumns(onSelectHistory),
        [onSelectHistory],
    )

    return (
        <Card className="academic-period-table-card">
            <Table<StudentAcademicPeriodSyncHistory>
                rowKey="id"
                columns={columns}
                dataSource={history}
                loading={loading}
                scroll={{ x: 1100 }}
                locale={{ emptyText: 'ยังไม่มีประวัติการ Sync' }}
            />
        </Card>
    )
}
