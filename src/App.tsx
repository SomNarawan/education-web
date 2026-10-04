import { Suspense, lazy } from 'react'
import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from './layouts/MainLayout'
import RoleRedirect from './components/RoleRedirect'
import StudentRouteGuard from './features/students/StudentRouteGuard'
import ProtectedRoute from './components/ProtectedRoute'
import { appMode, type AppMode } from './config/appMode'

const StudentList = lazy(
    () => import('./features/students/list/StudentListPage'),
)
const StudentDetail = lazy(
    () => import('./features/students/detail/StudentDetailPage'),
)
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const MockLogin = lazy(() => import('./pages/MockLogin'))
const SyncData = lazy(() => import('./pages/SyncData'))
const SystemMasterDataDetail = lazy(
    () => import('./pages/SystemMasterDataDetail'),
)
const StudentImport = lazy(() => import('./pages/StudentImport'))
const GradeImport = lazy(() => import('./pages/GradeImport'))
const AdvisorAssignment = lazy(
    () => import('./features/advisorAssignments/AdvisorAssignmentPage'),
)
const MasterDataManagement = lazy(
    () => import('./features/masterData/MasterDataManagementPage'),
)
const HighSchoolManagement = lazy(
    () => import('./features/masterData/HighSchoolManagementPage'),
)
const GradeCalculator = lazy(
    () => import('./features/gradeCalculator/GradeCalculatorPage'),
)
const StudentPlaceholderPage = lazy(
    () => import('./pages/student/StudentPlaceholderPage'),
)

function normalizeBasePath(value?: string): string | undefined {
    if (!value) return undefined

    const trimmed = value.trim()

    if (!trimmed) return undefined

    const withLeadingSlash = trimmed.startsWith('/')
        ? trimmed
        : `/${trimmed}`

    return withLeadingSlash.replace(/\/+$/, '') || undefined
}

const basename = normalizeBasePath(import.meta.env.VITE_BASE_PATH)

function PageLoading() {
    return (
        <div className="page-loading">
            <Spin size="large" />
        </div>
    )
}

interface AppModeRouteProps {
    mode: AppMode
    children: ReactElement
}

function AppModeRoute({ mode, children }: AppModeRouteProps) {
    return appMode === mode ? children : <Navigate to="/" replace />
}

export default function App() {
    return (
        <BrowserRouter basename={basename}>
            <Suspense fallback={<PageLoading />}>
                <Routes>
                    <Route
                        path="/auth/callback"
                        element={
                            <AppModeRoute mode="staff">
                                <AuthCallback />
                            </AppModeRoute>
                        }
                    />
                    <Route
                        path="/mock-login"
                        element={
                            <AppModeRoute mode="staff">
                                <MockLogin />
                            </AppModeRoute>
                        }
                    />

                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<RoleRedirect />} />

                        <Route
                            path="student/home"
                            element={
                                <AppModeRoute mode="student">
                                    <StudentPlaceholderPage title="หน้าหลัก" />
                                </AppModeRoute>
                            }
                        />

                        <Route
                            path="student/profile"
                            element={
                                <AppModeRoute mode="student">
                                    <StudentPlaceholderPage title="ข้อมูลส่วนตัว" />
                                </AppModeRoute>
                            }
                        />

                        <Route
                            path="student/grades"
                            element={
                                <AppModeRoute mode="student">
                                    <StudentPlaceholderPage title="ผลการเรียน" />
                                </AppModeRoute>
                            }
                        />

                        <Route
                            path="student/grade-calculator"
                            element={
                                <AppModeRoute mode="student">
                                    <StudentPlaceholderPage title="คำนวณเกรด" />
                                </AppModeRoute>
                            }
                        />

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
                            path="student-imports"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <StudentImport />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="grade-imports"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <GradeImport />
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

                        <Route
                            path="sync/details/:dataType"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <SystemMasterDataDetail />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="grade-calculator"
                            element={
                                <ProtectedRoute
                                    allowedRoles={['teacher', 'admin']}
                                >
                                    <GradeCalculator />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="master-data/high-schools"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <HighSchoolManagement />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="master-data/:masterDataType"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <MasterDataManagement />
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}
