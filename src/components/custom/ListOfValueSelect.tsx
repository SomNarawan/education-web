import { Empty, Select, Spin } from 'antd'
import type { SelectProps } from 'antd'

interface ListOfValueSelectProps extends SelectProps<number> {
    error?: string | null
    emptyText?: string
}

export default function ListOfValueSelect({
    error,
    emptyText = 'ไม่พบข้อมูล',
    loading = false,
    status,
    ...props
}: ListOfValueSelectProps) {
    const notFoundContent = loading ? (
        <Spin size="small" />
    ) : (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={error ?? emptyText}
        />
    )

    return (
        <Select<number>
            {...props}
            loading={loading}
            status={error ? 'error' : status}
            notFoundContent={notFoundContent}
        />
    )
}
