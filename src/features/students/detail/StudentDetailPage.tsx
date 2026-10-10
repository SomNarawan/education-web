import {
    Alert,
    Button,
    Card,
    Col,
    Form,
    Row,
    Skeleton,
    message,
} from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { StudentDetailResponse } from '../../../types/StudentDetailResponse'
import {
    getStudentDetail,
    resetStudentGrades,
} from '../../../services/studentService'
import { createNote } from '../../../services/noteService'
import { getNoteTypes } from '../../../services/listOfValueService'
import NoteHistoryModal from '../notes/NoteHistoryModal'
import StudentSemesterPerformanceSection from '../performance/StudentSemesterPerformanceSection'
import StudentCourseGroupPerformanceSection from '../performance/StudentCourseGroupPerformanceSection'
import StudentFailedPlannedCoursesSection from '../curriculum/StudentFailedPlannedCoursesSection'
import StudentCurriculumDetailSection from '../curriculum/StudentCurriculumDetailSection'
import { useStudentPerformance } from '../performance/useStudentPerformance'
import { useStudentNotes } from '../notes/useStudentNotes'
import DetailItem from '../../../components/custom/DetailItem'
import ListOfValueSelect from '../../../components/custom/ListOfValueSelect'
import type { ListOfValue } from '../../../types/ListOfValue'
import { toListOfValueOptions } from '../../../utils/listOfValue'
import { useAuth } from '../../../hooks/useAuth'
import ResetStudentGradesModal from './ResetStudentGradesModal'
import type { ResetStudentGradesSelection } from './ResetStudentGradesModal'
import { OTHER_NOTE_NAME } from '../notes/noteConstants'

interface NoteFormValues {
    note_type_id: number
    remark?: string
}

export default function StudentDetailPage() {
    const { id } = useParams()
    const { currentRole } = useAuth()

    const [student, setStudent] = useState<StudentDetailResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [resetGradesOpen, setResetGradesOpen] = useState(false)
    const [resettingGrades, setResettingGrades] = useState(false)
    const [gradeDataVersion, setGradeDataVersion] = useState(0)

    const [noteForm] = Form.useForm<NoteFormValues>()
    const [noteTypes, setNoteTypes] = useState<ListOfValue[]>([])
    const [noteTypesLoading, setNoteTypesLoading] = useState(false)
    const [noteTypesError, setNoteTypesError] = useState<string | null>(null)
    const [savingNote, setSavingNote] = useState(false)

    const [noteHistoryOpen, setNoteHistoryOpen] = useState(false)
    const {
        notes,
        loading: loadingNotes,
        loadNotes,
        removeNote,
    } = useStudentNotes(student?.id)
    const {
        creditStatuses,
        semesterRows,
        courseGroupDatasets,
        loading: loadingPerformance,
    } = useStudentPerformance(
        student?.student_code ?? '',
        gradeDataVersion,
    )

    const noteTypeId = Form.useWatch('note_type_id', noteForm)
    const selectedNoteType = noteTypes.find(
        (noteType) => noteType.id === noteTypeId
    )

    const isOtherNoteType = selectedNoteType?.name_th === OTHER_NOTE_NAME

    const creditSummary = student
        ? [
              student.required_credits,
              student.passed_credits,
              student.not_passed_credits,
              student.overed_credits,
          ]
              .map((credit) => credit ?? '-')
              .join('/')
        : '-'

    const loadNoteTypes = useCallback(async () => {
        try {
            setNoteTypesLoading(true)
            setNoteTypesError(null)
            const data = await getNoteTypes()
            setNoteTypes(data)
        } catch (error) {
            console.error(error)
            const errorMessage = 'โหลดประเภท Note ไม่สำเร็จ'
            setNoteTypesError(errorMessage)
            message.error(errorMessage)
        } finally {
            setNoteTypesLoading(false)
        }
    }, [])

    const loadStudent = useCallback(async () => {
        try {
            setLoading(true)

            const studentId = Number(id)

            if (!id || Number.isNaN(studentId)) {
                message.error('รหัสนิสิตไม่ถูกต้อง')
                setStudent(null)
                return
            }

            const student = await getStudentDetail(studentId)
            setStudent(student)
        } catch (error) {
            console.error(error)
            message.error('โหลดข้อมูลนิสิตไม่สำเร็จ')
            setStudent(null)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadStudent()
        loadNoteTypes()
    }, [loadNoteTypes, loadStudent])

    const handleOpenNoteHistory = async () => {
        if (!student?.id) {
            message.error('ไม่พบข้อมูลนิสิต')
            return
        }

        setNoteHistoryOpen(true)
        await loadNotes()
    }

    const handleAddNote = async () => {
        if (!student?.id) {
            message.error('ไม่พบข้อมูลนิสิต')
            return
        }

        let values: NoteFormValues

        try {
            values = await noteForm.validateFields()
        } catch {
            return
        }

        try {
            setSavingNote(true)

            await createNote({
                student_id: student.id,
                note_type_id: values.note_type_id,
                remark: isOtherNoteType ? values.remark?.trim() : null,
            })

            message.success('บันทึก Note สำเร็จ')
            noteForm.resetFields()

            if (noteHistoryOpen) {
                await loadNotes()
            }
        } catch (error) {
            console.error(error)
            message.error('บันทึก Note ไม่สำเร็จ')
        } finally {
            setSavingNote(false)
        }
    }

    const handleDeleteNote = async (id: number) => {
        await removeNote(id)
    }

    const handleResetGrades = async (
        selection: ResetStudentGradesSelection,
    ): Promise<boolean> => {
        if (!student?.student_code) {
            message.error('ไม่พบรหัสนิสิต')
            return false
        }

        try {
            setResettingGrades(true)
            const result = await resetStudentGrades(
                student.student_code,
                selection.scope === 'all'
                    ? { scope: 'all' }
                    : {
                          scope: 'semester',
                          study_year: selection.studyYear,
                          semester: selection.semester,
                      },
            )

            if (result.reset_count > 0) {
                message.success(
                    `รีเซ็ตผลการเรียนสำเร็จ ${result.reset_count} รายการ`,
                )
            } else {
                message.warning('ไม่พบผลการเรียนในปีและเทอมที่เลือก')
            }

            setResetGradesOpen(false)
            setGradeDataVersion((version) => version + 1)
            await loadStudent()
            return true
        } catch (error) {
            console.error('Unable to reset student grades', error)
            message.error('รีเซ็ตผลการเรียนไม่สำเร็จ')
            return false
        } finally {
            setResettingGrades(false)
        }
    }

    return (
        <Card
            title={
                student
                    ? [student.student_code, student.full_name_th]
                          .filter(Boolean)
                          .join(' ')
                    : ''
            }
            extra={
                currentRole === 'admin' && student?.student_code ? (
                    <Button
                        danger
                        icon={<ReloadOutlined />}
                        onClick={() => setResetGradesOpen(true)}
                    >
                        รีเซ็ตผลการเรียน
                    </Button>
                ) : null
            }
        >
            <Skeleton loading={loading} active paragraph={{ rows: 16 }}>
                {student && (
                    <>
                        <Row gutter={[16, 16]}>
                            <Col xs={24}>
                                <Card title="ข้อมูลนิสิต" size="small">
                                    <Row gutter={[48, 8]}>
                                        <Col xs={24} md={12}>
                                            <DetailItem
                                                label="ชื่อ-นามสกุล ภาษาอังกฤษ"
                                                value={student.full_name_en}
                                            />
                                            <DetailItem
                                                label="เบอร์โทรศัพท์"
                                                value={student.phone}
                                            />
                                            <DetailItem
                                                label="อีเมล"
                                                value={student.email}
                                            />
                                            <DetailItem
                                                label="ปีเข้าเรียน"
                                                value={`${student.entry_year}/${student.entry_year_be}`}
                                            />
                                            <DetailItem
                                                label="ชั้นปี"
                                                value={student.study_period}
                                            />
                                            <DetailItem
                                                label="อาจารย์ที่ปรึกษา"
                                                value={
                                                    student.teacher_full_name
                                                }
                                            />
                                            <DetailItem
                                                label="GPA"
                                                value={student.gpa}
                                            />
                                            <DetailItem
                                                label="GPAX"
                                                value={student.gpax}
                                            />
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <DetailItem
                                                label="ชื่อผู้ปกครอง"
                                                value={
                                                    student.guardian_full_name
                                                }
                                            />
                                            <DetailItem
                                                label="ความสัมพันธ์"
                                                value={
                                                    student.guardian_relationship_name
                                                }
                                            />
                                            <DetailItem
                                                label="เบอร์โทรศัพท์ผู้ปกครอง"
                                                value={student.guardian_phone}
                                            />
                                            <DetailItem
                                                label="สถานะนิสิต"
                                                value={
                                                    student.student_status_name
                                                }
                                            />
                                            <DetailItem
                                                label="ช่องทางการรับเข้า"
                                                value={
                                                    student.admission_channel_name
                                                }
                                            />
                                            <DetailItem
                                                label="หน่วยกิตที่ลงทะเบียน (ทั้งหมด/ผ่าน/ไม่ผ่าน/เกิน)"
                                                value={creditSummary}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>

                            <Col xs={24}>
                                <Card title="ข้อมูลโรงเรียนเดิม" size="small">
                                    <Row gutter={[48, 8]}>
                                        <Col xs={24} md={12}>
                                            <DetailItem
                                                label="โรงเรียนเดิม"
                                                value={
                                                    student.high_school_name
                                                }
                                            />
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <DetailItem
                                                label="ที่อยู่โรงเรียน"
                                                value={
                                                    student.high_school_address
                                                }
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>

                            <Col xs={24}>
                                <Card title="ข้อมูลหลักสูตร" size="small">
                                    <Row gutter={[48, 8]}>
                                        <Col xs={24} md={12}>
                                            <DetailItem
                                                label="หลักสูตร"
                                                value={
                                                    student.curriculum_code
                                                }
                                            />
                                            <DetailItem
                                                label="แผนการเรียน"
                                                value={
                                                    student.study_plan_name_th
                                                }
                                            />
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <DetailItem
                                                label="ภาควิชา"
                                                value={
                                                    student.department_name
                                                }
                                            />
                                            <DetailItem
                                                label="คณะ"
                                                value={student.faculty_name}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>

                            <Col xs={24}>
                                <Card
                                    style={{paddingBottom: 12}}
                                    title="Note"
                                    size="small"
                                    extra={
                                        <Button
                                            icon={<FileTextOutlined />}
                                            onClick={handleOpenNoteHistory}
                                        >
                                            ดูประวัติ Note
                                        </Button>
                                    }
                                >
                                    <Form form={noteForm} component={false}>
                                        <Row gutter={12} align="middle">
                                            <Col flex="320px">
                                                <Form.Item
                                                    name="note_type_id"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message:
                                                                'กรุณาเลือก Note',
                                                        },
                                                    ]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <ListOfValueSelect
                                                        placeholder="เลือก Note"
                                                        loading={noteTypesLoading}
                                                        error={noteTypesError}
                                                        onChange={() => {
                                                            noteForm.setFieldValue(
                                                                'remark',
                                                                undefined,
                                                            )
                                                        }}
                                                        style={{ width: '100%' }}
                                                        options={toListOfValueOptions(
                                                            noteTypes,
                                                        )}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col flex="120px">
                                                <Button
                                                    type="primary"
                                                    onClick={handleAddNote}
                                                    loading={savingNote}
                                                    block
                                                >
                                                    เพิ่ม Note
                                                </Button>
                                            </Col>
                                        </Row>

                                        {isOtherNoteType && (
                                            <Row style={{ marginTop: 12 }}>
                                                <Col span={24}>
                                                    <Form.Item
                                                        name="remark"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                whitespace: true,
                                                                message:
                                                                    'กรุณากรอกรายละเอียด Note',
                                                            },
                                                        ]}
                                                        style={{ marginBottom: 0 }}
                                                    >
                                                        <TextArea
                                                            placeholder="กรอกรายละเอียด Note"
                                                            rows={4}
                                                            maxLength={255}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        )}
                                    </Form>
                                </Card>
                            </Col>

                            {student.student_code ? (
                                <>
                                    <Col xs={24}>
                                        <StudentSemesterPerformanceSection
                                            creditStatuses={creditStatuses}
                                            rows={semesterRows}
                                            loading={loadingPerformance}
                                        />
                                    </Col>

                                    <Col xs={24}>
                                        <StudentCourseGroupPerformanceSection
                                            datasets={courseGroupDatasets}
                                            loading={loadingPerformance}
                                        />
                                    </Col>

                                    <Col xs={24}>
                                        <StudentFailedPlannedCoursesSection
                                            key={`failed-${gradeDataVersion}`}
                                            studentCode={student.student_code}
                                        />
                                    </Col>

                                    <Col xs={24}>
                                        <StudentCurriculumDetailSection
                                            key={`curriculum-${gradeDataVersion}`}
                                            studentCode={student.student_code}
                                            studyPlanId={student.study_plan_id}
                                        />
                                    </Col>
                                </>
                            ) : (
                                <Col xs={24}>
                                    <Alert
                                        type="info"
                                        showIcon
                                        message="ยังไม่มีรหัสนิสิต จึงไม่สามารถโหลดข้อมูลผลการเรียนได้"
                                    />
                                </Col>
                            )}
                        </Row>

                        <NoteHistoryModal
                            open={noteHistoryOpen}
                            loading={loadingNotes}
                            notes={notes}
                            onClose={() => setNoteHistoryOpen(false)}
                            onDelete={handleDeleteNote}
                            showDelete={true}
                        />
                        <ResetStudentGradesModal
                            open={resetGradesOpen}
                            studentCode={student.student_code ?? ''}
                            studentName={student.full_name_th}
                            currentStudyYear={student.study_year}
                            currentStudySemester={student.study_semester}
                            loading={resettingGrades}
                            onCancel={() => setResetGradesOpen(false)}
                            onConfirm={handleResetGrades}
                        />
                    </>
                )}
            </Skeleton>
        </Card>
    )
}
