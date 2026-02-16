import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, Calendar, Clock, CheckCircle, Circle, Trash2, Brain, TrendingUp, Download, Upload, Users, Award, FileText, MessageSquare, Play, Pause, X, Send, Loader } from 'lucide-react';

// localStorage helper (replaces window.storage for real deployment)
const storage = {
  get: (key) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { console.error('Storage error', e); }
  }
};

export default function Discussant() {
  const [activeTab, setActiveTab] = useState('today');
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [files, setFiles] = useState([]);
  const [userName, setUserName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [studyTimer, setStudyTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentStudySubject, setCurrentStudySubject] = useState(null);
  const timerRef = useRef(null);
  const [newSubject, setNewSubject] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [topicNotes, setTopicNotes] = useState('');

  const templates = {
    year1: {
      name: 'Medical School Year 1',
      subjects: [
        { name: 'Anatomy', topics: ['Upper Limb', 'Lower Limb', 'Head & Neck', 'Thorax', 'Abdomen', 'Pelvis'] },
        { name: 'Physiology', topics: ['Cardiovascular', 'Respiratory', 'Renal', 'Neurophysiology', 'Endocrine'] },
        { name: 'Biochemistry', topics: ['Metabolism', 'Proteins', 'Carbohydrates', 'Lipids', 'Enzymes'] },
        { name: 'Histology', topics: ['Epithelial Tissue', 'Connective Tissue', 'Muscle Tissue', 'Nervous Tissue'] },
        { name: 'Embryology', topics: ['Early Development', 'Organogenesis', 'Congenital Abnormalities'] }
      ]
    },
    year2: {
      name: 'Medical School Year 2',
      subjects: [
        { name: 'Pathology', topics: ['Cell Injury', 'Inflammation', 'Neoplasia', 'Immunopathology'] },
        { name: 'Pharmacology', topics: ['ANS Drugs', 'CNS Drugs', 'Antibiotics', 'Cardiovascular Drugs'] },
        { name: 'Microbiology', topics: ['Bacteria', 'Viruses', 'Fungi', 'Parasites'] },
        { name: 'Clinical Skills', topics: ['History Taking', 'Physical Examination', 'Communication'] }
      ]
    },
    surgery: {
      name: 'Surgery Rotation',
      subjects: [
        { name: 'General Surgery', topics: ['Acute Abdomen', 'Hernias', 'Breast Disease', 'Thyroid', 'GI Surgery'] },
        { name: 'Trauma', topics: ['ATLS Protocols', 'Head Trauma', 'Chest Trauma', 'Abdominal Trauma'] },
        { name: 'Surgical Techniques', topics: ['Suturing', 'Knot Tying', 'Sterile Technique', 'Pre-op Assessment'] },
        { name: 'Vascular Surgery', topics: ['Peripheral Arterial Disease', 'Aneurysms', 'Venous Disease'] }
      ]
    },
    internal: {
      name: 'Internal Medicine',
      subjects: [
        { name: 'Cardiology', topics: ['Heart Failure', 'Arrhythmias', 'CAD', 'Valvular Disease'] },
        { name: 'Pulmonology', topics: ['COPD', 'Asthma', 'Pneumonia', 'PE/DVT'] },
        { name: 'Gastroenterology', topics: ['GI Bleeding', 'IBD', 'Liver Disease', 'Pancreatitis'] },
        { name: 'Nephrology', topics: ['AKI', 'CKD', 'Electrolyte Disorders', 'Acid-Base'] },
        { name: 'Endocrinology', topics: ['Diabetes', 'Thyroid Disorders', 'Adrenal Disorders'] }
      ]
    },
    pediatrics: {
      name: 'Pediatrics Rotation',
      subjects: [
        { name: 'Neonatology', topics: ['Newborn Assessment', 'Jaundice', 'Respiratory Distress'] },
        { name: 'Growth & Development', topics: ['Milestones', 'Failure to Thrive', 'Developmental Delays'] },
        { name: 'Pediatric Emergency', topics: ['Fever', 'Dehydration', 'Seizures'] },
        { name: 'Common Illnesses', topics: ['Viral Infections', 'Otitis Media', 'Asthma', 'GERD'] }
      ]
    },
    obgyn: {
      name: 'OB/GYN Rotation',
      subjects: [
        { name: 'Obstetrics', topics: ['Prenatal Care', 'Labor & Delivery', 'Complications', 'Postpartum'] },
        { name: 'Gynecology', topics: ['Menstrual Disorders', 'Contraception', 'Fibroids', 'PCOS'] },
        { name: 'Gyn Oncology', topics: ['Cervical Cancer', 'Ovarian Cancer', 'Endometrial Cancer'] }
      ]
    },
    psychiatry: {
      name: 'Psychiatry Rotation',
      subjects: [
        { name: 'Mood Disorders', topics: ['Major Depression', 'Bipolar Disorder', 'Suicide Assessment'] },
        { name: 'Anxiety Disorders', topics: ['GAD', 'Panic Disorder', 'PTSD', 'OCD'] },
        { name: 'Psychotic Disorders', topics: ['Schizophrenia', 'Schizoaffective Disorder'] },
        { name: 'Psychopharmacology', topics: ['Antidepressants', 'Antipsychotics', 'Mood Stabilizers'] }
      ]
    },
    usmle: {
      name: 'USMLE Step 1 Prep',
      subjects: [
        { name: 'Cardiology', topics: ['Anatomy', 'Physiology', 'Pathology', 'Pharmacology'] },
        { name: 'Pulmonology', topics: ['Anatomy', 'Physiology', 'Pathology', 'Pharmacology'] },
        { name: 'Neurology', topics: ['Anatomy', 'Physiology', 'Pathology', 'Pharmacology'] },
        { name: 'Behavioral Science', topics: ['Ethics', 'Statistics', 'Psychology'] }
      ]
    },
    blank: { name: 'Start From Scratch', subjects: [] }
  };

  useEffect(() => {
    const savedSubjects = storage.get('subjects');
    const savedTopics = storage.get('topics');
    const savedSessions = storage.get('sessions');
    const savedFiles = storage.get('files');
    const savedName = storage.get('userName');
    const tutorialSeen = storage.get('tutorialSeen');

    if (savedSubjects) setSubjects(savedSubjects);
    if (savedTopics) setTopics(savedTopics);
    if (savedSessions) setStudySessions(savedSessions);
    if (savedFiles) setFiles(savedFiles);
    if (savedName) {
      setUserName(savedName);
      if (!tutorialSeen) setShowTutorial(true);
    } else {
      setShowNamePrompt(true);
    }
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setStudyTimer(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const setAndSaveSubjects = (data) => { setSubjects(data); storage.set('subjects', data); };
  const setAndSaveTopics = (data) => { setTopics(data); storage.set('topics', data); };
  const setAndSaveSessions = (data) => { setStudySessions(data); storage.set('sessions', data); };
  const setAndSaveFiles = (data) => { setFiles(data); storage.set('files', data); };

  const saveUserName = (name) => {
    setUserName(name);
    storage.set('userName', name);
    setShowNamePrompt(false);
    if (!storage.get('subjects') || storage.get('subjects').length === 0) {
      setShowTemplates(true);
    } else {
      setShowTutorial(true);
    }
  };

  const completeTutorial = () => {
    storage.set('tutorialSeen', true);
    setShowTutorial(false);
  };

  const loadTemplate = (key) => {
    const template = templates[key];
    if (!template || key === 'blank') { setShowTemplates(false); return; }

    const newSubjects = [];
    const newTopics = [];
    const base = Date.now();

    template.subjects.forEach((sub, si) => {
      const subId = base + si;
      newSubjects.push({ id: subId, name: sub.name, createdAt: new Date().toISOString() });
      sub.topics.forEach((title, ti) => {
        newTopics.push({
          id: base + si * 1000 + ti,
          subjectId: subId,
          title,
          notes: '',
          dateAdded: new Date().toISOString(),
          mastered: false,
          lastReviewed: null,
          reviewCount: 0
        });
      });
    });

    setAndSaveSubjects(newSubjects);
    setAndSaveTopics(newTopics);
    setShowTemplates(false);
    setShowTutorial(true);
  };

 
  const handleFileUpload = (e) => {
  const uploaded = Array.from(e.target.files);
  if (!selectedSubject || !uploaded.length) {
    alert('Select a subject first!');
    return;
  }
  uploaded.forEach(file => {
    const objectUrl = URL.createObjectURL(file);
    const newFile = {
      id: Date.now() + Math.random(),
      subjectId: parseInt(selectedSubject),
      name: file.name,
      type: file.type,
      size: file.size,
      data: objectUrl,       // ← object URL, not base64
      uploadedAt: new Date().toISOString(),
      readTime: 0
    };
    // Save metadata only (no file data) to localStorage
    const meta = { ...newFile, data: null };
    setAndSaveFiles([...files, meta]);
    // Keep full file with URL in memory for this session
    setFiles(prev => [...prev.filter(f => f.id !== newFile.id), newFile]);
  });
  e.target.value = '';
};

  const openFile = (file) => {
    setViewingFile(file);
    setCurrentStudySubject(file.subjectId);
    setStudyTimer(0);
    setTimerRunning(true);
    setShowAIChat(false);
    setAiMessages([{
      role: 'assistant',
      content: `Hi! I'm your AI tutor. I'm here to help you study "${file.name}". Ask me anything!`
    }]);
  };

  const closeFile = () => {
    if (timerRunning && studyTimer > 0) {
      const mins = Math.floor(studyTimer / 60);
      const session = {
        id: Date.now(),
        subjectId: currentStudySubject,
        duration: mins || 1,
        date: new Date().toISOString(),
        fileName: viewingFile?.name
      };
      setAndSaveSessions([...studySessions, session]);
      const updatedFiles = files.map(f =>
        f.id === viewingFile.id ? { ...f, readTime: f.readTime + studyTimer } : f
      );
      setAndSaveFiles(updatedFiles);
    }
    setViewingFile(null);
    setTimerRunning(false);
    setStudyTimer(0);
    setShowAIChat(false);
    setAiMessages([]);
  };

  const askAI = async () => {
    if (!aiInput.trim()) return;
    const userMsg = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a medical education tutor. The student is studying "${viewingFile?.name}". Give clear concise answers suitable for medical students.`,
          messages: aiMessages.concat(userMsg).map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.content[0].text }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    }
    setAiLoading(false);
  };

  const addSubject = () => {
    if (!newSubject.trim()) return;
    const sub = { id: Date.now(), name: newSubject, createdAt: new Date().toISOString() };
    setAndSaveSubjects([...subjects, sub]);
    setNewSubject('');
  };

  const addTopic = () => {
    if (!newTopic.trim() || !selectedSubject) return;
    const topic = {
      id: Date.now(),
      subjectId: parseInt(selectedSubject),
      title: newTopic,
      notes: topicNotes,
      dateAdded: new Date().toISOString(),
      mastered: false,
      lastReviewed: null,
      reviewCount: 0
    };
    setAndSaveTopics([...topics, topic]);
    setNewTopic('');
    setTopicNotes('');
  };

  const toggleMastered = (id) => setAndSaveTopics(topics.map(t => t.id === id ? { ...t, mastered: !t.mastered } : t));
  const markReviewed = (id) => setAndSaveTopics(topics.map(t => t.id === id ? { ...t, lastReviewed: new Date().toISOString(), reviewCount: t.reviewCount + 1 } : t));
  const deleteTopic = (id) => setAndSaveTopics(topics.filter(t => t.id !== id));
  const deleteFile = (id) => setAndSaveFiles(files.filter(f => f.id !== id));
  const deleteSubject = (id) => {
    setAndSaveSubjects(subjects.filter(s => s.id !== id));
    setAndSaveTopics(topics.filter(t => t.subjectId !== id));
    setAndSaveSessions(studySessions.filter(s => s.subjectId !== id));
    setAndSaveFiles(files.filter(f => f.subjectId !== id));
  };

  const getSubjectName = (id) => subjects.find(s => s.id === parseInt(id))?.name || '';
  const getTodayTopics = () => topics.filter(t => new Date(t.dateAdded).toDateString() === new Date().toDateString());
  const getNeedsReview = () => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 3);
    return topics.filter(t => !t.mastered && (!t.lastReviewed || new Date(t.lastReviewed) < cutoff));
  };
  const getTotalStudyTime = () => studySessions.reduce((sum, s) => sum + s.duration, 0);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ userName, subjects, topics, studySessions, exportDate: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `discussant-${userName.replace(/\s/g,'-')}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.subjects) setAndSaveSubjects(d.subjects);
        if (d.topics) setAndSaveTopics(d.topics);
        if (d.studySessions) setAndSaveSessions(d.studySessions);
        alert('Imported successfully!');
      } catch { alert('Error importing file.'); }
    };
    reader.readAsText(file);
  };

  const copyShare = () => {
    navigator.clipboard.writeText(`Check out Discussant - a study platform built for med school!\n\n• Pre-loaded templates for all years & rotations\n• Upload files (PDFs, slides, notes)\n• Auto study timer\n• AI tutor for instant help\n• Progress tracking\n\nVisit: https://discussant.vercel.app`);
    alert('Copied!');
  };

  const stats = {
    total: topics.length,
    mastered: topics.filter(t => t.mastered).length,
    studyTime: getTotalStudyTime(),
    thisWeek: topics.filter(t => new Date(t.dateAdded) > new Date(Date.now() - 7 * 86400000)).length
  };

  const tutorialSteps = [
    { title: "Welcome to Discussant! 👋", content: "Your complete medical study platform. Upload files, auto-track time, and get AI help while studying!", icon: <Brain className="w-16 h-16 text-yellow-500" /> },
    { title: "Upload & Read Files 📚", content: "Upload lecture slides, PDFs, and notes. When you open a file, the timer starts automatically!", icon: <FileText className="w-16 h-16 text-yellow-500" /> },
    { title: "AI Study Assistant 🤖", content: "While reading, click 'AI Help' to ask questions instantly. Your personal medical tutor 24/7!", icon: <MessageSquare className="w-16 h-16 text-yellow-500" /> },
    { title: "Track & Review 📊", content: "See what needs review, track mastery, and export data to compare with study partners!", icon: <Award className="w-16 h-16 text-yellow-500" /> }
  ];

  // ─── FILE VIEWER ───
  if (viewingFile) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#111' }}>
        <div style={{ background: 'linear-gradient(to right, #EAB308, #CA8A04)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={closeFile} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
              <X size={22} color="#000" />
            </button>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 18, color: '#000' }}>{viewingFile.name}</div>
              <div style={{ fontSize: 13, color: '#333' }}>{getSubjectName(viewingFile.subjectId)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {timerRunning ? <Pause size={18} color="#000" /> : <Play size={18} color="#000" />}
              <span style={{ fontWeight: 'bold', fontSize: 20, color: '#000' }}>{formatTime(studyTimer)}</span>
            </div>
            <button onClick={() => setTimerRunning(!timerRunning)} style={{ background: '#000', color: '#EAB308', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>
              {timerRunning ? 'Pause' : 'Resume'}
            </button>
            <button onClick={() => setShowAIChat(!showAIChat)} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={18} /> AI Help
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#fff', marginRight: showAIChat ? 384 : 0, transition: 'margin 0.3s' }}>
            {viewingFile.type.includes('pdf') ? (
              <iframe src={viewingFile.data} style={{ width: '100%', height: '100%', border: 'none' }} title={viewingFile.name} />
            ) : viewingFile.type.includes('image') ? (
              <img src={viewingFile.data} alt={viewingFile.name} style={{ maxWidth: '100%', display: 'block', margin: '0 auto', padding: 32 }} />
            ) : (
              <div style={{ padding: 32 }}>
                <p style={{ color: '#555' }}>Preview not available for this file type.</p>
                <a href={viewingFile.data} download={viewingFile.name} style={{ display: 'inline-block', marginTop: 16, padding: '12px 24px', background: '#EAB308', color: '#000', borderRadius: 8, fontWeight: 'bold', textDecoration: 'none' }}>
                  Download File
                </a>
              </div>
            )}
          </div>

          {showAIChat && (
            <div style={{ width: 384, background: '#1F2937', display: 'flex', flexDirection: 'column', borderLeft: '4px solid #EAB308', position: 'fixed', right: 0, top: 0, bottom: 0, marginTop: 58 }}>
              <div style={{ padding: '14px 16px', background: '#111827', borderBottom: '1px solid #374151' }}>
                <div style={{ fontWeight: 'bold', color: '#EAB308', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={18} /> AI Study Assistant
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Ask me anything about this material!</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {aiMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: 10, background: msg.role === 'user' ? '#EAB308' : '#374151', color: msg.role === 'user' ? '#000' : '#fff', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ background: '#374151', borderRadius: 10, padding: 12 }}>
                      <Loader size={18} color="#fff" className="animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding: 16, background: '#111827', borderTop: '1px solid #374151', display: 'flex', gap: 8 }}>
                <input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && !aiLoading && askAI()}
                  placeholder="Ask a question..."
                  style={{ flex: 1, padding: '10px 14px', background: '#1F2937', color: '#fff', border: '1px solid #374151', borderRadius: 8, outline: 'none', fontSize: 14 }}
                />
                <button onClick={askAI} disabled={aiLoading || !aiInput.trim()} style={{ padding: '10px 16px', background: '#EAB308', border: 'none', borderRadius: 8, cursor: aiLoading || !aiInput.trim() ? 'not-allowed' : 'pointer', opacity: aiLoading || !aiInput.trim() ? 0.5 : 1 }}>
                  <Send size={18} color="#000" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── MAIN APP ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* TUTORIAL */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border-4 border-yellow-500">
            <div className="text-center mb-6">
              {tutorialSteps[tutorialStep].icon}
              <h2 className="text-2xl font-bold mt-4">{tutorialSteps[tutorialStep].title}</h2>
            </div>
            <p className="text-gray-700 text-center mb-6 leading-relaxed">{tutorialSteps[tutorialStep].content}</p>
            <div className="flex gap-3">
              {tutorialStep > 0 && (
                <button onClick={() => setTutorialStep(p => p - 1)} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100">Back</button>
              )}
              {tutorialStep < tutorialSteps.length - 1 ? (
                <button onClick={() => setTutorialStep(p => p + 1)} className="flex-1 px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600">
                  Next ({tutorialStep + 1}/{tutorialSteps.length})
                </button>
              ) : (
                <button onClick={completeTutorial} className="flex-1 px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600">Let's Go! 🚀</button>
              )}
            </div>
            <button onClick={completeTutorial} className="w-full mt-3 text-gray-400 hover:text-gray-700 text-sm">Skip</button>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full border-4 border-yellow-500">
            <div className="text-center mb-6">
              <Users className="w-14 h-14 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-3xl font-bold">Share Discussant</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 border-2 border-gray-200 text-sm text-gray-700 font-mono whitespace-pre-line">
{`Check out Discussant - a study platform for med school!

• Templates for all years & rotations
• Upload files (PDFs, slides, notes)
• Auto study timer
• AI tutor for instant help

Visit: https://discussant.vercel.app`}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowShareModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 font-bold rounded-lg hover:bg-gray-100">Close</button>
              <button onClick={copyShare} className="flex-1 px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600">Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* NAME PROMPT */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border-4 border-yellow-500">
            <div className="text-center mb-6">
              <Brain className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-3xl font-bold">Welcome to Discussant!</h2>
              <p className="text-gray-600 mt-2">Your medical study platform</p>
            </div>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-yellow-500 rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              onKeyPress={e => { if (e.key === 'Enter' && e.target.value.trim()) saveUserName(e.target.value.trim()); }}
            />
            <button
              onClick={e => { const inp = e.target.previousSibling; if (inp.value.trim()) saveUserName(inp.value.trim()); }}
              className="w-full px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 text-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* TEMPLATES */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full border-4 border-yellow-500 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <BookOpen className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-3xl font-bold">Choose Your Template</h2>
              <p className="text-gray-600 mt-2">Get started instantly with pre-loaded subjects</p>
            </div>
            <div className="space-y-3">
              {Object.entries(templates).map(([key, t]) => (
                <button key={key} onClick={() => loadTemplate(key)} className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition text-left">
                  <div className="font-bold text-lg">{t.name}</div>
                  {t.subjects.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      {t.subjects.length} subjects • {t.subjects.reduce((s, sub) => s + sub.topics.length, 0)} topics
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setShowTemplates(false)} className="w-full mt-6 text-gray-500 hover:text-gray-800 font-semibold">Skip for now</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Brain className="w-12 h-12 text-black" />
              <div>
                <h1 className="text-4xl font-bold text-black">Discussant</h1>
                <p className="text-gray-900 font-semibold">Hey {userName}! Keep crushing it 💪</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-black bg-opacity-20 px-4 py-2 rounded-lg flex items-center gap-2 text-black">
                <Clock className="w-5 h-5" />
                <span className="text-2xl font-bold">{getTotalStudyTime()}</span>
                <span className="text-sm font-semibold">min</span>
              </div>
              <button onClick={exportData} className="px-4 py-2 bg-black text-yellow-500 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-900">
                <Download className="w-5 h-5" /><span className="hidden sm:inline">Export</span>
              </button>
              <label className="px-4 py-2 bg-white text-black rounded-lg font-semibold flex items-center gap-2 cursor-pointer hover:bg-gray-100">
                <Upload className="w-5 h-5" /><span className="hidden sm:inline">Import</span>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button onClick={() => setShowTemplates(true)} className="px-4 py-2 bg-black text-yellow-500 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-900">
                <BookOpen className="w-5 h-5" /><span className="hidden sm:inline">Templates</span>
              </button>
              <button onClick={() => setShowShareModal(true)} className="px-4 py-2 bg-black text-yellow-500 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-900">
                <Users className="w-5 h-5" /><span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-xl mb-6 overflow-hidden border-2 border-yellow-500">
          <div className="flex overflow-x-auto">
            {['today', 'review', 'library', 'subjects', 'stats'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-4 font-bold text-lg whitespace-nowrap transition ${activeTab === tab ? 'bg-yellow-500 text-black' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-4">
            {activeTab === 'today' && (
              <div className="bg-white rounded-xl p-6 border-2 border-yellow-500">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-yellow-600" /> Today's Topics
                </h2>
                {getTodayTopics().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No topics logged today. Add one →</p>
                ) : (
                  <div className="space-y-3">
                    {getTodayTopics().map(t => (
                      <div key={t.id} className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="px-2 py-1 bg-black text-yellow-500 text-xs font-bold rounded-full">{getSubjectName(t.subjectId)}</span>
                            <h3 className="font-bold text-lg mt-2">{t.title}</h3>
                            {t.notes && <p className="text-gray-600 text-sm mt-1">{t.notes}</p>}
                          </div>
                          <button onClick={() => toggleMastered(t.id)} className="ml-2">
                            {t.mastered ? <CheckCircle className="w-7 h-7 text-yellow-600" /> : <Circle className="w-7 h-7 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'review' && (
              <div className="bg-white rounded-xl p-6 border-2 border-yellow-500">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-black" /> Needs Review ({getNeedsReview().length})
                </h2>
                {getNeedsReview().length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-yellow-500 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">All caught up! 🎉</p>
                  </div>
                ) : getNeedsReview().map(t => (
                  <div key={t.id} className="border-2 border-gray-200 rounded-lg p-4 mb-3 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="px-2 py-1 bg-black text-yellow-500 text-xs font-bold rounded-full">{getSubjectName(t.subjectId)}</span>
                        <h3 className="font-bold text-lg mt-2">{t.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{t.lastReviewed ? `Last reviewed: ${formatDate(t.lastReviewed)}` : 'Never reviewed'}</p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button onClick={() => markReviewed(t.id)} className="px-3 py-1 bg-yellow-500 text-black font-bold rounded text-sm hover:bg-yellow-600">Reviewed</button>
                        <button onClick={() => deleteTopic(t.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'library' && (
              <div className="bg-white rounded-xl p-6 border-2 border-yellow-500">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-yellow-600" /> Library ({files.length} files)
                </h2>
                {files.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No files yet. Upload from the sidebar!</p>
                  </div>
                ) : subjects.map(sub => {
                  const subFiles = files.filter(f => f.subjectId === sub.id);
                  if (!subFiles.length) return null;
                  return (
                    <div key={sub.id} className="border-2 border-gray-200 rounded-lg p-4 mb-4">
                      <h3 className="font-bold text-lg mb-3">{sub.name}</h3>
                      {subFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2 hover:bg-yellow-50 transition cursor-pointer" onClick={() => openFile(file)}>
                          <div className="flex-1">
                            <p className="font-semibold">{file.name}</p>
                            <p className="text-xs text-gray-400">Uploaded {formatDate(file.uploadedAt)} • Read: {Math.floor(file.readTime / 60)}min</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={e => { e.stopPropagation(); openFile(file); }} className="px-3 py-1 bg-yellow-500 text-black font-bold rounded text-sm hover:bg-yellow-600">Open</button>
                            <button onClick={e => { e.stopPropagation(); deleteFile(file.id); }} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'subjects' && (
              <div className="bg-white rounded-xl p-6 border-2 border-yellow-500">
                <h2 className="text-2xl font-bold mb-4">Your Subjects</h2>
                <div className="grid grid-cols-2 gap-3">
                  {subjects.map(sub => (
                    <div key={sub.id} className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-bold">{sub.name}</h3>
                        <button onClick={() => deleteSubject(sub.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <p className="text-sm text-gray-600">{topics.filter(t => t.subjectId === sub.id).length} topics</p>
                      <p className="text-sm text-gray-600">{files.filter(f => f.subjectId === sub.id).length} files</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="bg-white rounded-xl p-6 border-2 border-yellow-500">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Award className="w-7 h-7 text-yellow-600" /> Your Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total Topics', value: stats.total, bg: 'from-yellow-100 to-yellow-200', border: 'border-yellow-400' },
                    { label: 'Mastered', value: stats.mastered, bg: 'from-gray-100 to-gray-200', border: 'border-gray-400' },
                    { label: 'Study Minutes', value: stats.studyTime, bg: 'from-yellow-400 to-yellow-500', border: 'border-yellow-600' },
                    { label: 'Files', value: files.length, bg: 'from-black to-gray-900', border: 'border-yellow-500', gold: true }
                  ].map(s => (
                    <div key={s.label} className={`bg-gradient-to-br ${s.bg} rounded-xl p-6 text-center border-2 ${s.border}`}>
                      <div className={`text-4xl font-bold ${s.gold ? 'text-yellow-500' : 'text-black'}`}>{s.value}</div>
                      <div className={`font-bold mt-2 ${s.gold ? 'text-yellow-400' : 'text-gray-800'}`}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {stats.total > 0 && (
                  <div className="mt-4 p-4 bg-yellow-500 rounded-lg text-center">
                    <span className="text-black font-bold text-xl">Mastery Rate: {Math.round((stats.mastered / stats.total) * 100)}%</span>
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  <button onClick={() => setShowShareModal(true)} className="flex-1 px-4 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600">Share App</button>
                  <a href="https://docs.google.com/forms/d/e/1FAIpQLSewsGrJgqq6eJhgjzsrXYaZjKVcUAvuv5ZCOfqxTBvbyQGFMA/viewform" target="_blank" rel="noopener noreferrer" className="flex-1 px-4 py-3 bg-black text-yellow-500 font-bold rounded-lg hover:bg-gray-900 text-center">Feedback</a>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border-2 border-yellow-500">
              <h3 className="font-bold text-lg mb-3">Add Subject</h3>
              <div className="flex gap-2">
                <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="e.g., Anatomy" className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none" />
                <button onClick={addSubject} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600"><Plus className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border-2 border-yellow-500">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><FileText className="w-5 h-5" /> Upload Files</h3>
              <div className="space-y-3">
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none">
                  <option value="">Select Subject First</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <label className={`w-full px-4 py-3 ${selectedSubject ? 'bg-yellow-500 hover:bg-yellow-600 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'} text-black font-bold rounded-lg flex items-center justify-center gap-2 transition`}>
                  <Upload className="w-5 h-5" /> Choose Files
                  <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" disabled={!selectedSubject} />
                </label>
                <p className="text-xs text-gray-400 text-center">PDF, PPT, Word, Images</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border-2 border-yellow-500">
              <h3 className="font-bold text-lg mb-3">Log Topic</h3>
              <div className="space-y-3">
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="text" value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="Topic title" className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none" />
                <textarea value={topicNotes} onChange={e => setTopicNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none" />
                <button onClick={addTopic} className="w-full px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Add Topic
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pb-6 text-center flex items-center justify-center gap-4 text-gray-400 text-sm flex-wrap">
          <button onClick={() => setShowTutorial(true)} className="hover:text-yellow-500">Tutorial</button>
          <span>•</span>
          <button onClick={() => setShowShareModal(true)} className="hover:text-yellow-500">Share</button>
          <span>•</span>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSewsGrJgqq6eJhgjzsrXYaZjKVcUAvuv5ZCOfqxTBvbyQGFMA/viewform" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-500">Feedback</a>
        </div>
      </div>
    </div>
  );
}
