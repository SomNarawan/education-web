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
    disabled = false,
    labelRender,
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
    const renderSelectedLabel: NonNullable<SelectProps<T>['labelRender']> =
        labelRender ??
        ((selectedOption) => {
            const hasLoadedOption = props.options?.some(
                (option) => option.value === selectedOption.value,
            )

            return loading && !hasLoadedOption
                ? 'กำลังโหลด...'
                : selectedOption.label
        })

    return (
        <Select<T>
            {...props}
            loading={loading}
            disabled={disabled || loading}
            labelRender={renderSelectedLabel}
            status={error ? 'error' : status}
            notFoundContent={notFoundContent}
        />
    )
}
