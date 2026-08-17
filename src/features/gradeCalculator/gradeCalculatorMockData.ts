export type CourseSource = 'backlog' | 'next-semester' | 'other'

export interface SemesterAcademicResult {
    id: string
    academicYear: number
    semester: number
    credits: number
    gpa: number
}

export interface StudentAcademicProfile {
    studentCode: string
    fullName: string
    curriculumName: string
    semesterResults: SemesterAcademicResult[]
}

export interface PredictionCourse {
    code: string
    name: string
    credits: number
    source: CourseSource
    reason: string
}

export interface CalculationHistoryCourse {
    code: string
    name: string
    credits: number
    grade: string
}

export interface GradeCalculationHistory {
    id: number
    studentCode: string
    academicYear: number
    semester: number
    previousGpa: number
    predictedTermGpa: number
    predictedCumulativeGpa: number
    calculatedAt: string
    calculatedBy: string
    courses: CalculationHistoryCourse[]
}

export const mockStudentProfiles: StudentAcademicProfile[] = [
    {
        studentCode: '66160001',
        fullName: 'นายกิตติพงษ์ ใจดี',
        curriculumName: 'วิทยาการคอมพิวเตอร์',
        semesterResults: [
            { id: '66160001-1', academicYear: 2566, semester: 1, credits: 18, gpa: 3.25 },
            { id: '66160001-2', academicYear: 2566, semester: 2, credits: 21, gpa: 3.42 },
            { id: '66160001-3', academicYear: 2567, semester: 1, credits: 18, gpa: 2.88 },
            { id: '66160001-4', academicYear: 2567, semester: 2, credits: 18, gpa: 3.1 },
        ],
    },
    {
        studentCode: '66160002',
        fullName: 'นางสาวพิมพ์ชนก แสงทอง',
        curriculumName: 'วิทยาการคอมพิวเตอร์',
        semesterResults: [
            { id: '66160002-1', academicYear: 2566, semester: 1, credits: 19, gpa: 3.58 },
            { id: '66160002-2', academicYear: 2566, semester: 2, credits: 20, gpa: 3.61 },
            { id: '66160002-3', academicYear: 2567, semester: 1, credits: 18, gpa: 3.44 },
            { id: '66160002-4', academicYear: 2567, semester: 2, credits: 21, gpa: 3.7 },
        ],
    },
]

export const mockPredictionCourses: PredictionCourse[] = [
    { code: 'CS211', name: 'โครงสร้างข้อมูลและขั้นตอนวิธี', credits: 3, source: 'backlog', reason: 'ผลการเรียนเดิม F' },
    { code: 'MA212', name: 'คณิตศาสตร์เต็มหน่วย', credits: 3, source: 'backlog', reason: 'ถอนรายวิชาในภาคการศึกษาที่ผ่านมา' },
    { code: 'CS311', name: 'ระบบฐานข้อมูล', credits: 3, source: 'next-semester', reason: 'รายวิชาตามแผนชั้นปีที่ 3' },
    { code: 'CS312', name: 'ระบบปฏิบัติการ', credits: 3, source: 'next-semester', reason: 'รายวิชาตามแผนชั้นปีที่ 3' },
    { code: 'CS313', name: 'วิศวกรรมซอฟต์แวร์', credits: 3, source: 'next-semester', reason: 'รายวิชาตามแผนชั้นปีที่ 3' },
    { code: 'GE301', name: 'ภาษาอังกฤษเพื่อการทำงาน', credits: 3, source: 'next-semester', reason: 'รายวิชาศึกษาทั่วไปตามแผน' },
    { code: 'CS321', name: 'เครือข่ายคอมพิวเตอร์', credits: 3, source: 'other', reason: 'รายวิชาเลือก' },
    { code: 'CS322', name: 'ปัญญาประดิษฐ์เบื้องต้น', credits: 3, source: 'other', reason: 'รายวิชาเลือก' },
    { code: 'CS323', name: 'การพัฒนาเว็บแอปพลิเคชัน', credits: 3, source: 'other', reason: 'รายวิชาเลือก' },
]

export const gradeOptions = [
    { label: 'A', value: 'A', points: 4 },
    { label: 'B+', value: 'B+', points: 3.5 },
    { label: 'B', value: 'B', points: 3 },
    { label: 'C+', value: 'C+', points: 2.5 },
    { label: 'C', value: 'C', points: 2 },
    { label: 'D+', value: 'D+', points: 1.5 },
    { label: 'D', value: 'D', points: 1 },
    { label: 'F', value: 'F', points: 0 },
]

export const mockCalculationHistories: GradeCalculationHistory[] = [
    {
        id: 1,
        studentCode: '66160001',
        academicYear: 2568,
        semester: 1,
        previousGpa: 3.17,
        predictedTermGpa: 3.42,
        predictedCumulativeGpa: 3.22,
        calculatedAt: '2026-07-18 10:25:00',
        calculatedBy: 'อาจารย์สมชาย ใจดี',
        courses: [
            { code: 'CS211', name: 'โครงสร้างข้อมูลและขั้นตอนวิธี', credits: 3, grade: 'B+' },
            { code: 'MA212', name: 'คณิตศาสตร์เต็มหน่วย', credits: 3, grade: 'B' },
            { code: 'CS311', name: 'ระบบฐานข้อมูล', credits: 3, grade: 'A' },
            { code: 'CS312', name: 'ระบบปฏิบัติการ', credits: 3, grade: 'B+' },
        ],
    },
    {
        id: 2,
        studentCode: '66160001',
        academicYear: 2568,
        semester: 1,
        previousGpa: 3.17,
        predictedTermGpa: 3.08,
        predictedCumulativeGpa: 3.15,
        calculatedAt: '2026-07-10 14:40:00',
        calculatedBy: 'อาจารย์สมหญิง รักษ์ดี',
        courses: [
            { code: 'CS211', name: 'โครงสร้างข้อมูลและขั้นตอนวิธี', credits: 3, grade: 'B' },
            { code: 'CS311', name: 'ระบบฐานข้อมูล', credits: 3, grade: 'B+' },
            { code: 'CS312', name: 'ระบบปฏิบัติการ', credits: 3, grade: 'C+' },
            { code: 'GE301', name: 'ภาษาอังกฤษเพื่อการทำงาน', credits: 3, grade: 'B' },
        ],
    },
    {
        id: 3,
        studentCode: '66160002',
        academicYear: 2568,
        semester: 1,
        previousGpa: 3.59,
        predictedTermGpa: 3.75,
        predictedCumulativeGpa: 3.62,
        calculatedAt: '2026-07-21 09:15:00',
        calculatedBy: 'อาจารย์สมชาย ใจดี',
        courses: [
            { code: 'CS311', name: 'ระบบฐานข้อมูล', credits: 3, grade: 'A' },
            { code: 'CS312', name: 'ระบบปฏิบัติการ', credits: 3, grade: 'A' },
            { code: 'CS313', name: 'วิศวกรรมซอฟต์แวร์', credits: 3, grade: 'B+' },
            { code: 'GE301', name: 'ภาษาอังกฤษเพื่อการทำงาน', credits: 3, grade: 'B+' },
        ],
    },
]
