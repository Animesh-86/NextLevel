'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { extractQuestionsFromJson } from '@/lib/questionParser';

export function useTestUpload({ toast, setTimeMinutes }) {
  const [exams, setExams] = useState([]);
  const [selectedExams, setSelectedExams] = useState(['all']);
  const [historySearch, setHistorySearch] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [configLoading, setConfigLoading] = useState(true);
  const [deleteExamId, setDeleteExamId] = useState(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteProcessing, setPasteProcessing] = useState(false);
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null); // { file }
  const [uploadName, setUploadName] = useState('');

  // Fetch exams on mount & listen for updates from room/sprints
  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('/api/exams');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setExams(data.data);
          const firstId = data.data[0].id || data.data[0]._id;
          setSelectedExams(prev => {
            if (prev.length === 0 || (prev.length === 1 && prev[0] === 'all')) {
              return firstId ? [firstId] : ['all'];
            }
            return prev;
          });
          if (setTimeMinutes) {
            setTimeMinutes(prev => prev || data.data[0].timeLimit || 60);
          }
        }
      } catch (err) {
        toast.error('Failed to load exams');
      }
      setConfigLoading(false);
    }
    load();

    const handleVaultSync = () => {
      load();
    };
    window.addEventListener('vault-updated', handleVaultSync);
    window.addEventListener('storage', handleVaultSync);
    return () => {
      window.removeEventListener('vault-updated', handleVaultSync);
      window.removeEventListener('storage', handleVaultSync);
    };
  }, [setTimeMinutes, toast]);

  const handleDeleteExam = useCallback(async (examId) => {
    if (!examId || examId === 'all') return;
    setDeleteExamId(examId);
  }, []);

  const confirmDeleteExam = useCallback(async () => {
    const examId = deleteExamId;
    setDeleteExamId(null);
    if (!examId) return;

    try {
      const res = await apiFetch(`/api/exams/${examId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Document deleted successfully');
        setExams(prev => prev.filter(e => (e.id || e._id) !== examId));
        if (selectedExams.includes(examId)) {
          setSelectedExams(prev => {
            const next = prev.filter(id => id !== examId);
            return next.length ? next : ['all'];
          });
        }
      } else {
        toast.error('Failed to delete document');
      }
    } catch (err) {
      toast.error('Failed to delete document');
    }
  }, [deleteExamId, selectedExams, toast]);

  const saveQuestionsToBackend = async (questionsArray, title, toastId) => {
    if (!questionsArray || questionsArray.length === 0) {
      throw new Error('No questions could be extracted or generated.');
    }

    toast.loading('Creating document group...', { id: toastId });

    const examRes = await apiFetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: `Questions from ${title}`,
        timeLimit: 60,
        isPublic: false
      })
    });
    const examData = await examRes.json();

    if (!examData.success) {
      throw new Error(examData.error || 'Failed to create document group');
    }
    const newExam = examData.data;
    const questionsWithExam = questionsArray.map(q => ({ ...q, examId: newExam._id || newExam.id }));

    toast.loading(`Saving ${questionsWithExam.length} questions...`, { id: toastId });

    const res = await apiFetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionsWithExam)
    });
    const data = await res.json();

    if (data.success) {
      toast.success(`Successfully added ${questionsWithExam.length} questions!`, { id: toastId });
      const examWithCount = {
        ...newExam,
        questionCount: questionsWithExam.length,
        totalQuestions: questionsWithExam.length
      };
      setExams(prev => [examWithCount, ...prev]);
      setSelectedExams([newExam._id || newExam.id]);

      try {
        window.dispatchEvent(new CustomEvent('vault-updated', { detail: { exam: examWithCount } }));
        localStorage.setItem('vault_last_updated', Date.now().toString());
      } catch (e) {}
    } else {
      throw new Error(data.error || 'Failed to save questions');
    }
  };

  const handleUploadQuestions = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const suggestedName = file.name.replace(/\.[^/.]+$/, '');
    setPendingUpload({ file });
    setUploadName(suggestedName);
  };

  const confirmUpload = async () => {
    if (!pendingUpload) return;
    const { file } = pendingUpload;
    const docTitle = uploadName.trim() || file.name.replace(/\.[^/.]+$/, '');

    if (exams.some(e => e.title === docTitle)) {
      toast.error(`A document named "${docTitle}" already exists.`);
      return;
    }

    setPendingUpload(null);
    setUploadName('');
    const toastId = toast.loading(`Processing ${file.name}...`);

    try {
      let questionsArray = [];

      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        questionsArray = extractQuestionsFromJson(json);
        if (questionsArray.length === 0) {
          throw new Error('No valid questions found in the JSON file. Ensure questions have a scenario/question prompt and options.');
        }
      } else {
        const formData = new FormData();
        formData.append('file', file);

        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          body: formData
        });
        const extractData = await extractRes.json();

        if (!extractData.success) {
          throw new Error(extractData.error || 'Failed to extract text from document');
        }

        toast.loading('Analyzing questions with AI...', { id: toastId });

        const genRes = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: extractData.text })
        });
        const genData = await genRes.json();

        if (!genData.success) {
          throw new Error(genData.error || 'Failed to generate questions');
        }

        questionsArray = genData.data;
      }

      await saveQuestionsToBackend(questionsArray, docTitle, toastId);
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;

    try {
      const parsedJson = JSON.parse(pasteText.trim());
      const questions = extractQuestionsFromJson(parsedJson);

      if (questions && questions.length > 0) {
        setPasteProcessing(true);
        const toastId = toast.loading(`Saving ${questions.length} pasted questions...`);

        const title = pasteTitle.trim() || `Pasted JSON ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
        await saveQuestionsToBackend(questions, title, toastId);
        setShowPasteModal(false);
        setPasteText('');
        setPasteTitle('');
        setPasteProcessing(false);
        return;
      }
    } catch (e) {
      // Continue to AI parsing
    }

    setPasteProcessing(true);
    const toastId = toast.loading('Analyzing pasted questions with AI...');

    try {
      const genRes = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText })
      });
      const genData = await genRes.json();

      if (!genData.success) {
        throw new Error(genData.error || 'Failed to parse questions');
      }

      const title = pasteTitle.trim() || `Pasted ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      await saveQuestionsToBackend(genData.data, title, toastId);
      setShowPasteModal(false);
      setPasteText('');
      setPasteTitle('');
    } catch (err) {
      toast.error(err.message || 'Failed to process pasted questions', { id: toastId });
    } finally {
      setPasteProcessing(false);
    }
  };

  return {
    exams,
    selectedExams,
    setSelectedExams,
    historySearch,
    setHistorySearch,
    sourceSearch,
    setSourceSearch,
    configLoading,
    deleteExamId,
    setDeleteExamId,
    showPasteModal,
    setShowPasteModal,
    pasteText,
    setPasteText,
    pasteTitle,
    setPasteTitle,
    pasteProcessing,
    showFormatGuide,
    setShowFormatGuide,
    pendingUpload,
    setPendingUpload,
    uploadName,
    setUploadName,
    handleDeleteExam,
    confirmDeleteExam,
    handleUploadQuestions,
    confirmUpload,
    handlePasteSubmit,
  };
}
