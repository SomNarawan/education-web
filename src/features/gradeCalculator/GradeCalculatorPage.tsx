import { HistoryOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Select, Typography } from 'antd'
import { useState } from 'react'
import GradeCalculationHistoryModal from '../gradeCalculationHistory/GradeCalculationHistoryPage'
import AcademicOverviewCard from './AcademicOverviewCard'
import CourseSelectionCard from './CourseSelectionCard'
import GradeCalculationResultModal from './GradeCalculationResultModal'
import SelectedCoursesCard from './SelectedCoursesCard'
import { useGradeCalculator } from './useGradeCalculator'

const { Text } = Typography

export default function GradeCalculatorPage() {
    const {
        isStudent,
        studentOptions,
        selectedStudentId,
        selectedStudent,
        overview,
        predictionCourses,
        selectedCourses,
        selectedCourseIds,
        otherCourseIds,
        predictionTerm,
        predictedTermLabel,
        currentGpax,
        hasMissingSections,
        loadingStudents,
        loadingOverview,
        loadingLatestCalculation,
        savingCalculation,
        gradeForm,
        calculationResult,
        calculationSaved,
        resultOpen,
        canLoadLatest,
        selectStudent,
        resetPrediction,
        toggleCourse,
        changeOtherCourses,
        loadLatestCalculation,
        calculate,
        clearCalculation,
        closeResult,
    } = useGradeCalculator()
    const [historyOpen, setHistoryOpen] = useState(false)
    const studentLabel = selectedStudent
        ? `${selectedStudent.studentCode} — ${selectedStudent.fullName}`
        : '-'

    return (
        <div className="student-page grade-calculator-page">
            <div className="page-title-section">
                <div>
                    <h1>คำนวณผลการเรียน</h1>
                    <p>
                        ทดลองวางแผนรายวิชาและเกรดเพื่อประมาณการ GPA และ GPAX
                        ในภาคการศึกษาถัดไป
                    </p>
                </div>
                <Button
                    icon={<HistoryOutlined />}
                    disabled={!selectedStudentId}
                    onClick={() => setHistoryOpen(true)}
                >
                    ดูประวัติ
                </Button>
            </div>

            <Card
                className="grade-calculator-card"
                title="ข้อมูลสำหรับคำนวณ"
                loading={loadingStudents}
            >
                <div className="grade-calculator-controls">
                    <label>
                        <Text strong>นิสิต</Text>
                        {isStudent ? (
                            <Text className="grade-calculator-readonly-value">
                                {selectedStudent ? studentLabel : 'ไม่พบข้อมูลนิสิต'}
                            </Text>
                        ) : (
                            <Select
                                showSearch
                                optionFilterProp="label"
                                value={selectedStudentId}
                                placeholder="ค้นหาและเลือกนิสิต"
                                options={studentOptions.map((student) => ({
                                    label: `${student.studentCode} — ${student.fullName}`,
                                    value: student.id,
                                }))}
                                onChange={selectStudent}
                            />
                        )}
                    </label>
                    <label>
                        <Text strong>ชั้นปีที่คาดการณ์</Text>
                        <Text className="grade-calculator-readonly-value">
                            {predictionTerm ? `ชั้นปี ${predictionTerm.year}` : '-'}
                        </Text>
                    </label>
                    <label>
                        <Text strong>ภาคการเรียนที่คาดการณ์</Text>
                        <Text className="grade-calculator-readonly-value">
                            {predictionTerm?.semester ?? '-'}
                        </Text>
                    </label>
                </div>
            </Card>

            {!loadingStudents && !selectedStudentId && (
                <Alert
                    type="warning"
                    showIcon
                    message="ไม่พบข้อมูลนิสิตสำหรับคำนวณผลการเรียน"
                />
            )}

            <AcademicOverviewCard
                overview={overview}
                loading={loadingOverview}
                hasMissingSections={hasMissingSections}
            />

            {overview && (
                <>
                    <CourseSelectionCard
                        termLabel={predictedTermLabel}
                        courses={predictionCourses}
                        selectedCourseIds={selectedCourseIds}
                        otherCourseIds={otherCourseIds}
                        onToggleCourse={toggleCourse}
                        onChangeOtherCourses={changeOtherCourses}
                    />
                    <SelectedCoursesCard
                        courses={selectedCourses}
                        form={gradeForm}
                        canLoadLatest={canLoadLatest}
                        loadingLatest={loadingLatestCalculation}
                        saving={savingCalculation}
                        onLoadLatest={loadLatestCalculation}
                        onReset={resetPrediction}
                        onCalculate={calculate}
                        onRemove={(courseId) => toggleCourse(courseId, false)}
                        onGradeChange={clearCalculation}
                    />
                </>
            )}

            {calculationResult && (
                <GradeCalculationResultModal
                    result={calculationResult}
                    open={resultOpen}
                    saved={calculationSaved}
                    termLabel={predictedTermLabel}
                    currentGpax={currentGpax}
                    onClose={closeResult}
                />
            )}

            <GradeCalculationHistoryModal
                open={historyOpen}
                studentId={selectedStudentId}
                studentLabel={studentLabel}
                onClose={() => setHistoryOpen(false)}
            />
        </div>
    )
}
