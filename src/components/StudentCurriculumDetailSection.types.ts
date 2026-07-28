import type { DataNode } from 'antd/es/tree'
import type {
    CurriculumCourseRow,
    CurriculumEnrollmentRecord,
} from '../types/CurriculumDetail'

export interface StudentCurriculumDetailSectionProps {
    studentCode: string
}

export type EnrollmentRowsModule = {
    default: CurriculumEnrollmentRecord[]
}

export interface CourseTableProps {
    rows: CurriculumCourseRow[]
    loading: boolean
}

export interface CurriculumTreeData {
    nodes: DataNode[]
    rowKeysByNode: Map<string, Set<string>>
    pathByNode: Map<string, string[]>
    generalEducationKey?: string
}

export interface TreeSelection {
    studentCode: string
    key: string
}
