import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import StudentList from './pages/StudentList'
import StudentDetail from './pages/StudentDetail'
import AuthCallback from './pages/AuthCallback'
import RoleRedirect from './components/RoleRedirect'
import StudentRouteGuard from './components/StudentRouteGuard'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/auth/callback" element={<AuthCallback />} />

                <Route path="/" element={<MainLayout />}>
                    <Route index element={<RoleRedirect />} />

                    <Route
                        path="students/:studentGroup"
                        element={
                            <StudentRouteGuard>
                                <StudentList />
                            </StudentRouteGuard>
                        }
                    />

                    <Route
                        path="students/:studentGroup/:studentStatus"
                        element={
                            <StudentRouteGuard>
                                <StudentList />
                            </StudentRouteGuard>
                        }
                    />

                    <Route
                        path="students/:studentGroup/detail/:id"
                        element={
                            <StudentRouteGuard>
                                <StudentDetail />
                            </StudentRouteGuard>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}