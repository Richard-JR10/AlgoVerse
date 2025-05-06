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
import LibraryManagement from "./components/libraryManagement.jsx";
import ExampleManagement from "./components/exampleManagement.jsx";
import Example from "./components/example.jsx";
import SelectSort from "./algorithm/selectSort.jsx";
import InsertSort from "./algorithm/insertSort.jsx";
import Linear from "./algorithm/search/linear.jsx";
import ProfilePage from "./components/profilePage.jsx";
import Binary from "./algorithm/search/binary.jsx";
import BFS from "./algorithm/graph/BFS.jsx";
import DFS from "./algorithm/graph/DFS.jsx";
import Djikstra from "./algorithm/graph/dijkstra.jsx";
import Kruskal from "./algorithm/graph/kruskal.jsx";
import Dijkstra from "./algorithm/graph/dijkstra.jsx";
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

    // if (loading) {
    //     return <div className="flex justify-center items-center h-screen">Loading...</div>;
    // }

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
                    <Route path="/example" element={<Example />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/logout" element={<LogoutForm />} />
                    <Route path="/visualizer/bubblesort" element={<BubbleSort />} />
                    <Route path="/visualizer/mergesort" element={<MergeSort />} />
                    <Route path="/visualizer/quicksort" element={<QuickSort />} />
                    <Route path="/visualizer/selectionsort" element={<SelectSort/>} />
                    <Route path="/visualizer/insertionsort" element={<InsertSort/>} />
                    <Route path="/visualizer/merge" element={<MergeSort/>} />
                    <Route path="/visualizer/search/linear" element={<Linear/>} />
                    <Route path="/visualizer/search/binary" element={<Binary/>} />
                    <Route path="/visualizer/graph/bfs" element={<BFS/>} />
                    <Route path="/visualizer/graph/dfs" element={<DFS/>} />
                    <Route path="/visualizer/graph/dijkstra" element={<Dijkstra/>} />
                    <Route path="/visualizer/graph/kruskal" element={<Kruskal/>} />
                </Route>

                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminPanel />}>
                        <Route path="users" element={<UserManagement />} />
                        <Route path="library" element={<LibraryManagement />} />
                        <Route path="example" element={<ExampleManagement />} />
                    </Route>
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
});

export default App;