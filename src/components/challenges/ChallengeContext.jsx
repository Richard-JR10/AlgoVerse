import { createContext, useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import {useAuth} from "../../Auth/AuthContext.jsx";

export const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
    const [solvedChallenges, setSolvedChallenges] = useState([]);
    const [points, setPoints] = useState(0);
    const [currentRank, setCurrentRank] = useState(0);
    const [loading, setLoading] = useState(true);
    const { auth } = useAuth();
    const baseURL = "https://algoverse-backend-nodejs.onrender.com";

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
        <ChallengeContext.Provider value={{ solvedChallenges, addSolvedChallenge, loading, points, currentRank, setCurrentRank, addPoints }}>
            {children}
        </ChallengeContext.Provider>
    );
};

ChallengeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};