import {
    BookOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
    FolderOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Button, Card, Tooltip, Tree, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import CustomTable from './custom/CustomTable'
import { getCurriculumDivisions } from '../services/masterDataService'
import { getStudentEnrollment } from '../services/studentJsonDataService'
import type {
    CurriculumCourseRow,
    CurriculumDivision,
    CurriculumEnrollmentRecord,
} from '../types/CurriculumDetail'
import type {
    CourseTableProps,
    CurriculumTreeData,
    StudentCurriculumDetailSectionProps,
    TreeSelection,
} from './StudentCurriculumDetailSection.types'

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

function buildRows(rows: CurriculumEnrollmentRecord[]): CurriculumCourseRow[] {
    return rows.map((row, index) => ({
        ...row,
        key: `${row.course_code || 'course'}-${index}`,
    }))
}

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

function buildCurriculumTree(
    divisions: CurriculumDivision[],
    rows: CurriculumCourseRow[],
): CurriculumTreeData {
    const rowKeysByNode = new Map<string, Set<string>>()
    const pathByNode = new Map<string, string[]>()
    let generalEducationKey: string | undefined
    const getDivisionRows = (
        division: CurriculumDivision,
        candidateRows: CurriculumCourseRow[],
    ) =>
        candidateRows.filter((row) => {
            if (division.division_type === 'group') {
                return row.course_group === division.name_th
            }

            if (division.division_type === 'requirement') {
                return row.course_requirement === division.name_th
            }

            return (
                getCourseCategory(row) === division.name_th ||
                row.course_sub_category === division.name_th
            )
        })
    const buildDivisionNode = (
        division: CurriculumDivision,
        candidateRows: CurriculumCourseRow[],
        parentKey = 'root',
        parentPath: string[] = [],
    ): CurriculumTreeData['nodes'][number] => {
        const nodeKey = `${parentKey}-division-${division.id}`
        const nodePath = [...parentPath, division.name_th]
        if (division.name_th === 'หมวดวิชาศึกษาทั่วไป') {
            generalEducationKey = nodeKey
        }
        const divisionRows = getDivisionRows(division, candidateRows)
        const childNodes = division.children.map((child) =>
            buildDivisionNode(child, divisionRows, nodeKey, nodePath),
        )

        rowKeysByNode.set(
            nodeKey,
            new Set(divisionRows.map((row) => row.key)),
        )
        pathByNode.set(nodeKey, nodePath)

        return {
            key: nodeKey,
            title: division.name_th,
            icon:
                division.division_type === 'category' ? (
                    <BookOutlined />
                ) : (
                    <FolderOutlined />
                ),
            children: childNodes,
        }
    }
    const nodes = divisions.map((division) =>
        buildDivisionNode(division, rows),
    )

    return { nodes, rowKeysByNode, pathByNode, generalEducationKey }
}

export default function StudentCurriculumDetailSection({
    studentCode,
}: StudentCurriculumDetailSectionProps) {
    const [divisions, setDivisions] = useState<CurriculumDivision[]>([])
    const [rows, setRows] = useState<CurriculumCourseRow[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loadingCourses, setLoadingCourses] = useState(false)
    const [treeSelection, setTreeSelection] = useState<TreeSelection>()
    const [isStructureCollapsed, setIsStructureCollapsed] = useState(false)

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true)
                const data = await getCurriculumDivisions()
                setDivisions(data)
            } catch (error) {
                console.error(error)
                message.error('โหลดโครงสร้างหลักสูตรไม่สำเร็จ')
            } finally {
                setLoadingCategories(false)
            }
        }

        loadCategories()
    }, [])

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setLoadingCourses(true)
                const data = await getStudentEnrollment(studentCode)
                setRows(buildRows(data.enrollment))
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลผลการเรียนไม่สำเร็จ')
                setRows([])
            } finally {
                setLoadingCourses(false)
            }
        }

        loadCourses()
    }, [studentCode])

    const curriculumTree = useMemo(
        () => buildCurriculumTree(divisions, rows),
        [divisions, rows],
    )
    const selectedTreeKey =
        treeSelection?.studentCode === studentCode
            ? treeSelection.key
            : curriculumTree.generalEducationKey

    const displayedRows = useMemo(() => {
        if (!selectedTreeKey) {
            return []
        }

        const selectedRowKeys =
            curriculumTree.rowKeysByNode.get(selectedTreeKey)

        if (!selectedRowKeys) {
            return []
        }

        return rows.filter(
            (row) =>
                selectedRowKeys.has(row.key) &&
                Boolean(row.grade_letter?.trim()),
        )
    }, [curriculumTree, rows, selectedTreeKey])
    const selectedTreePath = selectedTreeKey
        ? (curriculumTree.pathByNode.get(selectedTreeKey) ?? [])
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
                    <Tree
                        key={`${studentCode}-${curriculumTree.nodes.length}`}
                        className="curriculum-structure-tree"
                        blockNode
                        defaultExpandAll
                        showIcon
                        treeData={curriculumTree.nodes}
                        selectedKeys={selectedTreeKey ? [selectedTreeKey] : []}
                        onSelect={(selectedKeys) =>
                            setTreeSelection(
                                selectedKeys.length
                                    ? {
                                          studentCode,
                                          key: String(selectedKeys[0]),
                                      }
                                    : undefined,
                            )
                        }
                    />
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
