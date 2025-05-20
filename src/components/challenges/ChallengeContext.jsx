import { createContext, useState, useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import {useAuth} from "../../Auth/AuthContext.jsx";

export const ChallengeContext = createContext();

export const ChallengeProvider = ({ children }) => {
    const [solvedChallenges, setSolvedChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const { auth } = useAuth();
    const baseURL = "http://127.0.0.1:3000";

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

    return (
        <ChallengeContext.Provider value={{ solvedChallenges, addSolvedChallenge, loading }}>
            {children}
        </ChallengeContext.Provider>
    );
};

ChallengeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};