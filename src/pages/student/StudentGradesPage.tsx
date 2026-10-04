import { Alert } from 'antd'
import StudentCurriculumDetailSection from '../../features/students/curriculum/StudentCurriculumDetailSection'
import StudentFailedPlannedCoursesSection from '../../features/students/curriculum/StudentFailedPlannedCoursesSection'
import { useCurrentStudent } from '../../hooks/useCurrentStudent'

export default function StudentGradesPage() {
    const { studentCode, studyPlanId } = useCurrentStudent()

    return (
        <div className="student-page student-performance-page">
            <div className="page-title-section">
                <div>
                    <h1>ผลการเรียน</h1>
                    <p>รายละเอียดผลการเรียนรายภาคการศึกษาและรายหมวดวิชา</p>
                </div>
            </div>

            <StudentFailedPlannedCoursesSection studentCode={studentCode} />
            {studyPlanId ? (
                <StudentCurriculumDetailSection
                    studentCode={studentCode}
                    studyPlanId={studyPlanId}
                />
            ) : (
                <Alert
                    type="warning"
                    showIcon
                    message="ไม่พบข้อมูลแผนการศึกษาของนิสิต"
                />
            )}
        </div>
    )
}
