import { Tag, Typography } from 'antd'
import type { CourseSource, PredictionCourse } from './gradeCalculator.types'

const sourceLabels: Record<CourseSource, { label: string; color: string }> = {
    backlog: { label: 'วิชาคงค้าง', color: 'error' },
    'next-semester': { label: 'วิชาที่ต้องลง', color: 'processing' },
    other: { label: 'วิชาอื่น', color: 'default' },
}

export function CourseSourceTag({ source }: { source: CourseSource }) {
    const { label, color } = sourceLabels[source]

    return <Tag color={color}>{label}</Tag>
}

export function CourseGroupPerformance({
    courseGroup,
    courseGroupGpa,
}: Pick<PredictionCourse, 'courseGroup' | 'courseGroupGpa'>) {
    if (!courseGroup) return '-'

    return (
        <span className="grade-course-group-performance">
            <span>{courseGroup}</span>
            <Typography.Text type="secondary">
                เกรดเฉลี่ย{' '}
                {courseGroupGpa == null ? '-' : courseGroupGpa.toFixed(2)}
            </Typography.Text>
        </span>
    )
}
