import { Card, Tabs, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import CustomTable from './custom/CustomTable'
import { getCurriculumDivisionCategories } from '../services/masterDataService'
import type {
    CurriculumCourseRow,
    CurriculumDivisionCategory,
    CurriculumEnrollmentRecord,
} from '../types/CurriculumDetail'

interface StudentCurriculumDetailSectionProps {
    studentCode: string
}

type EnrollmentRowsModule = {
    default: CurriculumEnrollmentRecord[]
}

type CourseCategoryTab = {
    key: string
    label: string
}

const enrollmentRows = import.meta.glob<EnrollmentRowsModule>(
    '../data/enrollments/*.json',
)

const emptySubCategoryLabel = 'ไม่ระบุหมวดย่อย'

function getCourseCategory(row: CurriculumEnrollmentRecord) {
    return row.course_category || row.curriculum_division || 'ไม่ระบุหมวดวิชา'
}

const columns: ColumnsType<CurriculumCourseRow> = [
    {
        title: 'ปีที่',
        dataIndex: 'study_year',
        key: 'study_year',
        width: '7%',
        sorter: (a, b) => a.study_year - b.study_year,
    },
    {
        title: 'ภาคการศึกษา',
        dataIndex: 'semester',
        key: 'semester',
        width: '13%',
        sorter: (a, b) => a.semester_order - b.semester_order,
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
        sorter: (a, b) => a.credit - b.credit,
    },
]

function buildRows(rows: CurriculumEnrollmentRecord[]): CurriculumCourseRow[] {
    return rows.map((row, index) => ({
        ...row,
        key: `${row.course_code || 'course'}-${index}`,
    }))
}

function buildCategoryTabs(
    categories: CurriculumDivisionCategory[],
    rows: CurriculumCourseRow[],
): CourseCategoryTab[] {
    const tabs: CourseCategoryTab[] = categories.map((category) => ({
        key: String(category.id),
        label: category.name_th,
    }))
    const existingLabels = new Set(tabs.map((tab) => tab.label))

    rows.forEach((row) => {
        const category = getCourseCategory(row)

        if (!existingLabels.has(category)) {
            existingLabels.add(category)
            tabs.push({
                key: `course-category-${tabs.length}`,
                label: category,
            })
        }
    })

    return tabs
}

function CourseTable({
    rows,
    loading,
}: {
    rows: CurriculumCourseRow[]
    loading: boolean
}) {
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

function buildSubCategoryItems(
    rows: CurriculumCourseRow[],
    loading: boolean,
) {
    const subCategoryRows = new Map<string, CurriculumCourseRow[]>()

    rows.forEach((row) => {
        const subCategory = row.course_sub_category || emptySubCategoryLabel
        const currentRows = subCategoryRows.get(subCategory) ?? []

        currentRows.push(row)
        subCategoryRows.set(subCategory, currentRows)
    })

    return Array.from(subCategoryRows, ([subCategory, groupedRows], index) => ({
        key: `course-sub-category-${index}`,
        label: subCategory,
        children: <CourseTable rows={groupedRows} loading={loading} />,
    }))
}

function CategoryCourses({
    rows,
    loading,
}: {
    rows: CurriculumCourseRow[]
    loading: boolean
}) {
    const hasSubCategories = rows.some((row) => row.course_sub_category)

    if (!hasSubCategories) {
        return <CourseTable rows={rows} loading={loading} />
    }

    return <Tabs items={buildSubCategoryItems(rows, loading)} destroyOnHidden />
}

export default function StudentCurriculumDetailSection({
    studentCode,
}: StudentCurriculumDetailSectionProps) {
    const [categories, setCategories] = useState<
        CurriculumDivisionCategory[]
    >([])
    const [rows, setRows] = useState<CurriculumCourseRow[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [loadingCourses, setLoadingCourses] = useState(false)

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true)
                const data = await getCurriculumDivisionCategories()
                setCategories(data)
            } catch (error) {
                console.error(error)
                message.error('โหลดหมวดรายวิชาไม่สำเร็จ')
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
                const importer =
                    enrollmentRows[`../data/enrollments/${studentCode}.json`]

                if (!importer) {
                    setRows([])
                    return
                }

                const module = await importer()
                const records = Array.isArray(module.default)
                    ? module.default
                    : []
                setRows(buildRows(records))
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

    const tabs = useMemo(
        () =>
            buildCategoryTabs(categories, rows).map((category) => ({
                key: category.key,
                label: category.label,
                children: (
                    <CategoryCourses
                        rows={rows.filter(
                            (row) => getCourseCategory(row) === category.label,
                        )}
                        loading={loadingCourses}
                    />
                ),
            })),
        [rows, categories, loadingCourses],
    )

    return (
        <Card
            title="รายละเอียดผลการเรียน"
            size="small"
            loading={loadingCategories}
        >
            <Tabs items={tabs} destroyOnHidden />
        </Card>
    )
}