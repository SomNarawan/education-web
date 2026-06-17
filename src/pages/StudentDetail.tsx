import {
    Button,
    Card,
    Col,
    Select,
    Row,
    Skeleton,
    Typography,
    message,
} from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { FileTextOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import type { StudentDetailResponse } from '../types/StudentDetailResponse'
import type { NoteListResponse } from '../types/NoteListResponse'
import { getStudentDetail } from '../services/studentService'
import { createNote, getNotes, deleteNote } from '../services/noteService'
import { getNoteTypes } from '../services/noteTypeService'
import NoteHistoryModal from '../components/NoteHistoryModal'

const { Text } = Typography
interface NoteType {
    id: number
    note: string
}

function DetailItem({
    label,
    value,
}: {
    label: string
    value?: ReactNode
}) {
    return (
        <Row style={{ marginBottom: 18 }}>
            <Col span={10}>
                <Text strong style={{ color: '#000000' }}>
                    {label} :
                </Text>
            </Col>
            <Col span={14}>
                <Text>{value || '-'}</Text>
            </Col>
        </Row>
    )
}

export default function StudentDetail() {
    const { id } = useParams()

    const [student, setStudent] = useState<StudentDetailResponse | null>(null)
    const [loading, setLoading] = useState(false)

    const [noteTypeId, setNoteTypeId] = useState<number>()
    const [remark, setRemark] = useState('')
    const [noteTypes, setNoteTypes] = useState<NoteType[]>([])
    const [savingNote, setSavingNote] = useState(false)

    const [noteHistoryOpen, setNoteHistoryOpen] = useState(false)
    const [notes, setNotes] = useState<NoteListResponse[]>([])
    const [loadingNotes, setLoadingNotes] = useState(false)

    useEffect(() => {
        loadStudent()
        loadNoteTypes()
    }, [id])

    const selectedNoteType = noteTypes.find(
        (noteType) => noteType.id === noteTypeId
    )

    const isOtherNoteType = selectedNoteType?.note === 'อื่นๆ'

    const loadNoteTypes = async () => {
        try {
            const data = await getNoteTypes()
            setNoteTypes(data)
        } catch (error) {
            message.error('โหลดประเภท Note ไม่สำเร็จ')
        }
    }

    const loadStudent = async () => {
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
            message.error('โหลดข้อมูลนิสิตไม่สำเร็จ')
            setStudent(null)
        } finally {
            setLoading(false)
        }
    }

    const loadNotes = async (studentId: number) => {
        const data = await getNotes(studentId)
        setNotes(data)
    }

    const handleOpenNoteHistory = async () => {
        try {
            if (!student?.id) {
                message.error('ไม่พบข้อมูลนิสิต')
                return
            }

            setNoteHistoryOpen(true)
            setLoadingNotes(true)

            await loadNotes(student.id)
        } catch (error) {
            message.error('โหลดประวัติ Note ไม่สำเร็จ')
        } finally {
            setLoadingNotes(false)
        }
    }

    const handleAddNote = async () => {
        try {
            if (!student?.id) {
                message.error('ไม่พบข้อมูลนิสิต')
                return
            }

            if (!noteTypeId) {
                message.warning('กรุณาเลือก Note')
                return
            }

            if (isOtherNoteType && !remark.trim()) {
                message.warning('กรุณากรอก Remark')
                return
            }

            setSavingNote(true)

            await createNote({
                student_id: student.id,
                note_type_id: noteTypeId,
                remark: isOtherNoteType ? remark.trim() : null,
            })

            message.success('บันทึก Note สำเร็จ')
            setNoteTypeId(undefined)
            setRemark('')

            if (noteHistoryOpen) {
                await loadNotes(student.id)
            }
        } catch (error) {
            message.error('บันทึก Note ไม่สำเร็จ')
        } finally {
            setSavingNote(false)
        }
    }

    const handleDeleteNote = async (id: number) => {
        try {
            await deleteNote(id)

            message.success('ลบ Note สำเร็จ')

            if (student) {
                await loadNotes(student.id)
            }
        } catch (error) {
            message.error('ลบ Note ไม่สำเร็จ')
        }
    }

    return (
        <Card
            title={
                student
                    ? `${student.student_code} ${student.full_name_th}`
                    : ''
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
                                                value={`${student.entry_year_ad}/${student.entry_year_be}`}
                                            />
                                            <DetailItem
                                                label="อาจารย์ที่ปรึกษา"
                                                value={
                                                    student.teacher_full_name_th
                                                }
                                            />
                                            <DetailItem
                                                label="GPA"
                                                value={student.gpa}
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
                                                value={`${student.required_credits}/${student.passed_credits}/${student.not_passed_credits}/${student.overed_credits}`}
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
                                                label="ประเภทหลักสูตร"
                                                value={
                                                    student.curriculum_type
                                                }
                                            />
                                            <DetailItem
                                                label="แผนการเรียน"
                                                value={
                                                    student.study_plan_name
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
                                    <Row gutter={12} align="middle">
                                        <Col flex="320px">
                                            <Select
                                                placeholder="เลือก Note"
                                                value={noteTypeId}
                                                onChange={(value) => {
                                                    setNoteTypeId(value)
                                                    setRemark('')
                                                }}
                                                style={{ width: '100%' }}
                                                options={noteTypes.map((item) => ({
                                                    value: item.id,
                                                    label: item.note,
                                                }))}
                                            />
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
                                                <TextArea
                                                    placeholder="กรอก Remark"
                                                    value={remark}
                                                    onChange={(e) => setRemark(e.target.value)}
                                                    rows={4}
                                                    maxLength={255}
                                                    showCount
                                                />
                                            </Col>
                                        </Row>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        <NoteHistoryModal
                            open={noteHistoryOpen}
                            loading={loadingNotes}
                            notes={notes}
                            onClose={() => setNoteHistoryOpen(false)}
                            onDelete={handleDeleteNote}
                            showDelete={true}
                        />
                    </>
                )}
            </Skeleton>
        </Card>
    )
}