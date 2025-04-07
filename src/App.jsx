import React, { Suspense } from 'react';
import { AuthProvider, useAuth } from "./Auth/AuthContext.jsx";
import { ErrorProvider } from "./context/errorContext.jsx";
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router-dom";
import LoginForm from "./components/loginForm.jsx";
import LogoutForm from "./components/logoutForm.jsx";
import HomePage from "./components/homePage.jsx";
import VisualizerPage from "./components/visualizerPage.jsx";
import SignupForm from "./components/signupForm.jsx";
import ForgotPassword from "./components/forgotPassword.jsx";
import ResetPassword from "./components/resetPassword.jsx";
import Comparator from "./components/comparator.jsx";
import CodeLibrary from "./components/codeLibrary.jsx";
import ErrorPopup from "./components/errorPopup.jsx";
import AdminPanel from "./components/adminPanel.jsx";
import UserManagement from "./components/userManagement.jsx";
const BubbleSort = React.lazy(() => import("./algorithm/bubbleSort.jsx"));
const MergeSort = React.lazy(() => import("./algorithm/mergeSort.jsx"));
const QuickSort = React.lazy(() => import("./algorithm/quickSort.jsx"));

// PrivateRoute component to protect routes
const PrivateRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return user ? <Outlet /> : <Navigate to="/" replace />;
};

// AdminRoute for admin-only access
const AdminRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    return user && user.admin ? <Outlet /> : <Navigate to="/" replace />;
};

const App = () => (
    <ErrorProvider>
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
                <ErrorPopup />
            </BrowserRouter>
        </AuthProvider>
    </ErrorProvider>
);

const AppRoutes = React.memo(() => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    const HOME_ROUTE = "/";

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/signup" element={user ? <Navigate to={HOME_ROUTE} /> : <SignupForm />} />
                <Route path="/login" element={user ? <Navigate to="/visualizer" /> : <LoginForm />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                    <Route path="/comparator" element={<Comparator />} />
                    <Route path="/visualizer" element={<VisualizerPage />} />
                    <Route path="/library" element={<CodeLibrary />} />
                    <Route path="/logout" element={<LogoutForm />} />
                    <Route path="/visualizer/bubblesort" element={<BubbleSort />} />
                    <Route path="/visualizer/mergesort" element={<MergeSort />} />
                    <Route path="/visualizer/quicksort" element={<QuickSort />} />
                </Route>

                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminPanel />}>
                        <Route path="users" element={<UserManagement />} />
                    </Route>
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
});

export default App;