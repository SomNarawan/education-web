import { Card, Checkbox, Empty, Select, Typography } from 'antd'
import type { CourseSource, PredictionCourse } from './gradeCalculator.types'

interface CourseSelectionCardProps {
    termLabel: string
    courses: PredictionCourse[]
    selectedCourseIds: string[]
    otherCourseIds: string[]
    onToggleCourse: (courseId: string, checked: boolean) => void
    onChangeOtherCourses: (courseIds: string[]) => void
}

const courseGroups: Array<{ source: CourseSource; title: string; description: string }> = [
    {
        source: 'backlog',
        title: 'วิชาคงค้าง',
        description: 'รายวิชาที่ยังไม่ผ่านหรือยังไม่มีผลการเรียน',
    },
    {
        source: 'next-semester',
        title: 'วิชาที่ต้องลงในเทอมถัดไป',
        description: 'เฉพาะรายวิชา subject ตามแผนการเรียน',
    },
]

export default function CourseSelectionCard({
    termLabel,
    courses,
    selectedCourseIds,
    otherCourseIds,
    onToggleCourse,
    onChangeOtherCourses,
}: CourseSelectionCardProps) {
    const otherCourseOptions = courses
        .filter(({ source }) => source === 'other')
        .map((course) => ({
            label: `${course.code} — ${course.name} (${course.credits} หน่วยกิต · ${course.reason})`,
            value: course.id,
        }))

    return (
        <Card className="grade-calculator-card" title={`วางแผนรายวิชา ${termLabel}`}>
            <div className="grade-course-groups">
                {courseGroups.map(({ source, title, description }) => {
                    const groupCourses = courses.filter((course) => course.source === source)

                    return (
                        <section
                            key={source}
                            className={`grade-course-group grade-course-group-${source}`}
                        >
                            <div className="grade-course-group-heading">
                                <h3>{title}</h3>
                                <span>{description}</span>
                            </div>
                            {groupCourses.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="ไม่พบรายวิชา"
                                />
                            ) : (
                                <div className="grade-course-choice-list">
                                    {groupCourses.map((course) => (
                                        <Checkbox
                                            key={course.id}
                                            checked={selectedCourseIds.includes(course.id)}
                                            onChange={(event) =>
                                                onToggleCourse(course.id, event.target.checked)
                                            }
                                        >
                                            <span className="grade-course-choice-content">
                                                <strong>
                                                    {course.code} — {course.name}
                                                </strong>
                                                <span>
                                                    {course.credits} หน่วยกิต · {course.reason}
                                                </span>
                                            </span>
                                        </Checkbox>
                                    ))}
                                </div>
                            )}
                        </section>
                    )
                })}
            </div>
            <div className="grade-other-course-field">
                <Typography.Text strong>เพิ่มวิชาอื่น</Typography.Text>
                <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    placeholder="ค้นหาและเลือกวิชาที่ยังไม่เคยเรียน"
                    value={otherCourseIds}
                    options={otherCourseOptions}
                    onChange={onChangeOtherCourses}
                />
            </div>
        </Card>
    )
}
