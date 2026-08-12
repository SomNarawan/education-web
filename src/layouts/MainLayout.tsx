import { Button, Layout } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import HeaderBar from '../components/HeaderBar'
import SideMenu from '../components/SideMenu'

const { Sider, Header, Content } = Layout

export default function MainLayout() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <Layout className="app-layout">
            <Sider
                width={260}
                collapsedWidth={80}
                collapsed={collapsed}
                className="sidebar"
                trigger={null}
            >
                <SideMenu collapsed={collapsed} />
            </Sider>

            <Layout className="main-layout">
                <Header className="header">
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        className="menu-toggle-btn"
                    />

                    <HeaderBar />
                </Header>

                <Content className="content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    )
}