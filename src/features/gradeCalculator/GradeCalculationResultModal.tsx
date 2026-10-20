import { Alert, Button, Col, Modal, Row, Statistic, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { appColors } from '../../config/appColors'
import { CourseGroupPerformance } from './GradeCourseDetails'
import type { CalculatedCourse, GradeCalculationResult } from './gradeCalculator.types'

interface GradeCalculationResultModalProps {
    result: GradeCalculationResult
    open: boolean
    saved: boolean
    termLabel: string
    currentGpax: number
    onClose: () => void
}

const columns: ColumnsType<CalculatedCourse> = [
    { title: 'รหัสวิชา', dataIndex: 'code', width: 120 },
    { title: 'ชื่อรายวิชา', dataIndex: 'name', width: 320 },
    {
        title: 'เกรดเฉลี่ยของหมวดวิชา',
        key: 'courseGroupPerformance',
        width: 360,
        render: (_, course) => <CourseGroupPerformance {...course} />,
    },
    { title: 'หน่วยกิต', dataIndex: 'credits', align: 'center', width: 90 },
    { title: 'เกรดคาดการณ์', dataIndex: 'grade', align: 'center', width: 120 },
    {
        title: 'คะแนนเกรด',
        dataIndex: 'gradePoints',
        align: 'center',
        width: 110,
        render: (value: number) => value.toFixed(2),
    },
]

function getGpaxChangePresentation(change: number) {
    const roundedChange = Number(change.toFixed(2))

    return {
        text: `${roundedChange > 0 ? '+' : ''}${roundedChange.toFixed(2)}`,
        color:
            roundedChange > 0
                ? appColors.success
                : roundedChange < 0
                  ? appColors.error
                  : appColors.neutral,
    }
}

export default function GradeCalculationResultModal({
    result,
    open,
    saved,
    termLabel,
    currentGpax,
    onClose,
}: GradeCalculationResultModalProps) {
    const gpaxChange = getGpaxChangePresentation(result.cumulativeGpa - currentGpax)
    const gpaxColor =
        result.cumulativeGpa >= currentGpax ? appColors.success : appColors.error

    return (
        <Modal
            width={1300}
            open={open}
            title="ผลการคำนวณ"
            footer={
                <Button type="primary" onClick={onClose}>
                    ปิด
                </Button>
            }
            onCancel={onClose}
        >
            {saved && (
                <Alert
                    className="grade-calculation-saved-alert"
                    type="success"
                    showIcon
                    message="บันทึกการคำนวณแล้ว"
                    description="ผลการคำนวณนี้ถูกบันทึกไว้ในประวัติเรียบร้อยแล้ว"
                />
            )}
            <div className="grade-calculation-result-heading">
                ผลการคาดการณ์ {termLabel}
            </div>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Statistic
                        title="GPA เทอมที่คาดการณ์"
                        value={result.termGpa}
                        precision={2}
                        valueStyle={{ color: appColors.info }}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Statistic
                        title="GPAX หลังจบเทอม"
                        value={result.cumulativeGpa}
                        precision={2}
                        valueStyle={{ color: gpaxColor }}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Statistic
                        title="GPAX เปลี่ยนแปลง"
                        value={gpaxChange.text}
                        valueStyle={{ color: gpaxChange.color }}
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Statistic
                        title="หน่วยกิตสะสมหลังจบเทอม"
                        value={result.cumulativeCredits}
                        suffix="หน่วยกิต"
                    />
                </Col>
            </Row>
            <div className="grade-result-comparison">
                GPAX ปัจจุบัน {currentGpax.toFixed(2)}
                {' → '} GPAX คาดการณ์ {result.cumulativeGpa.toFixed(2)}
            </div>
            <Table<CalculatedCourse>
                rowKey="id"
                columns={columns}
                dataSource={result.courses}
                pagination={false}
                size="small"
                tableLayout="fixed"
            />
        </Modal>
    )
}
