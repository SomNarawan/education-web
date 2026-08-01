import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from './layouts/MainLayout'
import RoleRedirect from './components/RoleRedirect'
import StudentRouteGuard from './features/students/StudentRouteGuard'
import ProtectedRoute from './components/ProtectedRoute'

const StudentList = lazy(
    () => import('./features/students/list/StudentListPage'),
)
const StudentDetail = lazy(
    () => import('./features/students/detail/StudentDetailPage'),
)
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const SyncData = lazy(() => import('./pages/SyncData'))
const AdvisorAssignment = lazy(
    () => import('./features/advisorAssignments/AdvisorAssignmentPage'),
)

function PageLoading() {
    return (
        <div className="page-loading">
            <Spin size="large" />
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoading />}>
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

                        <Route
                            path="advisor-assignments"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdvisorAssignment />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="sync"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <SyncData />
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
