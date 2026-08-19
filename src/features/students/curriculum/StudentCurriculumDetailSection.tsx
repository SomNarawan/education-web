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
    CurriculumEnrollmentRecord,
} from '../../../types/CurriculumDetail'
import type {
    CourseTableProps,
    CurriculumTreeData,
    StudentCurriculumDetailSectionProps,
    TreeSelection,
} from './StudentCurriculumDetailSection.types'
import { useStudentCurriculumDetail } from './useStudentCurriculumDetail'

function getCourseCategory(row: CurriculumEnrollmentRecord) {
    return row.course_category || row.curriculum_division || 'ไม่ระบุหมวดวิชา'
}

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
        category.name_th?.trim() ||
        category.name_en?.trim() ||
        category.code?.trim() ||
        `#${category.id}`
    )
}

function buildCurriculumTree(
    categories: CurriculumCategory[],
    rows: CurriculumCourseRow[],
): CurriculumTreeData {
    const rowKeysByNode = new Map<number, Set<string>>()
    const pathByNode = new Map<number, string[]>()
    let generalEducationId: number | undefined
    const getCategoryRows = (
        category: CurriculumCategory,
        candidateRows: CurriculumCourseRow[],
    ) => {
        const names = [category.name_th, category.name_en].filter(
            (name): name is string => Boolean(name?.trim()),
        )

        return candidateRows.filter((row) => {
            if (category.course_source_type === 'non_course_requirement') {
                return names.includes(row.course_requirement ?? '')
            }

            if (category.category_type === 'group') {
                return names.includes(row.course_group ?? '')
            }

            if (category.category_type === 'subcategory') {
                return names.includes(row.course_sub_category ?? '')
            }

            return (
                names.includes(getCourseCategory(row)) ||
                names.includes(row.course_sub_category ?? '')
            )
        })
    }
    const buildCategoryNode = (
        category: CurriculumCategory,
        candidateRows: CurriculumCourseRow[],
        parentPath: string[] = [],
    ): CurriculumTreeData['nodes'][number] => {
        const categoryName = getCategoryName(category)
        const nodePath = [...parentPath, categoryName]
        if (
            category.code === 'GE' ||
            category.name_th === 'หมวดวิชาศึกษาทั่วไป'
        ) {
            generalEducationId = category.id
        }
        const categoryRows = getCategoryRows(category, candidateRows)
        const childNodes = category.children.map((child) =>
            buildCategoryNode(child, categoryRows, nodePath),
        )

        rowKeysByNode.set(
            category.id,
            new Set(categoryRows.map((row) => row.key)),
        )
        pathByNode.set(category.id, nodePath)

        return {
            key: category.id,
            title: categoryName,
            icon:
                category.category_type === 'category' ? (
                    <BookOutlined />
                ) : (
                    <FolderOutlined />
                ),
            children: childNodes,
        }
    }
    const nodes = categories.map((category) =>
        buildCategoryNode(category, rows),
    )

    return { nodes, rowKeysByNode, pathByNode, generalEducationId }
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
            : curriculumTree.generalEducationId

    const displayedRows = useMemo(() => {
        if (!selectedCategoryId) {
            return []
        }

        const selectedRowKeys =
            curriculumTree.rowKeysByNode.get(selectedCategoryId)

        if (!selectedRowKeys) {
            return []
        }

        return rows.filter(
            (row) =>
                selectedRowKeys.has(row.key) &&
                Boolean(row.grade_letter?.trim()),
        )
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
