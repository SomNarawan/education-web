import type { DataNode } from 'antd/es/tree'
import type { CurriculumCourseRow } from '../../../types/CurriculumDetail'

export interface StudentCurriculumDetailSectionProps {
    studentCode: string
    studyPlanId: number
}

export interface CourseTableProps {
    rows: CurriculumCourseRow[]
    loading: boolean
}

export interface CurriculumTreeData {
    nodes: DataNode[]
    rowKeysByNode: Map<number, Set<string>>
    pathByNode: Map<number, string[]>
    generalEducationId?: number
}

export interface TreeSelection {
    studentCode: string
    categoryId: number
}
