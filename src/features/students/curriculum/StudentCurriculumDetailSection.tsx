import {
    BookOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
    FolderOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Button, Card, Empty, Tooltip, Tree } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import CustomTable from '../../../components/custom/CustomTable'
import type {
    CurriculumCategory,
    CurriculumCourseRow,
} from '../../../types/CurriculumDetail'
import type {
    CourseTableProps,
    CurriculumTreeData,
    StudentCurriculumDetailSectionProps,
    TreeSelection,
} from './StudentCurriculumDetailSection.types'
import { useStudentCurriculumDetail } from './useStudentCurriculumDetail'
import { getCurriculumCategoryRows } from './getCurriculumCategoryRows'

const columns: ColumnsType<CurriculumCourseRow> = [
    {
        title: 'ปีที่',
        dataIndex: 'study_year',
        key: 'study_year',
        width: '7%',
    },
    {
        title: 'ภาคการศึกษา',
        dataIndex: 'semester',
        key: 'semester',
        width: '13%',
    },
    {
        title: 'รหัสวิชา',
        dataIndex: 'course_code',
        key: 'course_code',
        width: '12%',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'ชื่อวิชา',
        dataIndex: 'course_name',
        key: 'course_name',
        width: '29%',
    },
    {
        title: 'หมวดรายวิชา',
        dataIndex: 'course_group',
        key: 'course_group',
        width: '22%',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'ผลการเรียน',
        dataIndex: 'grade_letter',
        key: 'grade_letter',
        width: '9%',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'หน่วยกิต',
        dataIndex: 'credit',
        key: 'credit',
        width: '8%',
    },
]

function CourseTable({
    rows,
    loading,
}: CourseTableProps) {
    return (
        <CustomTable<CurriculumCourseRow>
            className="curriculum-detail-table"
            rowKey="key"
            rowClassName={(row) =>
                row.grade_letter?.trim()
                    ? ''
                    : 'curriculum-course-without-grade'
            }
            columns={columns}
            dataSource={rows}
            loading={loading}
            searchPlaceholder="ค้นหารายวิชา..."
            showNo={false}
        />
    )
}

function getCategoryName(category: CurriculumCategory) {
    return (
        category.name_short_th?.trim() ||
        category.name_th?.trim() ||
        category.name_short_en?.trim() ||
        category.name_en?.trim() ||
        category.code?.trim() ||
        `#${category.id}`
    )
}

function isSubject(node: CurriculumCategory) {
    return node.category_type === 'subject'
}

function buildCurriculumTree(
    categories: CurriculumCategory[],
    rows: CurriculumCourseRow[],
): CurriculumTreeData {
    const rowKeysByNode = new Map<number, Set<string>>()
    const pathByNode = new Map<number, string[]>()

    const buildCategoryNode = (
        category: CurriculumCategory,
        candidateRows: CurriculumCourseRow[],
        parentPath: string[] = [],
    ): CurriculumTreeData['nodes'][number] => {
        const categoryName = getCategoryName(category)
        const nodePath = [...parentPath, categoryName]
        const categoryRows = getCurriculumCategoryRows(category, candidateRows)
        const rowKeys = new Set(categoryRows.map((row) => row.key))
        // A structural heading can have no matching rows of its own.
        const childCandidateRows = categoryRows.length > 0 ? categoryRows : candidateRows
        const childNodes = category.children
            .filter((child) => !isSubject(child))
            .map((child) => {
                const childNode = buildCategoryNode(
                    child,
                    childCandidateRows,
                    nodePath,
                )
                rowKeysByNode.get(child.id)?.forEach((key) => rowKeys.add(key))
                return childNode
            })

        pathByNode.set(category.id, nodePath)
        rowKeysByNode.set(category.id, rowKeys)

        return {
            key: category.id,
            title: categoryName,
            icon:
                parentPath.length === 0 ? (
                    <BookOutlined />
                ) : (
                    <FolderOutlined />
                ),
            children: childNodes,
        }
    }

    const nodes = categories
        .filter((category) => !isSubject(category))
        .map((category) => buildCategoryNode(category, rows))
    const firstNodeId = nodes.length > 0 ? Number(nodes[0].key) : undefined

    return {
        nodes,
        rowKeysByNode,
        pathByNode,
        defaultNodeId: firstNodeId,
    }
}

export default function StudentCurriculumDetailSection({
    studentCode,
    studyPlanId,
}: StudentCurriculumDetailSectionProps) {
    const { categories, rows, loadingCategories, loadingCourses } =
        useStudentCurriculumDetail(studentCode, studyPlanId)
    const [treeSelection, setTreeSelection] = useState<TreeSelection>()
    const [isStructureCollapsed, setIsStructureCollapsed] = useState(false)

    const curriculumTree = useMemo(
        () => buildCurriculumTree(categories, rows),
        [categories, rows],
    )
    const selectedCategoryId =
        treeSelection?.studentCode === studentCode &&
        curriculumTree.rowKeysByNode.has(treeSelection.categoryId)
            ? treeSelection.categoryId
            : curriculumTree.defaultNodeId

    const displayedRows = useMemo(() => {
        if (!selectedCategoryId) {
            return []
        }

        const selectedRowKeys =
            curriculumTree.rowKeysByNode.get(selectedCategoryId)

        if (!selectedRowKeys) {
            return []
        }

        return rows.filter((row) => selectedRowKeys.has(row.key))
    }, [curriculumTree, rows, selectedCategoryId])
    const selectedTreePath = selectedCategoryId
        ? (curriculumTree.pathByNode.get(selectedCategoryId) ?? [])
        : []

    return (
        <div
            className={`curriculum-detail-layout${isStructureCollapsed ? ' curriculum-detail-layout-collapsed' : ''}`}
        >
            {isStructureCollapsed ? (
                <div className="curriculum-structure-collapsed">
                    <Tooltip title="ขยายโครงสร้างหลักสูตร" placement="right">
                        <Button
                            type="text"
                            icon={<DoubleRightOutlined />}
                            aria-label="ขยายโครงสร้างหลักสูตร"
                            onClick={() => setIsStructureCollapsed(false)}
                        />
                    </Tooltip>
                </div>
            ) : (
                <Card
                    className="curriculum-structure-card"
                    title="โครงสร้างหลักสูตร"
                    extra={
                        <Tooltip title="ย่อโครงสร้างหลักสูตร">
                            <Button
                                type="text"
                                icon={<DoubleLeftOutlined />}
                                aria-label="ย่อโครงสร้างหลักสูตร"
                                onClick={() => setIsStructureCollapsed(true)}
                            />
                        </Tooltip>
                    }
                    loading={loadingCategories || loadingCourses}
                >
                    {curriculumTree.nodes.length > 0 ? (
                        <Tree
                            key={`${studentCode}-${studyPlanId}-${curriculumTree.nodes.length}`}
                            className="curriculum-structure-tree"
                            blockNode
                            defaultExpandAll
                            showIcon
                            treeData={curriculumTree.nodes}
                            selectedKeys={
                                selectedCategoryId
                                    ? [selectedCategoryId]
                                    : []
                            }
                            onSelect={(selectedKeys) =>
                                setTreeSelection(
                                    selectedKeys.length
                                        ? {
                                              studentCode,
                                              categoryId: Number(
                                                  selectedKeys[0],
                                              ),
                                          }
                                        : undefined,
                                )
                            }
                        />
                    ) : (
                        <Empty description="ไม่พบหมวดหมู่ในหลักสูตร" />
                    )}
                </Card>
            )}

            <Card
                className="curriculum-courses-card"
                title={
                    <div className="curriculum-courses-heading">
                        <span>รายวิชา</span>
                        {selectedTreePath.length > 0 && (
                            <Breadcrumb
                                className="curriculum-courses-path"
                                items={selectedTreePath.map((title) => ({
                                    title,
                                }))}
                            />
                        )}
                    </div>
                }
            >
                <CourseTable rows={displayedRows} loading={loadingCourses} />
            </Card>
        </div>
    )
}
