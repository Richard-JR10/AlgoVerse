import axios from 'axios';
import {useAuth} from "../Auth/AuthContext.jsx";
import {useContext, useEffect, useState} from "react";
import {ChallengeContext} from "./challenges/ChallengeContext.jsx";



const Leaderboard = () => {
    const { auth,user } = useAuth();
    const [result, setResult] = useState(null);
    const { setCurrentRank, points, currentRank } = useContext(ChallengeContext);
    const [loading, setLoading] = useState(false);
    const baseURL = 'https://algoverse-backend-nodejs.onrender.com';

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const token = await auth.currentUser.getIdToken();
                const response = await axios.get(`${baseURL}/api/leaderboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResult(response.data);

                // Set currentRank for the logged-in user
                const currentUserEntry = response.data.leaderboard?.find(
                    (entry) => entry.uid === auth.currentUser.uid
                );
                if (currentUserEntry) {
                    setCurrentRank(currentUserEntry.rank);
                } else {
                    setCurrentRank(response.data.currentUserRank || null);
                }
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    },[])

    if (loading) {
        return (
            <div className="col-span-1">
                <div className="card w-full bg-base-300 shadow-xl min-h-64">
                    <div className="card-body p-4 sm:p-6">
                        <h2 className="card-title text-lg sm:text-xl">Leaderboard</h2>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <tbody>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
                                    <tr key={`skeleton-${row}`}>
                                        <td>
                                            <div className="skeleton h-5 w-5 rounded-full"></div>
                                        </td>
                                        <td>
                                            <div className="skeleton h-5 w-25 rounded-full"></div>
                                        </td>
                                        <td>
                                            <div className="skeleton h-5 w-8 rounded-full"></div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!result || !result.leaderboard || result.leaderboard.length === 0) {
        return (
            <div className="col-span-1">
                <div className="card w-full bg-base-300 shadow-xl min-h-64">
                    <div className="card-body p-4 sm:p-6">
                        <h2 className="card-title text-lg sm:text-xl">Leaderboard</h2>
                        <p className="text-center text-gray-700 text-lg font-semibold mt-15">No leaderboard data available</p>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="col-span-1">
            <div className="card w-full bg-base-300 shadow-xl min-h-64">
                <div className="card-body p-4 sm:p-6">
                    <h2 className="card-title text-lg sm:text-xl">Leaderboard</h2>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <tbody>
                            {result.leaderboard.map((entry) => (
                                <tr key={entry.uid}>
                                    <td className={entry.uid === auth.currentUser?.uid ? 'font-bold text-primary' : ''}>
                                        {entry.rank}
                                    </td>
                                    <td className={entry.uid === auth.currentUser?.uid ? 'font-bold text-primary' : ''}>
                                        {entry.displayName}
                                    </td>
                                    <td className={`${entry.uid === auth.currentUser?.uid ? 'font-bold text-primary' : ''} whitespace-nowrap`}>
                                        {entry.points} {entry.points > 1 ? 'pts' : 'pt'}
                                    </td>
                                </tr>
                            ))}
                            {currentRank > 10 && (
                                <tr>
                                    <td className={'font-bold text-primary'}>
                                        {currentRank}
                                    </td>
                                    <td className='font-bold text-primary'>
                                        {user.displayName}
                                    </td>
                                    <td className='font-bold text-primary whitespace-nowrap'>
                                        {points} {points > 1 ? 'pts' : 'pt'}
                                    </td>
                                </tr>
                                )
                            }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default Leaderboard
