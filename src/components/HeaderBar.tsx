import { Avatar, Dropdown, Space } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import kuLogo from '../assets/newLogoUniversity1.png'
import { useAuth } from '../context/AuthContext'

export default function HeaderBar() {
    const { user, currentRole, setCurrentRole, logout } = useAuth()

    const roleOptions = user?.roles ?? []

    const roleItems = roleOptions.map((r) => ({
        key: `role-${r}`,
        label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{r}</span>
                {currentRole === r ? <span style={{ color: '#1890ff' }}>✓</span> : null}
            </div>
        ),
        onClick: () => setCurrentRole(r),
    }))

    const items: any[] = [
        ...roleItems,
        { type: 'divider', key: 'div' },
        { key: 'logout', label: 'ออกจากระบบ', onClick: () => logout() },
    ]

    const menu = { items }

    return (
        <>
            <div className="header-logo">
                <img src={kuLogo} alt="KU Logo" className="university-logo" />
            </div>

            <Dropdown menu={menu} placement="bottomRight">
                <Space className="profile" style={{ cursor: 'pointer' }}>
                    <Avatar icon={<UserOutlined />} />
                    <span>{user?.name ?? 'อาจารย์ที่ปรึกษา'}</span>
                </Space>
            </Dropdown>
        </>
    )
}