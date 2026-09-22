import { Empty, Select, Spin } from 'antd'
import type { SelectProps } from 'antd'

interface ListOfValueSelectProps<T extends string | number> extends SelectProps<T> {
    error?: string | null
    emptyText?: string
}

export default function ListOfValueSelect<T extends string | number = number>({
    error,
    emptyText = 'ไม่พบข้อมูล',
    loading = false,
    status,
    ...props
}: ListOfValueSelectProps<T>) {
    const notFoundContent = loading ? (
        <Spin size="small" />
    ) : (
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={error ?? emptyText}
        />
    )

    return (
        <Select<T>
            {...props}
            loading={loading}
            status={error ? 'error' : status}
            notFoundContent={notFoundContent}
        />
    )
}
