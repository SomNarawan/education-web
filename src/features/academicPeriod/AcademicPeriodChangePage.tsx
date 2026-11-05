import {
    HistoryOutlined,
    ReloadOutlined,
    SyncOutlined,
} from '@ant-design/icons'
import { Alert, Button, Space, Spin, Tabs } from 'antd'
import { useNavigate } from 'react-router-dom'
import AcademicPeriodHistory from './AcademicPeriodHistory'
import {
    AcademicPeriodConfirmModal,
    AcademicPeriodHistoryModal,
} from './AcademicPeriodModals'
import AcademicPeriodPreview from './AcademicPeriodPreview'
import './academicPeriodChange.css'
import { useAcademicPeriodSync } from './useAcademicPeriodSync'

export default function AcademicPeriodChangePage() {
    const navigate = useNavigate()
    const {
        preview,
        history,
        selectedHistory,
        loading,
        syncing,
        confirmOpen,
        error,
        loadData,
        syncAcademicPeriods,
        setConfirmOpen,
        setSelectedHistory,
    } = useAcademicPeriodSync()

    return (
        <div className="student-page academic-period-page">
            <div className="page-title-section academic-period-title">
                <div>
                    <h1>ซิงค์ชั้นปีและภาคการศึกษานิสิต</h1>
                    <p>
                        คำนวณชั้นปีจากปีการศึกษาที่เข้า และภาคการศึกษาจากปฏิทินที่ Sync ไว้โดยอัตโนมัติ
                    </p>
                </div>
                <Space wrap>
                    <Button
                        icon={<ReloadOutlined />}
                        loading={loading}
                        onClick={() => void loadData()}
                    >
                        รีเฟรช
                    </Button>
                </Space>
            </div>

            {error && (
                <Alert
                    type="error"
                    showIcon
                    message="โหลดข้อมูลไม่สำเร็จ"
                    description={error}
                    action={
                        <Button size="small" onClick={() => void loadData()}>
                            ลองใหม่
                        </Button>
                    }
                    className="academic-period-error"
                />
            )}

            {loading ? (
                <div
                    className="page-loading"
                    role="status"
                    aria-label="กำลังโหลดข้อมูล"
                >
                    <Spin size="large" />
                </div>
            ) : (
                <Tabs
                    items={[
                        {
                            key: 'preview',
                            label: (
                                <span>
                                    <SyncOutlined /> ตรวจสอบและ Sync
                                </span>
                            ),
                            children: (
                                <AcademicPeriodPreview
                                    preview={preview}
                                    syncing={syncing}
                                    onOpenCalendar={() => {
                                        navigate(
                                            '/central-data/academic-calendar',
                                        )
                                    }}
                                    onStartSync={() => setConfirmOpen(true)}
                                />
                            ),
                        },
                        {
                            key: 'history',
                            label: (
                                <span>
                                    <HistoryOutlined /> ประวัติการ Sync
                                </span>
                            ),
                            children: (
                                <AcademicPeriodHistory
                                    history={history}
                                    loading={loading}
                                    onSelectHistory={setSelectedHistory}
                                />
                            ),
                        },
                    ]}
                />
            )}

            <AcademicPeriodConfirmModal
                open={confirmOpen}
                syncing={syncing}
                preview={preview}
                onConfirm={() => void syncAcademicPeriods()}
                onCancel={() => setConfirmOpen(false)}
            />
            <AcademicPeriodHistoryModal
                history={selectedHistory}
                onClose={() => setSelectedHistory(null)}
            />
        </div>
    )
}
