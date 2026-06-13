import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import StudentList from './pages/StudentList'
import StudentDetail from './pages/StudentDetail'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route
                        index
                        element={<Navigate to="/students/advisor" replace />}
                    />

                    <Route
                        path="students/:studentGroup"
                        element={<StudentList />}
                    />

                    <Route
                        path="students/:studentGroup/:studentStatus"
                        element={<StudentList />}
                    />

                    <Route
                        path="students/detail/:id"
                        element={<StudentDetail />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}