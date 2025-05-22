import { createContext, useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import {useAuth} from "../../Auth/AuthContext.jsx";

export const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
    const [solvedChallenges, setSolvedChallenges] = useState([]);
    const [points, setPoints] = useState(0);
    const [currentRank, setCurrentRank] = useState(0);
    const [badgeCount, setBadgeCount] = useState(0);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const { auth } = useAuth();
    const baseURL = "https://algoverse-backend-nodejs.onrender.com";

    const handleBadgeCount = (SolvedChallenges) => {
        const length = SolvedChallenges.length;
        let count = 0;
        const milestones = [1, 5, 10, 20, 50, 100];
        const achievedBadges = [];

        for (const milestone of milestones) {
            if (length >= milestone) {
                achievedBadges.push(milestone);
                count += 1;
            } else {
                break; // Stop checking once a milestone is not met
            }
        }

        setBadges(achievedBadges);
        setBadgeCount(count);
    };

    // Fetch SolvedChallenges on mount
    useEffect(() => {
        const fetchSolvedChallenges = async () => {
            if (auth.currentUser) {
                try {
                    const token = await auth.currentUser.getIdToken();
                    const response = await axios.get(`${baseURL}/api/userProgress`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setSolvedChallenges(response.data.SolvedChallenges || []);
                    setPoints(response.data.Points || 0);
                    handleBadgeCount(response.data.SolvedChallenges);
                } catch (err) {
                    console.error("Error fetching solved challenges:", err);
                }
            }
            setLoading(false);
        };
        fetchSolvedChallenges();
    }, [auth.currentUser]);

    // Function to add a newly solved challenge
    const addSolvedChallenge = (challengeId) => {
        setSolvedChallenges((prev) => {
            if (!prev.includes(challengeId)) {
                return [...prev, challengeId];
            }
            return prev;
        });
    };

    const addPoints = (newPoint) => {
        const newTotalPoints = points + newPoint;
        setPoints(newTotalPoints);
    }

    return (
        <ChallengeContext.Provider value={{ solvedChallenges, addSolvedChallenge, loading, points, currentRank, setCurrentRank, addPoints, badgeCount, badges }}>
            {children}
        </ChallengeContext.Provider>
    );
};

ChallengeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};