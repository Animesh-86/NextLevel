'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { extractQuestionsFromJson } from '@/lib/questionParser';
import { isMSQQuestion } from '../utils/msqHelpers';

export function useRoomDocumentUpload() {
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [examSearchQuery, setExamSearchQuery] = useState('');

  // Upload modal states
  const fileInputRef = useRef(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploadName, setUploadName] = useState('');

  // Paste modal states
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteProcessing, setPasteProcessing] = useState(false);

  // Load exams for challenge selection
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await apiFetch('/api/exams');
        const json = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setExams(json.data);
          const firstId = json.data[0].id || json.data[0]._id;
          setSelectedExamIds(prev => (prev && prev.length > 0 ? prev : [firstId]));
          setSelectedExamId(prev => prev || firstId);
          setCustomTitle(prev => prev || (json.data[0].title + ' Sprint'));
        }
      } catch (err) {}
    }
    loadExams();

    const handleVaultSync = () => {
      loadExams();
    };
    window.addEventListener('vault-updated', handleVaultSync);
    window.addEventListener('storage', handleVaultSync);
    return () => {
      window.removeEventListener('vault-updated', handleVaultSync);
      window.removeEventListener('storage', handleVaultSync);
    };
  }, []);

  const saveQuestionsToVault = async (questionsArray, docTitle, toastId) => {
    const filteredQuestions = (questionsArray || []).filter(q => !isMSQQuestion(q));
    if (filteredQuestions.length === 0) {
      throw new Error('No single-choice questions found. All extracted questions were multiple-select (MSQs).');
    }

    toast.loading('Creating document group...', { id: toastId });
    const examRes = await apiFetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: docTitle,
        description: `Questions from ${docTitle}`,
        timeLimit: 60,
        isPublic: false
      })
    });
    const examData = await examRes.json();
    if (!examData.success) {
      throw new Error(examData.error || 'Failed to create vault document');
    }
    const newExam = examData.data;

    const questionsWithExam = filteredQuestions.map(q => ({
      ...q,
      examId: newExam._id || newExam.id
    }));

    toast.loading(`Saving ${questionsWithExam.length} questions...`, { id: toastId });
    const qRes = await apiFetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionsWithExam)
    });
    const qData = await qRes.json();

    if (qData.success) {
      toast.success(`Successfully added "${docTitle}" (${questionsWithExam.length} Qs)!`, { id: toastId });
      const examWithMeta = {
        ...newExam,
        questionCount: questionsWithExam.length,
        totalQuestions: questionsWithExam.length
      };
      setExams(prev => [examWithMeta, ...prev]);
      setSelectedExamIds(prev => [newExam._id || newExam.id, ...prev]);
      setCustomTitle(`${docTitle} Sprint`);

      try {
        window.dispatchEvent(new CustomEvent('vault-updated', { detail: { exam: examWithMeta } }));
        localStorage.setItem('vault_last_updated', Date.now().toString());
      } catch (e) {}

      return examWithMeta;
    } else {
      throw new Error(qData.error || 'Failed to save questions to vault');
    }
  };

  const handleUploadDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const suggested = file.name.replace(/\.[^/.]+$/, '');
    setPendingUpload({ file });
    setUploadName(suggested);
  };

  const confirmDocumentUpload = async () => {
    if (!pendingUpload) return;
    const { file } = pendingUpload;
    const docTitle = uploadName.trim() || file.name.replace(/\.[^/.]+$/, '');

    if (exams.some(e => e.title === docTitle)) {
      toast.error(`A document named "${docTitle}" already exists.`);
      return;
    }

    setPendingUpload(null);
    setUploadName('');
    setIsUploadingDoc(true);
    const toastId = toast.loading(`Processing ${file.name}...`);

    try {
      let questionsArray = [];

      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        questionsArray = extractQuestionsFromJson(json);
        if (questionsArray.length === 0) {
          throw new Error('No valid questions found in JSON file.');
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

      await saveQuestionsToVault(questionsArray, docTitle, toastId);
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: toastId });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;

    try {
      const parsedJson = JSON.parse(pasteText.trim());
      const questions = extractQuestionsFromJson(parsedJson);

      if (questions && questions.length > 0) {
        setPasteProcessing(true);
        const toastId = toast.loading(`Processing ${questions.length} pasted questions...`);
        const docTitle = pasteTitle.trim() || `Pasted Test ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

        if (exams.some(e => e.title === docTitle)) {
          toast.error(`A document named "${docTitle}" already exists.`, { id: toastId });
          setPasteProcessing(false);
          return;
        }

        await saveQuestionsToVault(questions, docTitle, toastId);
        setShowPasteModal(false);
        setPasteText('');
        setPasteTitle('');
        setPasteProcessing(false);
        return;
      }
    } catch (e) {}

    setPasteProcessing(true);
    const toastId = toast.loading('Analyzing parsed questions with AI...');

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

      const docTitle = pasteTitle.trim() || `Pasted ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

      if (exams.some(e => e.title === docTitle)) {
        toast.error(`A document named "${docTitle}" already exists.`, { id: toastId });
        setPasteProcessing(false);
        return;
      }

      await saveQuestionsToVault(genData.data, docTitle, toastId);
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
    setExams,
    selectedExamIds,
    setSelectedExamIds,
    selectedExamId,
    setSelectedExamId,
    customTitle,
    setCustomTitle,
    examSearchQuery,
    setExamSearchQuery,
    fileInputRef,
    isUploadingDoc,
    pendingUpload,
    setPendingUpload,
    uploadName,
    setUploadName,
    showPasteModal,
    setShowPasteModal,
    pasteTitle,
    setPasteTitle,
    pasteText,
    setPasteText,
    pasteProcessing,
    handleUploadDocumentChange,
    confirmDocumentUpload,
    handlePasteSubmit
  };
}
