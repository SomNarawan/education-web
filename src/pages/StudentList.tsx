import { Button, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import StudentTable from '../components/StudentTable'
import StudentFormModal from '../components/StudentFormModal'
import type { Student, StudentFormValues } from '../types/student'
import { getStudentsByPage } from '../services/studentService'
import {
    getMasterData,
    type MasterData,
} from '../services/masterDataCache'

export default function StudentList() {
    const { studentGroup, studentStatus } = useParams<{
        studentGroup?: string
        studentStatus?: string
    }>()

    const [students, setStudents] = useState<Student[]>([])
    const [masterData, setMasterData] = useState<MasterData | null>(null)
    const [loading, setLoading] = useState(false)
    const [dropdownLoading, setDropdownLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)

    const currentStudentGroup = studentGroup ?? 'advisor'
    const currentStudentStatus = studentStatus

    const pageTitle = useMemo(() => {
        if (
            currentStudentGroup === 'advisor' &&
            currentStudentStatus === 'graduated'
        ) {
            return 'รายชื่อนิสิตที่ปรึกษาที่จบ'
        }

        if (
            currentStudentGroup === 'department' &&
            currentStudentStatus === 'graduated'
        ) {
            return 'รายชื่อนิสิตภาควิชาที่จบ'
        }

        if (currentStudentGroup === 'faculty') {
            return 'รายชื่อนิสิตในคณะ'
        }

        if (currentStudentGroup === 'department') {
            return 'รายชื่อนิสิตภาควิชา'
        }

        return 'รายชื่อนิสิตในที่ปรึกษา'
    }, [currentStudentGroup, currentStudentStatus])

    useEffect(() => {
        loadStudents()
    }, [currentStudentGroup, currentStudentStatus])

    useEffect(() => {
        loadDropdowns()
    }, [])

    const loadStudents = async () => {
        try {
            setLoading(true)

            const data = await getStudentsByPage(
                currentStudentGroup,
                currentStudentStatus,
                1,
            )

            setStudents(data)
        } catch {
            message.error('โหลดข้อมูลนิสิตไม่สำเร็จ')
        } finally {
            setLoading(false)
        }
    }

    const loadDropdowns = async () => {
        try {
            setDropdownLoading(true)

            const data = await getMasterData()

            setMasterData(data)
        } catch {
            message.error('โหลดข้อมูล dropdown ไม่สำเร็จ')
        } finally {
            setDropdownLoading(false)
        }
    }

    const openAddModal = () => {
        setEditingStudent(null)
        setIsModalOpen(true)
    }

    const openEditModal = (student: Student) => {
        setEditingStudent(student)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingStudent(null)
    }

    const handleSave = async (values: StudentFormValues) => {
        const savedStudent = buildStudent(values)

        if (editingStudent) {
            setStudents((prev) =>
                prev.map((item) =>
                    item.id === editingStudent.id ? savedStudent : item,
                ),
            )
            message.success('แก้ไขข้อมูลนิสิตสำเร็จ')
        } else {
            setStudents((prev) => [...prev, savedStudent])
            message.success('เพิ่มข้อมูลนิสิตสำเร็จ')
        }

        closeModal()
    }

    const buildStudent = (values: StudentFormValues): Student => {
        const selectedStudyPlan =
            masterData?.studyPlans.find((item) => item.id === values.study_plan_id) ??
            editingStudent?.study_plan ??
            null

        return {
            id: editingStudent?.id ?? Date.now(),

            student_code: values.student_code,

            title_id: values.title_id ?? editingStudent?.title_id ?? 0,
            teacher_id: values.teacher_id ?? editingStudent?.teacher_id ?? 0,
            student_status_id:
                values.student_status_id ?? editingStudent?.student_status_id ?? 0,
            admission_channel_id:
                values.admission_channel_id ??
                editingStudent?.admission_channel_id ??
                0,
            high_school_id:
                values.high_school_id ?? editingStudent?.high_school_id ?? 0,
            affiliation_id:
                values.affiliation_id ?? editingStudent?.affiliation_id ?? 0,
            study_plan_id:
                values.study_plan_id ?? editingStudent?.study_plan_id ?? 0,

            department_id:
                selectedStudyPlan?.curriculum?.department_id ??
                editingStudent?.department_id ??
                0,

            faculty_id:
                selectedStudyPlan?.curriculum?.department?.faculty?.id ??
                editingStudent?.faculty_id ??
                0,

            campus_id: editingStudent?.campus_id ?? 0,

            first_name_th: values.first_name_th,
            last_name_th: values.last_name_th,
            first_name_en: values.first_name_en ?? '',
            last_name_en: values.last_name_en ?? '',

            phone: values.phone ?? '',
            email: values.email ?? '',
            entry_year: values.entry_year ?? '',
            gpa: String(values.gpa ?? ''),

            earned_credits: values.earned_credits ?? 0,
            required_credits:
                values.required_credits ??
                selectedStudyPlan?.curriculum?.total_credits_min ??
                editingStudent?.required_credits ??
                0,

            guardian_title_id:
                values.guardian_title_id ??
                editingStudent?.guardian_title_id ??
                null,
            guardian_first_name_th:
                values.guardian_first_name_th ??
                editingStudent?.guardian_first_name_th ??
                null,
            guardian_last_name_th:
                values.guardian_last_name_th ??
                editingStudent?.guardian_last_name_th ??
                null,
            guardian_relationship_id:
                values.guardian_relationship_id ??
                editingStudent?.guardian_relationship_id ??
                null,
            guardian_phone:
                values.guardian_phone ?? editingStudent?.guardian_phone ?? null,

            created_at: editingStudent?.created_at ?? '',
            updated_at: editingStudent?.updated_at ?? '',
            deleted_at: null,
            is_deleted: 0,

            title:
                masterData?.titles.find((item) => item.id === values.title_id) ??
                editingStudent?.title ??
                null,

            teacher:
                masterData?.teachers.find((item) => item.id === values.teacher_id) ??
                editingStudent?.teacher ??
                null,

            student_status:
                masterData?.studentStatuses.find(
                    (item) => item.id === values.student_status_id,
                ) ??
                editingStudent?.student_status ??
                null,

            admission_channel:
                masterData?.admissionChannels.find(
                    (item) => item.id === values.admission_channel_id,
                ) ??
                editingStudent?.admission_channel ??
                null,

            high_school:
                masterData?.highSchools.find(
                    (item) => item.id === values.high_school_id,
                ) ??
                editingStudent?.high_school ??
                null,

            affiliation:
                masterData?.affiliations.find(
                    (item) => item.id === values.affiliation_id,
                ) ??
                editingStudent?.affiliation ??
                null,

            study_plan: selectedStudyPlan,

            campus: editingStudent?.campus ?? null,

            guardian_title:
                masterData?.titles.find(
                    (item) => item.id === values.guardian_title_id,
                ) ??
                editingStudent?.guardian_title ??
                null,

            guardian_relationship:
                masterData?.guardianRelationships.find(
                    (item) => item.id === values.guardian_relationship_id,
                ) ??
                editingStudent?.guardian_relationship ??
                null,
        }
    }

    const handleDelete = (id: number) => {
        setStudents((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, is_deleted: 1 } : item,
            ),
        )

        message.success('ลบข้อมูลนิสิตสำเร็จ')
    }

    const activeStudents = students.filter((item) => item.is_deleted === 0)

    return (
        <div className="student-page">
            <div className="page-title-section">
                <div>
                    <h1>{pageTitle}</h1>
                    <p>จัดการข้อมูลนิสิต เพิ่ม ลบ แก้ไข และดูรายละเอียด</p>
                </div>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAddModal}
                >
                    เพิ่มนิสิต
                </Button>
            </div>

            <div className="table-card">
                <StudentTable
                    students={activeStudents}
                    loading={loading}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    studentGroup={currentStudentGroup}
                    studentStatus={currentStudentStatus}
                />
            </div>

            <StudentFormModal
                open={isModalOpen}
                loading={dropdownLoading}
                editingStudent={editingStudent}
                masterData={masterData}
                onCancel={closeModal}
                onSave={handleSave}
            />
        </div>
    )
}