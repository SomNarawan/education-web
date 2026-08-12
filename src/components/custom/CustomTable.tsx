import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Input, Space, Table } from 'antd'
import type { TableProps } from 'antd'
import type { ColumnsType, ColumnType } from 'antd/es/table'

const { Search } = Input

interface CustomTableProps<T> extends TableProps<T> {
    searchPlaceholder?: string
    showNo?: boolean
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
        return Object.values(value).map(getSearchText).join(' ')
    }

    return ''
}

function formatEmptyCell(value: unknown): ReactNode {
    if (value === null || value === undefined) {
        return '-'
    }

    if (typeof value === 'string' && value.trim() === '') {
        return '-'
    }

    return value as ReactNode
}

function addEmptyCellFallback<T>(columns: ColumnsType<T>): ColumnsType<T> {
    return columns.map((column) => {
        if ('children' in column && column.children) {
            return {
                ...column,
                children: addEmptyCellFallback(column.children),
            }
        }

        if ('render' in column && column.render) {
            return column
        }

        if (!('dataIndex' in column) || column.dataIndex === undefined) {
            return column
        }

        return {
            ...column,
            render: formatEmptyCell,
        } as ColumnType<T>
    })
}

export default function CustomTable<T extends object>({
    searchPlaceholder = 'ค้นหา...',
    showNo = true,
    dataSource = [],
    pagination,
    columns = [],
    ...props
}: CustomTableProps<T>) {
    const [keyword, setKeyword] = useState('')

    const filteredData = useMemo(() => {
        const searchText = keyword.trim().toLowerCase()

        if (!searchText) {
            return dataSource
        }

        return dataSource.filter((record) =>
            getSearchText(record).toLowerCase().includes(searchText),
        )
    }, [dataSource, keyword])

    const noColumn: ColumnsType<T>[number] = {
        title: 'No.',
        width: 70,
        align: 'center',
        render: (_, __, index) => index + 1,
    }

    const columnsWithFallback = addEmptyCellFallback(columns as ColumnsType<T>)

    const customColumns: ColumnsType<T> = showNo
        ? [noColumn, ...columnsWithFallback]
        : columnsWithFallback

    return (
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <Search
                placeholder={searchPlaceholder}
                allowClear
                onChange={(e) => setKeyword(e.target.value)}
                style={{ maxWidth: 360 }}
            />

            <Table
                {...props}
                columns={customColumns}
                dataSource={filteredData}
                pagination={
                    pagination === false
                        ? false
                        : {
                              defaultPageSize: 10,
                              showSizeChanger: true,
                              pageSizeOptions: ['10', '20', '50', '100'],
                              showTotal: (total) =>
                                  `จำนวนรายการทั้งหมด ${total} รายการ`,
                              ...pagination,
                          }
                }
            />
        </Space>
    )
}
