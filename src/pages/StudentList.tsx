import { Button, Input, Select, Space, message, Typography } from 'antd'
const { Text } = Typography
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import StudentTable from '../components/StudentTable'
import StudentFormModal from '../components/StudentFormModal'
import type { StudentFormValues } from '../types/StudentFormValues'
import type { StudentListResponse } from '../types/StudentListResponse'
import type { StudentDetailResponse } from '../types/StudentDetailResponse'
import { getStudentDetail, getStudentsByPage, createStudent, updateStudent, deleteStudent } from '../services/studentService'
import { getNoteTypes } from '../services/noteTypeService'

const DEFAULT_TEACHER_ID = 2
const DEFAULT_DEPARTMENT_ID = 16
const DEFAULT_FACULTY_ID = 24

type StudentGroup = 'advisor' | 'department' | 'faculty'
type StudentStatus = 'graduated' | undefined
type NoteSearchType = string | undefined

const OTHER_NOTE_VALUE = 'อื่นๆ'

export default function StudentList() {
    const { studentGroup, studentStatus } = useParams<{
        studentGroup?: StudentGroup
        studentStatus?: StudentStatus
    }>()

    const [students, setStudents] = useState<StudentListResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [dropdownLoading, setDropdownLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingStudent, setEditingStudent] =
        useState<StudentDetailResponse | null>(null)

    const [noteSearchType, setNoteSearchType] =
        useState<NoteSearchType>(undefined)
    const [noteSearchText, setNoteSearchText] = useState('')
    const [noteTypeOptions, setNoteTypeOptions] = useState<
        { label: string; value: string }[]
    >([])

    const [studentSearchText, setStudentSearchText] = useState('')
    const [hasFacultySearched, setHasFacultySearched] = useState(false)

    const currentStudentGroup: StudentGroup = studentGroup ?? 'advisor'
    const currentStudentStatus: StudentStatus =
        studentStatus === 'graduated' ? 'graduated' : undefined

    const isFacultyListPage =
        currentStudentGroup === 'faculty' && !currentStudentStatus

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

        if (
            currentStudentGroup === 'faculty' &&
            currentStudentStatus === 'graduated'
        ) {
            return 'รายชื่อนิสิตคณะที่จบ'
        }

        if (currentStudentGroup === 'faculty') {
            return 'รายชื่อนิสิตในคณะ'
        }

        if (currentStudentGroup === 'department') {
            return 'รายชื่อนิสิตภาควิชา'
        }

        return 'รายชื่อนิสิตในที่ปรึกษา'
    }, [currentStudentGroup, currentStudentStatus])

    const loadStudents = useCallback(
        async ({
            noteText,
            searchText,
        }: {
            noteText?: string
            searchText?: string
        } = {}) => {
            try {
                setLoading(true)

                const teacherId =
                    currentStudentGroup === 'advisor'
                        ? DEFAULT_TEACHER_ID
                        : undefined

                const departmentId =
                    currentStudentGroup === 'department'
                        ? DEFAULT_DEPARTMENT_ID
                        : undefined

                const facultyId =
                    currentStudentGroup === 'faculty'
                        ? DEFAULT_FACULTY_ID
                        : undefined

                const data = await getStudentsByPage(
                    currentStudentGroup,
                    currentStudentStatus,
                    teacherId,
                    departmentId,
                    facultyId,
                    noteText,
                    searchText,
                )

                setStudents(data)
            } catch (error) {
                console.error(error)
                message.error('โหลดข้อมูลนิสิตไม่สำเร็จ')
            } finally {
                setLoading(false)
            }
        },
        [currentStudentGroup, currentStudentStatus],
    )

    useEffect(() => {
        setNoteSearchType(undefined)
        setNoteSearchText('')
        setStudentSearchText('')
        setHasFacultySearched(false)
        setStudents([])

        if (!isFacultyListPage) {
            loadStudents()
        }
    }, [loadStudents, isFacultyListPage])

    useEffect(() => {
        if (isFacultyListPage) {
            return
        }

        const loadNoteTypes = async () => {
            try {
                const data = await getNoteTypes()

                setNoteTypeOptions([
                    ...data.map((item) => ({
                        label: item.note,
                        value: item.note,
                    })),
                ])
            } catch (error) {
                console.error(error)
                message.error('โหลดประเภท Note ไม่สำเร็จ')
            }
        }

        loadNoteTypes()
    }, [isFacultyListPage])

    const getNoteSearchValue = () => {
        if (!noteSearchType) {
            return undefined
        }

        if (noteSearchType === OTHER_NOTE_VALUE) {
            return noteSearchText.trim() || undefined
        }

        return noteSearchType
    }

    const handleSearchNote = () => {
        loadStudents({
            noteText: getNoteSearchValue(),
        })
    }

    const handleClearNoteSearch = () => {
        setNoteSearchType(undefined)
        setNoteSearchText('')
        loadStudents()
    }

    const handleSearchStudent = () => {
        const value = studentSearchText.trim()

        if (!value) {
            message.warning('กรุณากรอกคำค้นหา')
            return
        }

        setHasFacultySearched(true)

        loadStudents({
            searchText: value,
        })
    }

    const handleClearStudentSearch = () => {
        setStudentSearchText('')
        setHasFacultySearched(false)
        setStudents([])
    }

    const openAddModal = () => {
        setEditingStudent(null)
        setIsModalOpen(true)
    }

    const openEditModal = async (id: number) => {
        try {
            setDropdownLoading(true)

            const detail = await getStudentDetail(id)

            setEditingStudent(detail)
            setIsModalOpen(true)
        } catch (error) {
            console.error(error)
            message.error('โหลดข้อมูลนิสิตสำหรับแก้ไขไม่สำเร็จ')
        } finally {
            setDropdownLoading(false)
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingStudent(null)
    }

    const handleSave = async (values: StudentFormValues) => {
        try {
            setDropdownLoading(true)

            if (editingStudent) {
                await updateStudent(editingStudent.id, values)
            } else {
                await createStudent(values)
            }

            message.success(
                editingStudent
                    ? 'แก้ไขข้อมูลนิสิตสำเร็จ'
                    : 'เพิ่มข้อมูลนิสิตสำเร็จ',
            )

            closeModal()

            if (isFacultyListPage && hasFacultySearched) {
                await loadStudents({
                    searchText: studentSearchText.trim() || undefined,
                })
                return
            }

            await loadStudents({
                noteText: getNoteSearchValue(),
            })
        } catch (error) {
            console.error(error)
            message.error(
                editingStudent
                    ? 'แก้ไขข้อมูลนิสิตไม่สำเร็จ'
                    : 'เพิ่มข้อมูลนิสิตไม่สำเร็จ',
            )
        } finally {
            setDropdownLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            setDropdownLoading(true)
            await deleteStudent(id)
            setStudents((prev) => prev.filter((item) => item.id !== id))
            message.success('ลบข้อมูลนิสิตสำเร็จ')
        } catch (error) {
            console.error(error)
            message.error('ลบข้อมูลนิสิตไม่สำเร็จ')
        } finally {
            setDropdownLoading(false)
        }
    }

    return (
        <div className="student-page">
            <div className="page-title-section">
                <div>
                    <h1>{pageTitle}</h1>
                    <p>จัดการข้อมูลนิสิต และดูรายละเอียด</p>
                </div>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAddModal}
                >
                    เพิ่มนิสิต
                </Button>
            </div>

            {isFacultyListPage ? (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 24,
                        background: '#ffffff',
                        borderRadius: 12,
                        border: '1px solid #f0f0f0',
                    }}
                >
                    <div
                        style={{
                            textAlign: 'center',
                            marginBottom: 20,
                        }}
                    >
                        <Text strong style={{ fontSize: 18 }}>
                            ค้นหานิสิตในคณะจากรหัสนิสิต / ชื่อ-นามสกุล / เลขบัตรประชาชน
                        </Text>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <Input
                            allowClear
                            size="large"
                            placeholder="ค้นหาจากรหัสนิสิต / ชื่อ-นามสกุล / เลขบัตรประชาชน"
                            value={studentSearchText}
                            onChange={(e) =>
                                setStudentSearchText(e.target.value)
                            }
                            onPressEnter={handleSearchStudent}
                            style={{
                                width: '100%',
                            }}
                        />
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 12,
                        }}
                    >
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            size="large"
                            onClick={handleSearchStudent}
                        >
                            ค้นหา
                        </Button>

                        <Button
                            size="large"
                            onClick={handleClearStudentSearch}
                        >
                            ล้างค่า
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        marginBottom: 16,
                        padding: 16,
                        background: '#ffffff',
                        borderRadius: 12,
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                    }}
                >
                    <Text strong>ค้นหาด้วย Note</Text>

                    <Space wrap>
                        <Select
                            allowClear
                            showSearch
                            placeholder="เลือกประเภท Note"
                            value={noteSearchType}
                            options={noteTypeOptions}
                            style={{ width: 240 }}
                            onChange={(value) => {
                                setNoteSearchType(value)

                                if (value !== OTHER_NOTE_VALUE) {
                                    setNoteSearchText('')
                                }
                            }}
                        />

                        {noteSearchType === OTHER_NOTE_VALUE && (
                            <Input
                                allowClear
                                placeholder="กรอกรายละเอียด Note"
                                value={noteSearchText}
                                style={{ width: 300 }}
                                onChange={(e) =>
                                    setNoteSearchText(e.target.value)
                                }
                                onPressEnter={handleSearchNote}
                            />
                        )}

                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearchNote}
                        >
                            ค้นหา
                        </Button>

                        <Button onClick={handleClearNoteSearch}>
                            ล้างค่า
                        </Button>
                    </Space>
                </div>
            )}

            {(!isFacultyListPage || hasFacultySearched) && (
                <div className="table-card">
                    <StudentTable
                        students={students}
                        loading={loading}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                        studentGroup={currentStudentGroup}
                        studentStatus={currentStudentStatus}
                    />
                </div>
            )}

            <StudentFormModal
                open={isModalOpen}
                loading={dropdownLoading}
                editingStudent={editingStudent}
                onCancel={closeModal}
                onSave={handleSave}
            />
        </div>
    )
}