import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4001";

// Helper function to format accuracy
const formatAccuracy = (accuracy) => {
  if (accuracy === null || accuracy === undefined) return '0.0';
  return typeof accuracy === 'number' ? accuracy.toFixed(1) : parseFloat(accuracy || 0).toFixed(1);
};

const GameUI = ({ user, onLogout, onFinish }) => {
  const [socket, setSocket] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [result, setResult] = useState({ 
    message: '', 
    correct: false, 
    points: 0, 
    correctAnswer: '',
    showNextButton: false 
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameStats, setGameStats] = useState({ 
    score: 0, 
    correct: 0, 
    total: 0,
    questionsAnswered: 0 
  });
  const [connected, setConnected] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [finalResults, setFinalResults] = useState(null);
  const [gameStatus, setGameStatus] = useState({
    questionsLoaded: 0,
    isGameActive: false,
    currentIndex: -1,
    gameSessionId: null
  });
  const [loading, setLoading] = useState(true);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    console.log('🎮 Initializing socket connection to:', API_BASE);
    const newSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);
    setLoading(true);

    newSocket.on('connect', () => {
      console.log('✅ Connected to game server with ID:', newSocket.id);
      setConnected(true);
      setLoading(false);
      newSocket.emit('getGameStatus');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setConnected(false);
      setLoading(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from game server:', reason);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      newSocket.emit('getGameStatus');
    });

    // Game status event
    newSocket.on('gameStatus', (status) => {
      console.log('📊 Game status received:', status);
      setGameStatus({
        questionsLoaded: status.questionsLoaded,
        isGameActive: status.isGameActive,
        currentIndex: status.currentIndex,
        gameSessionId: status.gameSessionId
      });
      setLoading(false);
    });

    newSocket.on('gameStarted', (data) => {
      console.log('🎮 Game started:', data);
      setGameStatus(prev => ({ ...prev, isGameActive: true }));
    });

    newSocket.on('newQuestion', (question) => {
      console.log('❓ New question received:', question);
      setCurrentQuestion(question);
      setTimeLeft(question.time || 30);
      setSelectedAnswer('');
      setResult({ 
        message: '', 
        correct: false, 
        points: 0, 
        correctAnswer: '',
        showNextButton: false 
      });
      setIsAnswerSubmitted(false);
      
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsAnswerSubmitted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    newSocket.on('questionClosed', (data) => {
      console.log('⏹️ Question closed:', data);
      clearInterval(timerRef.current);
      setIsAnswerSubmitted(true);
      setResult({ 
        message: data.explanation || `Time's up! Correct answer was: ${data.correctAnswer}`,
        correct: false,
        points: 0,
        correctAnswer: data.correctAnswer,
        showNextButton: true
      });
    });

    newSocket.on('leaderboardUpdate', (data) => {
      console.log('🏆 Leaderboard updated:', data);
      setLeaderboard(data);
    });

    newSocket.on('answerResult', (data) => {
      console.log('📝 Answer result:', data);
      setIsAnswerSubmitted(true);
      
      if (data.error) {
        setResult({ 
          message: data.error, 
          correct: false, 
          points: 0,
          correctAnswer: data.correctAnswer || '',
          showNextButton: data.showNextButton || true
        });
      } else {
        setResult({ 
          message: data.message, 
          correct: data.correct, 
          points: data.points,
          correctAnswer: data.correctAnswer || '',
          showNextButton: data.showNextButton || true
        });
        
        if (data.correct) {
          setGameStats(prev => ({
            score: prev.score + data.points,
            correct: prev.correct + 1,
            total: prev.total + 1,
            questionsAnswered: prev.questionsAnswered + 1
          }));
        } else {
          setGameStats(prev => ({
            ...prev,
            total: prev.total + 1,
            questionsAnswered: prev.questionsAnswered + 1
          }));
        }
      }
    });

    newSocket.on('gameCompleted', (data) => {
      console.log('🎉 Game completed:', data);
      setGameCompleted(true);
      setFinalResults(data);
      clearInterval(timerRef.current);
      setIsAnswerSubmitted(true);
      setResult(prev => ({ ...prev, showNextButton: false }));
      setGameStatus(prev => ({ ...prev, isGameActive: false }));
    });

    // Load initial leaderboard
    fetchLeaderboard();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (newSocket) newSocket.close();
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleAnswer = (answer) => {
    if (!socket || !user || !currentQuestion || isAnswerSubmitted) {
      console.log('Cannot submit answer:', { 
        socket: !!socket, 
        user: !!user, 
        question: !!currentQuestion, 
        submitted: isAnswerSubmitted 
      });
      return;
    }
    
    console.log('Submitting answer:', answer);
    setSelectedAnswer(answer);
    setIsAnswerSubmitted(true);
    
    socket.emit('submitAnswer', {
      user_id: user.user_id || user.uid,
      answer: answer,
      email: user.email,
      display_name: user.display_name || user.displayName
    });
  };

  const handleNextQuestion = () => {
    if (socket && socket.connected) {
      console.log('➡️ Emitting nextQuestion event');
      socket.emit('nextQuestion');
      setResult(prev => ({ ...prev, showNextButton: false }));
      setSelectedAnswer('');
      setIsAnswerSubmitted(false);
    } else {
      console.error('Socket not connected');
    }
  };

  const handlePlayAgain = () => {
    setGameCompleted(false);
    setFinalResults(null);
    setGameStats({ score: 0, correct: 0, total: 0, questionsAnswered: 0 });
    setCurrentQuestion(null);
    setResult({ message: '', correct: false, points: 0, correctAnswer: '', showNextButton: false });
    setIsAnswerSubmitted(false);
    window.location.reload();
  };

  const refreshGameStatus = () => {
    if (socket && socket.connected) {
      socket.emit('getGameStatus');
    }
  };

  // Game Completion Screen
  if (gameCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8 p-6 bg-gray-800 rounded-2xl border-2 border-cyan-600">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 mb-2">🎉 Game Completed! 🎉</h1>
              <p className="text-cyan-200">Wisdom Warfare - Final Results</p>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-cyan-100 font-semibold">{user.display_name || user.displayName}</p>
                <p className="text-cyan-200 text-sm">{user.email}</p>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-2xl p-8 border-2 border-cyan-600">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-cyan-300 mb-4">Your Final Score</h2>
              <div className="text-6xl font-bold text-cyan-400 mb-2">{gameStats.score}</div>
              <div className="text-xl text-cyan-200">
                {gameStats.correct}/30 Correct • {formatAccuracy((gameStats.correct / gameStats.total) * 100)}% Accuracy
              </div>
            </div>

            {finalResults?.finalResults?.results && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-cyan-300 mb-4 text-center">🏆 Final Rankings</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {finalResults.finalResults.results.map((player, index) => {
                    const isCurrentUser = user && player.email === user.email;
                    return (
                      <div
                        key={player.user_id}
                        className={`flex justify-between items-center p-4 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-cyan-700 border-2 border-cyan-400' 
                            : index === 0 
                            ? 'bg-yellow-600' 
                            : index === 1 
                            ? 'bg-gray-600' 
                            : index === 2 
                            ? 'bg-amber-800' 
                            : 'bg-gray-700'
                        } ${isCurrentUser ? 'scale-105' : ''}`}
                      >
                        <div className="flex items-center">
                          <span className={`text-xl font-bold mr-4 ${
                            index < 3 ? 'text-white' : 'text-cyan-300'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <div className={`font-semibold ${
                              isCurrentUser ? 'text-cyan-100' : 'text-white'
                            }`}>
                              {player.display_name || player.email}
                            </div>
                            {isCurrentUser && (
                              <div className="text-cyan-200 text-sm">You</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-cyan-300">
                            {player.session_score || 0} pts
                          </div>
                          <div className="text-sm text-gray-300">
                            {formatAccuracy(player.accuracy)}% accuracy
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handlePlayAgain}
                className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-lg transition-colors"
              >
                🎮 Play Again
              </button>
              <button
                onClick={onFinish}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-lg transition-colors"
              >
                📊 View Dashboard
              </button>
              <button
                onClick={onLogout}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-lg transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-2">Connecting to Game...</h2>
          <p className="text-cyan-200">Please wait while we connect to the game server</p>
        </div>
      </div>
    );
  }

  // Main Game Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 p-6 bg-gray-800 rounded-2xl border-2 border-cyan-600">
          <div className="text-center lg:text-left mb-4 lg:mb-0">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Wisdom Warfare</h1>
            <p className="text-cyan-200">Real-time Compiler Design Quiz</p>
            <div className="mt-2 text-sm text-cyan-300">
              Questions: {gameStatus.questionsLoaded} | 
              Status: {gameStatus.isGameActive ? '🟢 ACTIVE' : '🟡 WAITING'} |
              Connection: {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {user && (
              <div className="text-center sm:text-right">
                <p className="text-cyan-100 font-semibold">{user.display_name || user.displayName}</p>
                <p className="text-cyan-200 text-sm">{user.email}</p>
              </div>
            )}
            
            <div className="flex gap-2 items-center">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-300">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <button
              onClick={refreshGameStatus}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Refresh
            </button>
            
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-2xl p-6 border-2 border-cyan-600">
              {currentQuestion ? (
                <>
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4 mb-2 sm:mb-0">
                      <div className="text-2xl font-bold text-cyan-400 bg-gray-900 px-4 py-2 rounded-lg">
                        {timeLeft}s
                      </div>
                      <div className="text-lg text-gray-300">
                        Difficulty: <span className="font-bold text-cyan-300">{currentQuestion.difficulty}</span>
                      </div>
                      <div className="text-lg text-cyan-200">
                        Question: <span className="font-bold text-cyan-300">
                          {currentQuestion.questionNumber}/{currentQuestion.totalQuestions}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-lg text-cyan-200">
                      Your Score: <span className="font-bold text-cyan-300">{gameStats.score}</span>
                    </div>
                  </div>

                  {/* Question */}
                  <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
                    {currentQuestion.text}
                  </h2>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Object.entries(currentQuestion.options).map(([key, value], index) => {
                      const isSelected = selectedAnswer === key;
                      const isCorrect = result.correct && isSelected;
                      const isWrong = !result.correct && isSelected;
                      const isCorrectAnswer = result.correctAnswer === value;
                      const isDisabled = isAnswerSubmitted || timeLeft === 0;
                      
                      return (
                        <button
                          key={key}
                          onClick={() => handleAnswer(key)}
                          disabled={isDisabled}
                          className={`p-4 rounded-xl text-left font-semibold text-lg transition-all duration-200 ${
                            isSelected
                              ? isCorrect
                                ? 'bg-green-600 text-white border-2 border-green-400'
                                : 'bg-red-600 text-white border-2 border-red-400'
                              : isCorrectAnswer && result.message
                                ? 'bg-green-600 text-white border-2 border-green-400'
                                : isDisabled
                                ? 'bg-gray-800 text-gray-500 border-2 border-gray-700 cursor-not-allowed'
                                : 'bg-gray-700 text-white hover:bg-gray-600 border-2 border-gray-600 hover:border-cyan-500 cursor-pointer hover:scale-105'
                          }`}
                        >
                          <span className="font-bold mr-3">{key}.</span>
                          {value}
                        </button>
                      );
                    })}
                  </div>

                  {/* Result Message */}
                  {result.message && (
                    <div className={`p-4 rounded-lg mb-4 text-center font-bold text-lg ${
                      result.correct 
                        ? 'bg-green-600 text-white' 
                        : result.message.includes('Time\'s up')
                        ? 'bg-yellow-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {result.message}
                    </div>
                  )}

                  {/* Next Question Button */}
                  {result.showNextButton && (
                    <div className="text-center">
                      <button
                        onClick={handleNextQuestion}
                        disabled={!socket || !socket.connected}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        {!socket || !socket.connected ? 'Connecting...' : 'Next Question →'}
                      </button>
                      <p className="text-gray-400 text-sm mt-2">
                        Click to proceed to the next question immediately
                      </p>
                    </div>
                  )}

                  {/* Auto-progress indicator */}
                  {!result.showNextButton && timeLeft > 0 && !isAnswerSubmitted && (
                    <div className="text-center text-gray-400 mt-4">
                      Next question in {timeLeft}s...
                    </div>
                  )}
                </>
              ) : (
                /* Waiting for Question */
                <div className="text-center py-16">
                  {gameStatus.questionsLoaded === 0 ? (
                    <>
                      <div className="text-6xl text-red-400 mb-6">❌</div>
                      <h3 className="text-3xl font-bold text-white mb-4">
                        No Questions Available
                      </h3>
                      <p className="text-gray-300 text-lg mb-4">
                        Please ask the administrator to upload questions.
                      </p>
                      <div className="text-cyan-300">
                        <a 
                          href={`${API_BASE.replace('4001', '4001')}/admin`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:text-cyan-200"
                        >
                          Go to Admin Panel
                        </a>
                      </div>
                    </>
                  ) : !gameStatus.isGameActive ? (
                    <>
                      <div className="text-6xl text-cyan-400 mb-6">⏳</div>
                      <h3 className="text-3xl font-bold text-white mb-4">
                        Waiting for Game to Start
                      </h3>
                      <p className="text-gray-300 text-lg">
                        The administrator will start the game shortly. Get ready!
                      </p>
                      <div className="mt-4 text-cyan-300">
                        {gameStatus.questionsLoaded} questions loaded and ready
                      </div>
                      {!connected && (
                        <p className="text-red-400 mt-4">Trying to reconnect...</p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-6xl text-cyan-400 mb-6">⏳</div>
                      <h3 className="text-3xl font-bold text-white mb-4">
                        Waiting for next question...
                      </h3>
                      <p className="text-gray-300 text-lg">
                        The next question will appear shortly. Get ready!
                      </p>
                      {!connected && (
                        <p className="text-red-400 mt-4">Trying to reconnect...</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-gray-800 rounded-2xl p-6 border-2 border-cyan-600 h-fit">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 text-center">
              🏆 Live Leaderboard
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leaderboard.map((player, index) => {
                const isCurrentUser = user && player.email === user.email;
                
                return (
                  <div
                    key={player.user_id}
                    className={`flex justify-between items-center p-3 rounded-lg transition-all ${
                      isCurrentUser 
                        ? 'bg-cyan-700 border-2 border-cyan-400' 
                        : index === 0 
                        ? 'bg-yellow-600' 
                        : index === 1 
                        ? 'bg-gray-600' 
                        : index === 2 
                        ? 'bg-amber-800' 
                        : 'bg-gray-700'
                    } ${isCurrentUser ? 'scale-105' : ''}`}
                  >
                    <div className="flex items-center min-w-0">
                      <span className={`font-bold mr-3 ${
                        index < 3 ? 'text-white' : 'text-cyan-300'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate font-semibold ${
                          isCurrentUser ? 'text-cyan-100' : 'text-white'
                        }`}>
                          {player.display_name || player.email}
                        </div>
                        {isCurrentUser && (
                          <div className="text-cyan-200 text-xs">You</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cyan-300">
                        {player.score || 0}
                      </div>
                      <div className="text-xs text-gray-300">
                        {formatAccuracy(player.accuracy)}%
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {leaderboard.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No scores yet. Be the first!
                </div>
              )}
            </div>

            {/* Game Stats */}
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-bold text-cyan-300 mb-3">Your Stats</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-cyan-400">{gameStats.score}</div>
                  <div className="text-xs text-gray-300">Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{gameStats.correct}</div>
                  <div className="text-xs text-gray-300">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-300">{gameStats.questionsAnswered}</div>
                  <div className="text-xs text-gray-300">Answered</div>
                </div>
              </div>
            </div>

            {/* Game Status */}
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-bold text-cyan-300 mb-2">Game Status</h3>
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Questions:</span>
                  <span className="text-cyan-300">{gameStatus.questionsLoaded}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={gameStatus.isGameActive ? "text-green-400" : "text-yellow-400"}>
                    {gameStatus.isGameActive ? 'Active 🟢' : 'Waiting 🟡'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span className={connected ? "text-green-400" : "text-red-400"}>
                    {connected ? 'Connected 🟢' : 'Disconnected 🔴'}
                  </span>
                </div>
                {gameStatus.gameSessionId && (
                  <div className="flex justify-between">
                    <span>Session:</span>
                    <span className="text-cyan-300 text-xs truncate ml-2">
                      {gameStatus.gameSessionId.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Exit Game Button */}
            <button
              onClick={onFinish}
              className="w-full mt-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold transition-colors"
            >
              Exit Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;