import React from 'react';
import styles from './StudentDashboard.module.css';
import { FaTimes, FaUserCircle, FaTrophy, FaHistory, FaSignOutAlt } from 'react-icons/fa';

const StudentDashboard = ({ onClose }) => {
  // Hardcoded student data for demonstration
  const student = {
    name: 'Srisaran',
    email: 'srisaran@example.com',
    totalGames: 15,
    wins: 8,
    losses: 7,
    accuracy: '87%',
    bestScore: 12345,
  };

  return (
    <div className={styles.dashboardOverlay}>
      <div className={styles.dashboardContainer}>
        <button onClick={onClose} className={styles.closeButton}>
          <FaTimes />
        </button>
        <h2 className={styles.title}>STUDENT DASHBOARD</h2>

        <div className={styles.profileSection}>
          <FaUserCircle className={styles.profileIcon} />
          <p className={styles.profileName}>{student.name}</p>
          <p className={styles.profileEmail}>{student.email}</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <FaTrophy className={styles.statIcon} />
            <p>Games Played: {student.totalGames}</p>
          </div>
          <div className={styles.statItem}>
            <FaTrophy className={styles.statIcon} />
            <p>Wins: {student.wins}</p>
          </div>
          <div className={styles.statItem}>
            <FaTimes className={styles.statIcon} />
            <p>Losses: {student.losses}</p>
          </div>
          <div className={styles.statItem}>
            <FaHistory className={styles.statIcon} />
            <p>Accuracy: {student.accuracy}</p>
          </div>
          <div className={styles.statItem}>
            <FaTrophy className={styles.statIcon} />
            <p>Best Score: {student.bestScore}</p>
          </div>
        </div>

        <button className={styles.logoutButton}>
          <FaSignOutAlt className={styles.logoutIcon} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;