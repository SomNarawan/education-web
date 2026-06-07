import { Avatar, Dropdown, Space } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import kuLogo from '../assets/newLogoUniversity1.png'

export default function HeaderBar() {
    return (
        <>
            <div className="header-logo">
                <img src={kuLogo} alt="KU Logo" className="university-logo" />
            </div>

            <Dropdown
                menu={{
                    items: [
                        { key: 'profile', label: 'โปรไฟล์' },
                        { key: 'logout', label: 'ออกจากระบบ' },
                    ],
                }}
            >
                <Space className="profile">
                    <Avatar icon={<UserOutlined />} />
                    <span>อาจารย์ที่ปรึกษา</span>
                </Space>
            </Dropdown>
        </>
    )
}