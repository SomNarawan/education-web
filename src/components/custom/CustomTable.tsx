import { useMemo, useState } from 'react'
import { Input, Space, Table } from 'antd'
import type { TableProps } from 'antd'

const { Search } = Input

interface CustomTableProps<T> extends TableProps<T> {
    searchPlaceholder?: string
}

function getSearchText(value: unknown): string {
    if (value === null || value === undefined) {
        return ''
    }

    if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
    }

    if (Array.isArray(value)) {
        return value.map(getSearchText).join(' ')
    }

    if (typeof value === 'object') {
        return Object.values(value)
            .map(getSearchText)
            .join(' ')
    }

    return ''
}

export default function CustomTable<T extends object>({
    searchPlaceholder = 'ค้นหา...',
    dataSource = [],
    pagination,
    ...props
}: CustomTableProps<T>) {
    const [keyword, setKeyword] = useState('')

    const filteredData = useMemo(() => {
        const searchText = keyword.trim().toLowerCase()

        if (!searchText) {
            return dataSource
        }

        return dataSource.filter((record) =>
            getSearchText(record)
                .toLowerCase()
                .includes(searchText),
        )
    }, [dataSource, keyword])

    return (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Search
                placeholder={searchPlaceholder}
                allowClear
                onChange={(e) => setKeyword(e.target.value)}
                style={{ maxWidth: 360 }}
            />

            <Table
                {...props}
                dataSource={filteredData}
                pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total) =>
                        `จำนวนรายการทั้งหมด ${total} รายการ`,
                    ...pagination,
                }}
            />
        </Space>
    )
}