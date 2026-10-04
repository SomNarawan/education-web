import { Empty } from 'antd'
import StudentCourseGroupPerformanceSection from '../../features/students/performance/StudentCourseGroupPerformanceSection'
import StudentSemesterPerformanceSection from '../../features/students/performance/StudentSemesterPerformanceSection'
import { useStudentPerformance } from '../../features/students/performance/useStudentPerformance'
import { useCurrentStudent } from '../../hooks/useCurrentStudent'

export default function StudentHomePage() {
    const { studentCode } = useCurrentStudent()
    const {
        creditStatuses,
        semesterRows,
        courseGroupDatasets,
        loading,
    } = useStudentPerformance(studentCode)
    const hasPerformanceData =
        semesterRows.length > 0 || courseGroupDatasets.length > 0

    return (
        <div className="student-page student-performance-page">
            <div className="page-title-section">
                <div>
                    <h1>หน้าหลัก</h1>
                    <p>ภาพรวมผลการเรียนและความก้าวหน้าของนิสิต</p>
                </div>
            </div>

            {!loading && !hasPerformanceData ? (
                <Empty description="ไม่พบข้อมูลสำหรับแสดงกราฟผลการเรียน" />
            ) : (
                <>
                    <StudentSemesterPerformanceSection
                        creditStatuses={creditStatuses}
                        rows={semesterRows}
                        loading={loading}
                        display="all"
                    />
                    <StudentCourseGroupPerformanceSection
                        datasets={courseGroupDatasets}
                        loading={loading}
                        display="all"
                    />
                </>
            )}
        </div>
    )
}
