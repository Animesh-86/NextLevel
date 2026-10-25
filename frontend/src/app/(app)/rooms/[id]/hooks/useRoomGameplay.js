'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { isMSQQuestion, getSingleCorrectAnswerIndex } from '../utils/msqHelpers';
import { playFeedbackSound } from '../utils/soundHelpers';

export function useRoomGameplay({
  roomIdOrCode,
  room,
  setRoom,
  currentUserId,
  participantsList,
  stageState,
  setStageState,
  fetchRoomData,
  selectedExamIds,
  setIsFullscreenActive,
  setIsProctoredActive,
  resetProctoring
}) {
  const toast = useToast();
  const [gameQuestions, setGameQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerEvaluated, setIsAnswerEvaluated] = useState(false);
  const [isEliminated, setIsEliminated] = useState(false);
  const [survivalLives, setSurvivalLives] = useState(1);
  const [bossHp, setBossHp] = useState(1000);
  const [bossMaxHp, setBossMaxHp] = useState(1000);
  const [bossHitEffect, setBossHitEffect] = useState(null);
  const [myTeam, setMyTeam] = useState('ALPHA');
  const [teamAlphaScore, setTeamAlphaScore] = useState(0);
  const [teamBetaScore, setTeamBetaScore] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [qTimeLeft, setQTimeLeft] = useState(30);
  const [checkpointNextIdx, setCheckpointNextIdx] = useState(5);
  const [questionAnswersRecord, setQuestionAnswersRecord] = useState([]);
  const [showPostSprintReview, setShowPostSprintReview] = useState(false);
  const [savingVault, setSavingVault] = useState(false);
  const [copiedVictoryCard, setCopiedVictoryCard] = useState(false);

  const autoAdvanceTimerRef = useRef(null);
  const gameTimerRef = useRef(null);
  const advancingRef = useRef(false);

  const resetGameplay = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    advancingRef.current = false;
    setGameQuestions([]);
    setCurrentQIdx(0);
    setSelectedOption(null);
    setIsAnswerEvaluated(false);
    setIsEliminated(false);
    setBossHitEffect(null);
    setUserScore(0);
    setCurrentStreak(0);
    setCorrectCount(0);
    setQuestionAnswersRecord([]);
    setShowPostSprintReview(false);
    if (resetProctoring) resetProctoring();
  };

  // Synchronize multiplayer Boss HP and Team Scores from room activeChallenge polling
  useEffect(() => {
    const ch = room?.activeChallenge;
    if (!ch) return;
    if (ch.bossCurrentHp !== undefined && ch.bossCurrentHp !== null) {
      setBossHp(ch.bossCurrentHp);
    }
    if (ch.bossMaxHp) setBossMaxHp(ch.bossMaxHp);
    if (ch.gameMode === 'TEAMS' && ch.leaderboard?.length > 0) {
      const alpha = ch.leaderboard.filter(e => e.team === 'ALPHA').reduce((s, e) => s + (e.score || 0), 0);
      const beta = ch.leaderboard.filter(e => e.team === 'BETA').reduce((s, e) => s + (e.score || 0), 0);
      if (alpha > 0 || beta > 0) {
        setTeamAlphaScore(alpha);
        setTeamBetaScore(beta);
      }
    }
  }, [room?.activeChallenge]);

  const handleStartChallenge = async (challengeToPlay) => {
    try {
      if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          if (setIsFullscreenActive) setIsFullscreenActive(true);
        }).catch(() => {});
      }
    } catch (e) {}

    const ch = challengeToPlay || room?.activeChallenge;
    if (!ch) return;

    apiFetch(`/api/rooms/${roomIdOrCode}/challenge/start`, { method: 'POST' }).catch(() => {});
    setRoom(prev => (prev ? {
      ...prev,
      activeChallenge: prev.activeChallenge ? { ...prev.activeChallenge, status: 'IN_PROGRESS' } : null
    } : prev));

    if (resetProctoring) resetProctoring();

    try {
      toast.info('Loading challenge questions...');
      const targetExamIds = (ch.examIds && ch.examIds.length > 0)
        ? ch.examIds
        : (ch.examId ? [ch.examId] : (selectedExamIds?.length > 0 ? selectedExamIds : []));

      let qs = [];
      if (targetExamIds.length > 0) {
        const responses = await Promise.all(
          targetExamIds.map(id =>
            apiFetch(`/api/questions?examId=${id}&limit=100`)
              .then(r => r.json())
              .catch(() => ({ data: [] }))
          )
        );
        responses.forEach(jsonRes => {
          const list = jsonRes.data?.data || jsonRes.data || [];
          if (Array.isArray(list)) qs.push(...list);
        });
      } else {
        const res = await apiFetch('/api/questions?limit=100');
        const json = await res.json();
        qs = json.data?.data || json.data || [];
      }

      if (!qs || qs.length === 0) {
        const fallbackRes = await apiFetch('/api/questions?limit=100');
        const fallbackJson = await fallbackRes.json();
        qs = fallbackJson.data?.data || fallbackJson.data || [];
      }

      qs = qs.filter(q => !isMSQQuestion(q));

      for (let i = qs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qs[i], qs[j]] = [qs[j], qs[i]];
      }

      if (ch.questionIds && ch.questionIds.length > 0) {
        const idSet = new Set(ch.questionIds);
        qs = qs.filter(q => idSet.has(q.id || q._id));
      } else {
        qs = qs.slice(0, ch.questionCount || 10);
      }

      qs = qs.filter(q => !isMSQQuestion(q));

      if (qs.length === 0) {
        toast.error('No questions found for this challenge.');
        return;
      }

      const chMode = (ch.gameMode || 'STANDARD').toUpperCase();
      if (chMode === 'BOSS') {
        const initialBossHp = ch.bossCurrentHp || ch.bossMaxHp || 1000;
        setBossHp(initialBossHp);
        setBossMaxHp(ch.bossMaxHp || 1000);
        setBossHitEffect(null);
      } else if (chMode === 'SURVIVAL') {
        setSurvivalLives(1);
        setIsEliminated(false);
      } else if (chMode === 'TEAMS') {
        const userIdx = (participantsList || []).findIndex(p => p.userId === currentUserId);
        const assigned = ch.teamAssignments?.[currentUserId] || (userIdx % 2 === 0 ? 'ALPHA' : 'BETA');
        setMyTeam(assigned);
        setTeamAlphaScore(0);
        setTeamBetaScore(0);
      }

      setGameQuestions(qs);
      setCurrentQIdx(0);
      setSelectedOption(null);
      setIsAnswerEvaluated(false);
      setIsEliminated(false);
      setUserScore(0);
      setCurrentStreak(0);
      setCorrectCount(0);
      setQTimeLeft(ch.perQuestionSeconds || 30);
      setCheckpointNextIdx(5);
      setQuestionAnswersRecord([]);
      setShowPostSprintReview(false);
      setStageState('live_question');

      if (setIsFullscreenActive) setIsFullscreenActive(true);
      if (setIsProctoredActive) setIsProctoredActive(true);
    } catch (err) {
      toast.error('Failed to load challenge questions');
    }
  };

  const handleAdvanceQuestion = useCallback((isTimeout = false, overrideOption = null) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (advancingRef.current || stageState !== 'live_question') return;
    advancingRef.current = true;
    setTimeout(() => { advancingRef.current = false; }, 500);

    const currentQ = gameQuestions[currentQIdx];
    if (!currentQ) return;

    const limit = room?.activeChallenge?.perQuestionSeconds || 30;
    const isNeg = Boolean(room?.activeChallenge?.negativeMarking);

    let pointsGained = 0;
    let isCorrect = false;

    const chosenOption = overrideOption !== null ? overrideOption : selectedOption;

    if (!isTimeout && chosenOption !== null) {
      const correctIdx = getSingleCorrectAnswerIndex(currentQ);
      isCorrect = chosenOption === correctIdx;

      if (isCorrect) {
        pointsGained = 100 + (qTimeLeft * 6) + (currentStreak * 10);
        setCurrentStreak(prev => prev + 1);
        setCorrectCount(prev => prev + 1);
      } else {
        if (isNeg) {
          pointsGained = -25;
        }
        setCurrentStreak(0);
      }
    } else {
      setCurrentStreak(0);
      const chMode = (room?.activeChallenge?.gameMode || 'STANDARD').toUpperCase();
      if (chMode === 'SURVIVAL' && !isEliminated) {
        setSurvivalLives(0);
        setIsEliminated(true);
        toast.warning('Time expired in sudden-death! You are now in spectator mode.');
        apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEliminated: true })
        }).catch(() => {});
      }
      if (chMode === 'BOSS') {
        setBossHp(prev => Math.min(bossMaxHp, prev + 50));
        setBossHitEffect({ type: 'HEAL', text: '+50 Boss Heal' });
        setTimeout(() => setBossHitEffect(null), 1200);
        apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bossDamageDelta: -50 })
        }).catch(() => {});
      }
    }

    const updatedScore = Math.max(0, userScore + pointsGained);
    setUserScore(updatedScore);

    setQuestionAnswersRecord(prev => [
      ...prev,
      {
        question: currentQ,
        selectedOption: isTimeout ? null : chosenOption,
        isCorrect,
        isTimeout,
        timeSpent: limit - qTimeLeft,
      }
    ]);

    apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        score: updatedScore,
        questionsAnswered: currentQIdx + 1,
        correctCount: isCorrect ? correctCount + 1 : correctCount,
        avgSpeedSeconds: Number(((limit - qTimeLeft)).toFixed(1)),
      })
    }).catch(() => {});

    if (currentQIdx >= gameQuestions.length - 1) {
      setStageState('final');
      try {
        if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (e) {}
      if (setIsFullscreenActive) setIsFullscreenActive(false);
      if (setIsProctoredActive) setIsProctoredActive(false);
      fetchRoomData();
    } else if (currentQIdx + 1 === checkpointNextIdx && currentQIdx + 1 < gameQuestions.length) {
      setStageState('checkpoint');
      fetchRoomData();
    } else {
      setCurrentQIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerEvaluated(false);
      setQTimeLeft(limit);
    }
  }, [stageState, gameQuestions, currentQIdx, room, selectedOption, qTimeLeft, currentStreak, userScore, correctCount, checkpointNextIdx, roomIdOrCode, fetchRoomData, isEliminated, bossMaxHp, setIsFullscreenActive, setIsProctoredActive, setStageState, toast]);

  const handleOptionClick = (oIdx) => {
    if (isAnswerEvaluated || isEliminated) return;

    setSelectedOption(oIdx);
    setIsAnswerEvaluated(true);

    const currentQ = gameQuestions[currentQIdx];
    const correctAnswers = currentQ?.answer || [];
    const isCorrect = correctAnswers.includes(oIdx);

    playFeedbackSound(isCorrect);

    const chMode = (room?.activeChallenge?.gameMode || 'STANDARD').toUpperCase();

    if (chMode === 'BOSS') {
      const dmg = isCorrect ? (100 + (qTimeLeft * 2)) : 0;
      if (isCorrect) {
        setBossHp(prev => Math.max(0, prev - dmg));
        setBossHitEffect({ type: 'DMG', text: `-${dmg} HP Hit!` });
        setTimeout(() => setBossHitEffect(null), 1200);
        apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bossDamageDelta: dmg })
        }).catch(() => {});
      } else {
        setBossHp(prev => Math.min(bossMaxHp, prev + 50));
        setBossHitEffect({ type: 'HEAL', text: '+50 Boss Heal' });
        setTimeout(() => setBossHitEffect(null), 1200);
        apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bossDamageDelta: -50 })
        }).catch(() => {});
      }
    }

    if (chMode === 'SURVIVAL' && !isCorrect) {
      setSurvivalLives(0);
      setIsEliminated(true);
      toast.warning('Eliminated in sudden-death! You are now in spectator mode.');
      apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEliminated: true })
      }).catch(() => {});
    }

    if (chMode === 'TEAMS' && isCorrect) {
      const pts = 100 + (qTimeLeft * 6);
      if (myTeam === 'ALPHA') setTeamAlphaScore(prev => prev + pts);
      else setTeamBetaScore(prev => prev + pts);
      apiFetch(`/api/rooms/${roomIdOrCode}/challenge/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: pts, team: myTeam })
      }).catch(() => {});
    }

    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      handleAdvanceQuestion(false, oIdx);
    }, 1100);
  };

  // In-Game Countdown Timer
  useEffect(() => {
    if (stageState !== 'live_question') {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      return;
    }

    gameTimerRef.current = setInterval(() => {
      setQTimeLeft(prev => {
        if (prev <= 1) {
          setTimeout(() => {
            handleAdvanceQuestion(true);
          }, 0);
          return room?.activeChallenge?.perQuestionSeconds || 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [stageState, currentQIdx, room, handleAdvanceQuestion]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (stageState !== 'live_question') return;

    const handleKeyDown = (e) => {
      if (['1', 'a', 'A'].includes(e.key)) setSelectedOption(0);
      else if (['2', 'b', 'B'].includes(e.key)) setSelectedOption(1);
      else if (['3', 'c', 'C'].includes(e.key)) setSelectedOption(2);
      else if (['4', 'd', 'D'].includes(e.key)) setSelectedOption(3);
      else if (e.key === 'Enter' && selectedOption !== null) {
        handleAdvanceQuestion(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stageState, selectedOption, handleAdvanceQuestion]);

  const resumeFromCheckpoint = () => {
    setCheckpointNextIdx(prev => prev + 5);
    setCurrentQIdx(prev => prev + 1);
    setSelectedOption(null);
    setIsAnswerEvaluated(false);
    setQTimeLeft(room?.activeChallenge?.perQuestionSeconds || 30);
    setStageState('live_question');
  };

  const handleSaveMissedToVault = async () => {
    const missed = questionAnswersRecord.filter(q => !q.isCorrect);
    if (missed.length === 0) {
      toast.info('No missed questions in this sprint! Perfect score!');
      return;
    }

    setSavingVault(true);
    try {
      for (const item of missed) {
        await apiFetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: item.question.scenario,
            options: item.question.options,
            answer: item.question.answer,
            explanation: item.question.explanation,
            tags: ['StudyRoom', room?.title, room?.roomCode],
            difficulty: 'MEDIUM',
          })
        }).catch(() => {});
      }
      toast.success(`Saved ${missed.length} missed question${missed.length > 1 ? 's' : ''} to your Knowledge Vault!`);
    } catch (err) {
      toast.error('Failed to save to Vault');
    } finally {
      setSavingVault(false);
    }
  };

  const handleShareVictoryCard = () => {
    const text = `🏆 NextLevel Collaborative Study Rooms | Sprint Result\n\nRoom: ${room?.title} (${room?.roomCode})\nScore: ${userScore} pts | Accuracy: ${Math.round((correctCount / (gameQuestions.length || 1)) * 100)}%\nMode: ${room?.activeChallenge?.gameMode || 'OA Blitz'}\n\nCo-working and multiplayer practice on NextLevel! 🚀`;
    navigator.clipboard.writeText(text);
    setCopiedVictoryCard(true);
    toast.success('Victory card copied to clipboard!');
    setTimeout(() => setCopiedVictoryCard(false), 3000);
  };

  return {
    gameQuestions, currentQIdx, selectedOption, setSelectedOption,
    isAnswerEvaluated, isEliminated, survivalLives,
    bossHp, setBossHp, bossMaxHp, bossHitEffect,
    myTeam, teamAlphaScore, setTeamAlphaScore, teamBetaScore, setTeamBetaScore,
    userScore, currentStreak, correctCount, qTimeLeft, checkpointNextIdx,
    questionAnswersRecord, showPostSprintReview, setShowPostSprintReview,
    savingVault, copiedVictoryCard,
    handleStartChallenge, handleAdvanceQuestion, handleOptionClick,
    resumeFromCheckpoint, handleSaveMissedToVault, handleShareVictoryCard,
    resetGameplay
  };
}
