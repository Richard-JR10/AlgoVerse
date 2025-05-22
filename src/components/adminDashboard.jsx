import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { useAuth } from '../Auth/AuthContext.jsx';
import axios from 'axios';

const AdminDashboard = () => {
    const { user, auth } = useAuth();
    const [dashboardData, setDashboardData] = useState({
        currentUserInfo: null,
        authProviders: [],
        allUsersProviders: [],
        dailyActiveUsers: 0,
        monthlyActiveUsers: 0,
        totalUsers: 0,
        loading: true,
        error: null
    });

    // Colors for providers
    const PROVIDER_COLORS = {
        'google.com': '#DC2626',
        'github.com': '#1F2937',
        'facebook.com': '#1877F2',
        'twitter.com': '#1DA1F2',
        'apple.com': '#000000',
        'microsoft.com': '#00A4EF',
        'password': '#3B82F6',
        'unknown': '#6B7280'
    };

    // Colors for active users chart
    const ACTIVE_USERS_COLORS = {
        daily: '#10B981', // Tailwind's success color
        monthly: '#06B6D4' // Tailwind's info color
    };

    // Firebase Auth data for current user
    const fetchFirebaseAuthData = async () => {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                throw new Error('No authenticated user');
            }

            const providerData = currentUser.providerData || [];
            const authProviders = [];

            if (providerData.length === 0) {
                authProviders.push({
                    name: 'Email/Password',
                    value: 1,
                    color: PROVIDER_COLORS['password']
                });
            } else {
                providerData.forEach((provider) => {
                    let providerName = provider.providerId.split('.')[0];
                    providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);
                    if (providerName === 'Password') providerName = 'Email/Password';

                    authProviders.push({
                        name: providerName,
                        value: 1,
                        color: PROVIDER_COLORS[provider.providerId] || PROVIDER_COLORS['unknown'],
                        providerId: provider.providerId,
                        email: provider.email,
                        displayName: provider.displayName
                    });
                });
            }

            const currentUserInfo = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                emailVerified: currentUser.emailVerified,
                phoneNumber: currentUser.phoneNumber,
                isAnonymous: currentUser.isAnonymous,
                creationTime: currentUser.metadata.creationTime,
                lastSignInTime: currentUser.metadata.lastSignInTime,
                lastRefreshTime: currentUser.metadata.lastRefreshTime,
                providerData: providerData.map(provider => ({
                    providerId: provider.providerId,
                    email: provider.email,
                    displayName: provider.displayName,
                    photoURL: provider.photoURL,
                    phoneNumber: provider.phoneNumber
                })),
                refreshToken: !!currentUser.refreshToken,
                accessToken: !!currentUser.accessToken
            };

            return { currentUserInfo, authProviders };
        } catch (error) {
            console.error('Error fetching Firebase Auth data:', error);
            throw error;
        }
    };

    // Fetch all users data from backend
    const fetchAllUsersData = async () => {
        try {
            const idToken = await auth.currentUser.getIdToken();
            const response = await axios.get('http://localhost:3000/api/users', {
                headers: { Authorization: `Bearer ${idToken}` }
            });
            const users = response.data;

            // Calculate daily and monthly active users
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            thirtyDaysAgo.setHours(0, 0, 0, 0);

            let dailyActiveUsers = 0;
            let monthlyActiveUsers = 0;
            const providerCounts = {};

            users.forEach(user => {
                const lastSignIn = user.lastSignInTime ? new Date(user.lastSignInTime) : null;
                if (lastSignIn) {
                    if (lastSignIn >= today) dailyActiveUsers++;
                    if (lastSignIn >= thirtyDaysAgo) monthlyActiveUsers++;
                }

                const providers = user.providerData || [];
                if (providers.length === 0) {
                    providerCounts['password'] = (providerCounts['password'] || 0) + 1;
                } else {
                    providers.forEach(provider => {
                        providerCounts[provider.providerId] = (providerCounts[provider.providerId] || 0) + 1;
                    });
                }
            });

            const allUsersProviders = Object.entries(providerCounts).map(([providerId, value]) => {
                let name = providerId.split('.')[0];
                name = name.charAt(0).toUpperCase() + name.slice(1);
                if (name === 'Password') name = 'Email/Password';
                return {
                    name,
                    value,
                    color: PROVIDER_COLORS[providerId] || PROVIDER_COLORS['unknown']
                };
            });

            return {
                dailyActiveUsers,
                monthlyActiveUsers,
                totalUsers: users.length,
                allUsersProviders
            };
        } catch (error) {
            console.error('Error fetching all users data:', error);
            throw error;
        }
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setDashboardData(prev => ({ ...prev, loading: true, error: null }));

                const [currentUserData, allUsersData] = await Promise.all([
                    fetchFirebaseAuthData(),
                    fetchAllUsersData()
                ]);

                setDashboardData({
                    currentUserInfo: currentUserData.currentUserInfo,
                    authProviders: currentUserData.authProviders,
                    allUsersProviders: allUsersData.allUsersProviders,
                    dailyActiveUsers: allUsersData.dailyActiveUsers,
                    monthlyActiveUsers: allUsersData.monthlyActiveUsers,
                    totalUsers: allUsersData.totalUsers,
                    loading: false,
                    error: null
                });
            } catch (error) {
                setDashboardData(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }));
            }
        };

        if (user) {
            loadDashboardData();
        }
    }, [user]);

    if (dashboardData.loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (dashboardData.error) {
        return (
            <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Error loading dashboard data: {dashboardData.error}</span>
            </div>
        );
    }

    const { allUsersProviders, dailyActiveUsers, monthlyActiveUsers, totalUsers } = dashboardData;

    // Data for active users bar chart
    const activeUsersData = [
        { name: 'Daily Active Users', value: dailyActiveUsers, fill: ACTIVE_USERS_COLORS.daily, metric: 'Daily Active Users' },
        { name: 'Monthly Active Users', value: monthlyActiveUsers, fill: ACTIVE_USERS_COLORS.monthly, metric: 'Monthly Active Users' }
    ];

    // Custom Tooltip Component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-base-100 p-3 border border-base-300 rounded-lg shadow-lg">
                    <p className="text-base-content/60 mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        entry.value > 0 && (
                            <p key={index} className="text-sm">
                                <span style={{ color: entry.payload.fill }}>{entry.payload.metric}:</span>{' '}
                                <span style={{ color: entry.payload.fill }}>{entry.value}</span>
                            </p>
                        )
                    ))}
                </div>
            );
        }
        return null;
    };

    // Custom Legend Component
    const CustomLegend = () => {
        return (
            <div className="flex justify-center space-x-4 mt-4">
                <div className="flex items-center">
                    <span className="w-4 h-4 mr-2" style={{ backgroundColor: ACTIVE_USERS_COLORS.daily }}></span>
                    <span>Daily Active Users</span>
                </div>
                <div className="flex items-center">
                    <span className="w-4 h-4 mr-2" style={{ backgroundColor: ACTIVE_USERS_COLORS.monthly }}></span>
                    <span>Monthly Active Users</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 p-6">
            {/* User Activity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base-content/60 text-sm font-medium">Total Users</p>
                                <p className="text-2xl font-bold text-primary">{totalUsers}</p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-full">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base-content/60 text-sm font-medium">Daily Active Users</p>
                                <p className="text-2xl font-bold text-success">{dailyActiveUsers}</p>
                            </div>
                            <div className="p-3 bg-success/10 rounded-full">
                                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base-content/60 text-sm font-medium">Monthly Active Users</p>
                                <p className="text-2xl font-bold text-info">{monthlyActiveUsers}</p>
                            </div>
                            <div className="p-3 bg-info/10 rounded-full">
                                <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Users Chart */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="card-title text-xl mb-4">Active Users Overview</h3>
                    {dailyActiveUsers > 0 || monthlyActiveUsers > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activeUsersData} barCategoryGap="40%">
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend content={<CustomLegend />} />
                                    <Bar dataKey="value" name="Active Users" fill="#8884d8" barSize={400} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-base-content/60">
                            No active user data available
                        </div>
                    )}
                </div>
            </div>

            {/* Authentication Providers for All Users */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="card-title text-xl mb-4">All Users Authentication Providers</h3>
                    {allUsersProviders.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allUsersProviders}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name }) => name}
                                    >
                                        {allUsersProviders.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-base-content/60">
                            No provider data available for users
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;