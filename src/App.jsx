import React, { Suspense } from 'react';
import { AuthProvider, useAuth } from "./Auth/AuthContext.jsx";
import { ErrorProvider } from "./context/errorContext.jsx";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
const BubbleSort = React.lazy(() => import("./algorithm/bubbleSort.jsx"));
const MergeSort = React.lazy(() => import("./algorithm/mergeSort.jsx"));
const QuickSort = React.lazy(() => import("./algorithm/quickSort.jsx"));

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
                <Route path="/comparator" element={<Comparator />} />
                <Route path="/visualizer" element={<VisualizerPage />} />
                <Route path="/library" element={<CodeLibrary />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/signup" element={user ? <Navigate to={HOME_ROUTE} /> : <SignupForm />} />
                <Route path="/login" element={user ? <Navigate to="/visualizer" /> : <LoginForm />} />
                <Route path="/logout" element={user ? <LogoutForm /> : <Navigate to="/login" />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/visualizer/bubblesort" element={<BubbleSort />} />
                <Route path="/visualizer/mergesort" element={<MergeSort />} />
                <Route path="/visualizer/quicksort" element={<QuickSort />} />
                <Route path="*" element={<div>404 - Page Not Found</div>} />
            </Routes>
        </Suspense>
    );
});

export default App;