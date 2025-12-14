import React, { Suspense } from 'react';
import { AuthProvider, useAuth } from "./Auth/AuthContext.jsx";
import { ErrorProvider } from "./context/errorContext.jsx";
import { ThemeProvider } from './context/themeContext';
import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router-dom";
import LoginForm from "./components/loginForm.jsx";
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
import SelectSort from "./algorithm/sort/selectSort.jsx";
import InsertSort from "./algorithm/sort/insertSort.jsx";
import Linear from "./algorithm/search/linear.jsx";
import ProfilePage from "./components/profilePage.jsx";
import Binary from "./algorithm/search/binary.jsx";
import BFS from "./algorithm/graph/BFS.jsx";
import DFS from "./algorithm/graph/DFS.jsx";
import Kruskal from "./algorithm/graph/kruskal.jsx";
import Dijkstra from "./algorithm/graph/dijkstra.jsx";
import ChallengePage from "./components/challengePage.jsx";
import Factorial from "./algorithm/recursion/factorial.jsx";
import Hanoi from "./algorithm/recursion/hanoi.jsx";
import ChallengesManagement from "./components/challengesManagement.jsx";
import {ChallengeProvider} from "./components/challenges/ChallengeContext.jsx";
import About from "./components/about.jsx";
import AdminDashboard from "./components/adminDashboard.jsx";
import RadixSort from "./algorithm/sort/radixSort.jsx";
import HeapSort from "./algorithm/sort/heapSort.jsx";
import Jump from "./algorithm/search/jump.jsx";
const BubbleSort = React.lazy(() => import("./algorithm/sort/bubbleSort.jsx"));
const MergeSort = React.lazy(() => import("./algorithm/sort/mergeSort.jsx"));
const QuickSort = React.lazy(() => import("./algorithm/sort/quickSort.jsx"));

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
    <ThemeProvider>
        <ErrorProvider>
            <AuthProvider>
                <ChallengeProvider>
                    <BrowserRouter>
                        <AppRoutes />
                        <ErrorPopup />
                    </BrowserRouter>
                </ChallengeProvider>
            </AuthProvider>
        </ErrorProvider>
    </ThemeProvider>
);

const AppRoutes = React.memo(() => {
    const { user } = useAuth();

    // if (loading) {
    //     return <div className="flex justify-center items-center h-screen">Loading...</div>;
    // }

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={!user ? <HomePage /> : <Navigate to="/visualizer" replace />} />
                <Route path="/signup" element={<SignupForm />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected Routes */}
                <Route element={<PrivateRoute />}>
                    <Route path="/comparator" element={<Comparator />} />
                    <Route path="/visualizer" element={<VisualizerPage />} />
                    <Route path="/challenge" element={<ChallengePage />} />
                    <Route path="/library" element={<CodeLibrary />} />
                    <Route path="/example" element={<Example />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/about" element={<About />} />

                    <Route path="/visualizer/sort/bubble" element={<BubbleSort />} />
                    <Route path="/visualizer/sort/select" element={<SelectSort/>} />
                    <Route path="/visualizer/sort/insert" element={<InsertSort/>} />
                    <Route path="/visualizer/sort/merge" element={<MergeSort/>} />
                    <Route path="/visualizer/sort/quick" element={<QuickSort/>} />
                    <Route path="/visualizer/sort/radix" element={<RadixSort/>} />
                    <Route path="/visualizer/sort/heap" element={<HeapSort/>} />

                    <Route path="/visualizer/search/linear" element={<Linear/>} />
                    <Route path="/visualizer/search/binary" element={<Binary/>} />
                    <Route path="/visualizer/search/jump" element={<Jump/>} />

                    <Route path="/visualizer/graph/bfs" element={<BFS/>} />
                    <Route path="/visualizer/graph/dfs" element={<DFS/>} />
                    <Route path="/visualizer/graph/dijkstra" element={<Dijkstra/>} />
                    <Route path="/visualizer/graph/kruskal" element={<Kruskal/>} />

                    <Route path="/visualizer/recursion/factorial" element={<Factorial/>} />
                    <Route path="/visualizer/recursion/hanoi" element={<Hanoi/>} />

                </Route>

                <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminPanel />}>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="library" element={<LibraryManagement />} />
                        <Route path="example" element={<ExampleManagement />} />
                        <Route path="challenges" element={<ChallengesManagement />} />
                    </Route>
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
});

export default App;