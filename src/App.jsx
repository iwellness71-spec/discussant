import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, Calendar, Clock, CheckCircle, Circle, Trash2, Brain, TrendingUp, Download, Upload, Users, Award, FileText, MessageSquare, Play, Pause, X, Send, Loader, Lock, Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Moon, Sun, Search, LogIn, LogOut, Shield, UserPlus, ThumbsUp, MessageCircle } from 'lucide-react';

const API = {
  login: async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (email && password) {
      return { 
        success: true, 
        user: { 
          id: Date.now(), 
          email, 
          name: email.split('@')[0],
          isAdmin: email.includes('admin')
        }
      };
    }
    return { success: false, error: 'Invalid credentials' };
  },
  register: async (email, password, name) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { 
      success: true, 
      user: { id: Date.now(), email, name, isAdmin: false }
    };
  },
  getSharedMaterials: async () => {
    try {
      const saved = localStorage.getItem('sharedMaterials');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  },
  uploadSharedMaterial: async (material) => {
    const materials = await API.getSharedMaterials();
    materials.push(material);
    localStorage.setItem('sharedMaterials', JSON.stringify(materials));
    return { success: true };
  },
  getCases: async () => {
    try {
      const saved = localStorage.getItem('casesDB');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  },
  addCase: async (caseData) => {
    const cases = await API.getCases();
    cases.unshift(caseData);
    localStorage.setItem('casesDB', JSON.stringify(cases));
    return { success: true };
  },
  addComment: async (caseId, comment) => {
    const cases = await API.getCases();
    const caseIndex = cases.findIndex(c => c.id === caseId);
    if (caseIndex !== -1) {
      cases[caseIndex].comments = cases[caseIndex].comments || [];
      cases[caseIndex].comments.push(comment);
      localStorage.setItem('casesDB', JSON.stringify(cases));
    }
    return { success: true };
  },
  toggleLike: async (caseId, userId) => {
    const cases = await API.getCases();
    const caseIndex = cases.findIndex(c => c.id === caseId);
    if (caseIndex !== -1) {
      cases[caseIndex].likes = cases[caseIndex].likes || [];
      const likeIndex = cases[caseIndex].likes.indexOf(userId);
      if (likeIndex > -1) {
        cases[caseIndex].likes.splice(likeIndex, 1);
      } else {
        cases[caseIndex].likes.push(userId);
      }
      localStorage.setItem('casesDB', JSON.stringify(cases));
    }
    return { success: true };
  }
};

const storage = {
  get: (key) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(atob(val)) : null;
    } catch { return null; }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, btoa(JSON.stringify(value)));
    } catch (e) { console.error('Storage error', e); }
  }
};

export default function DiscussantPro() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [files, setFiles] = useState([]);
  const [sharedMaterials, setSharedMaterials] = useState([]);
  const [cases, setCases] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [viewingCase, setViewingCase] = useState(null);
  const [studyTimer, setStudyTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentStudySubject, setCurrentStudySubject] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [todayExpanded, setTodayExpanded] = useState(false);
  const [todaySearch, setTodaySearch] = useState('');
  const timerRef = useRef(null);
  const [newSubject, setNewSubject] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [topicNotes, setTopicNotes] = useState('');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseContent, setNewCaseContent] = useState('');
  const [newCaseSpecialty, setNewCaseSpecialty] = useState('');
  const [caseComment, setCaseComment] = useState('');
  const [adminMaterialTitle, setAdminMaterialTitle] = useState('');
  const [adminMaterialSubject, setAdminMaterialSubject] = useState('');
  const [adminMaterialDesc, setAdminMaterialDesc] = useState('');

  const templates = {
    pediatrics: {
      name: 'Pediatrics Rotation',
      subjects: [
        { name: 'Paediatric Neurology', topics: ['Intellectual Disability', 'Cerebral Palsy', 'Neural Tube Defects'] },
        { name: 'Paediatric Infectious Disease', topics: ['Sepsis/SIRS', 'Typhoid', 'Diphtheria', 'Pertussis'] },
        { name: 'Miscellaneous Paediatrics', topics: ['Acute Limb Pain', 'Hypertension', 'Dehydration'] }
      ]
    },
    surgery: {
      name: 'Surgery Rotation',
      subjects: [
        { name: 'General Surgery', topics: ['Acute Abdomen', 'Hernias', 'Breast Disease'] },
        { name: 'Trauma', topics: ['ATLS Protocols', 'Head Trauma', 'Chest Trauma'] }
      ]
    },
    internal: {
      name: 'Internal Medicine',
      subjects: [
        { name: 'Cardiology', topics: ['Heart Failure', 'Arrhythmias', 'CAD'] },
        { name: 'Pulmonology', topics: ['COPD', 'Asthma', 'Pneumonia'] }
      ]
    },
    blank: { name: 'Start From Scratch', subjects: [] }
  };

  useEffect(() => {
    const savedUser = storage.get('currentUser');
    const savedSubjects = storage.get('subjects');
    const savedTopics = storage.get('topics');
    const savedSessions = storage.get('sessions');
    const savedFiles = storage.get('files');
    const savedDarkMode = storage.get('darkMode');

    if (savedUser) setUser(savedUser);
    if (savedSubjects) setSubjects(savedSubjects);
    if (savedTopics) setTopics(savedTopics);
    if (savedSessions) setStudySessions(savedSessions);
    if (savedFiles) setFiles(savedFiles);
    if (savedDarkMode) setDarkMode(savedDarkMode);

    loadSharedMaterials();
    loadCases();
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setStudyTimer(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const loadSharedMaterials = async () => {
    const materials = await API.getSharedMaterials();
    setSharedMaterials(materials);
  };

  const loadCases = async () => {
    const casesData = await API.getCases();
    setCases(casesData);
  };

  const handleAuth = async () => {
    let result;
    if (authMode === 'login') {
      result = await API.login(authEmail, authPassword);
    } else {
      result = await API.register(authEmail, authPassword, authName);
    }
    
    if (result.success) {
      setUser(result.user);
      storage.set('currentUser', result.user);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } else {
      alert(result.error || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    storage.set('currentUser', null);
  };

  const handleAdminUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !adminMaterialTitle || !adminMaterialSubject) {
      alert('Please fill all fields and select a file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const material = {
        id: Date.now(),
        title: adminMaterialTitle,
        subject: adminMaterialSubject,
        description: adminMaterialDesc,
        fileName: file.name,
        fileType: file.type,
        fileData: ev.target.result,
        uploadedBy: user.email,
        uploadedAt: new Date().toISOString()
      };
      
      await API.uploadSharedMaterial(material);
      await loadSharedMaterials();
      setAdminMaterialTitle('');
      setAdminMaterialSubject('');
      setAdminMaterialDesc('');
      e.target.value = '';
      alert('Material uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleAddCase = async () => {
    if (!newCaseTitle || !newCaseContent || !user) return;
    
    const caseData = {
      id: Date.now(),
      title: newCaseTitle,
      content: newCaseContent,
      specialty: newCaseSpecialty || 'General',
      authorId: user.id,
      authorName: user.name,
      createdAt: new Date().toISOString(),
      likes: [],
      comments: []
    };
    
    await API.addCase(caseData);
    await loadCases();
    setNewCaseTitle('');
    setNewCaseContent('');
    setNewCaseSpecialty('');
    setShowCaseModal(false);
  };

  const handleAddComment = async (caseId) => {
    if (!caseComment.trim() || !user) return;
    
    const comment = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      content: caseComment,
      createdAt: new Date().toISOString()
    };
    
    await API.addComment(caseId, comment);
    await loadCases();
    setCaseComment('');
  };

  const handleToggleLike = async (caseId) => {
    if (!user) return;
    await API.toggleLike(caseId, user.id);
    await loadCases();
  };

  const setAndSaveSubjects = (data) => { setSubjects(data); storage.set('subjects', data); };
  const setAndSaveTopics = (data) => { setTopics(data); storage.set('topics', data); };
  const setAndSaveSessions = (data) => { setStudySessions(data); storage.set('sessions', data); };
  const setAndSaveFiles = (data) => { setFiles(data); storage.set('files', data); };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    storage.set('darkMode', newMode);
  };

  const loadTemplate = (key) => {
    const template = templates[key];
    if (!template || key === 'blank') return;

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
  };

  const handleFileUpload = (e) => {
    const uploaded = Array.from(e.target.files);
    if (!selectedSubject || !uploaded.length) {
      alert('Please select a subject first!');
      return;
    }

    uploaded.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newFile = {
          id: Date.now() + Math.random(),
          subjectId: parseInt(selectedSubject),
          name: file.name,
          type: file.type,
          size: file.size,
          data: ev.target.result,
          uploadedAt: new Date().toISOString(),
          readTime: 0
        };
        setAndSaveFiles([...files, newFile]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const openFile = (file) => {
    setViewingFile(file);
    setCurrentStudySubject(file.subjectId || file.subject);
    setStudyTimer(0);
    setTimerRunning(true);
    setPdfZoom(100);
  };

  const closeFile = () => {
    if (timerRunning && studyTimer > 0) {
      const mins = Math.floor(studyTimer / 60);
      const session = {
        id: Date.now(),
        subjectId: currentStudySubject,
        duration: mins || 1,
        date: new Date().toISOString(),
        fileName: viewingFile?.name || viewingFile?.fileName
      };
      setAndSaveSessions([...studySessions, session]);
    }
    setViewingFile(null);
    setTimerRunning(false);
    setStudyTimer(0);
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

  const getSubjectName = (id) => {
    if (typeof id === 'string') return id;
    return subjects.find(s => s.id === parseInt(id))?.name || '';
  };

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

  const allFiles = [...sharedMaterials.map(m => ({
    id: m.id,
    name: m.fileName,
    title: m.title,
    subject: m.subject,
    description: m.description,
    type: m.fileType,
    data: m.fileData,
    uploadedAt: m.uploadedAt,
    isShared: true
  })), ...files];

  const filteredTodayTopics = todaySearch 
    ? getTodayTopics().filter(t => 
        t.title.toLowerCase().includes(todaySearch.toLowerCase()) ||
        getSubjectName(t.subjectId).toLowerCase().includes(todaySearch.toLowerCase()))
    : getTodayTopics();

  const theme = darkMode ? {
    bg: '#0F172A',
    cardBg: '#1E293B',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    border: '#334155',
    accent: '#EAB308'
  } : {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    accent: '#EAB308'
  };

  // FILE VIEWER
  if (viewingFile) {
    const isPDF = viewingFile.type?.includes('pdf');
    const isImage = viewingFile.type?.includes('image');
    const isPPT = viewingFile.type?.includes('presentation') || viewingFile.name?.endsWith('.ppt') || viewingFile.name?.endsWith('.pptx');
    const isWord = viewingFile.type?.includes('word') || viewingFile.type?.includes('document') || viewingFile.name?.endsWith('.doc') || viewingFile.name?.endsWith('.docx');

    let viewerUrl = viewingFile.data;
    if (isPPT || isWord) {
      viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(viewingFile.data)}&embedded=true`;
    }

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.bg }}>
        <div style={{ background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={closeFile} style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: 10, padding: 10, cursor: 'pointer' }}>
              <X size={20} color="#000" strokeWidth={2.5} />
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 19, color: '#000' }}>{viewingFile.title || viewingFile.name}</div>
              <div style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>{getSubjectName(viewingFile.subjectId || viewingFile.subject)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isPDF && (
              <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 8, padding: '4px 8px' }}>
                <button onClick={() => setPdfZoom(Math.max(50, pdfZoom - 10))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6 }}>
                  <ZoomOut size={16} color="#000" />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#000', minWidth: 40, textAlign: 'center' }}>{pdfZoom}%</span>
                <button onClick={() => setPdfZoom(Math.min(200, pdfZoom + 10))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6 }}>
                  <ZoomIn size={16} color="#000" />
                </button>
              </div>
            )}
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              {timerRunning ? <Pause size={18} color="#000" /> : <Play size={18} color="#000" />}
              <span style={{ fontWeight: 700, fontSize: 22, color: '#000', fontFamily: 'monospace' }}>{formatTime(studyTimer)}</span>
            </div>
            <button onClick={() => setTimerRunning(!timerRunning)} style={{ background: '#000', color: '#EAB308', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>
              {timerRunning ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }}>
          {isPDF ? (
            <div style={{ width: '100%', height: '100%', transform: `scale(${pdfZoom / 100})`, transformOrigin: 'top center' }}>
              <iframe
                src={viewerUrl}
                style={{ width: `${100 / (pdfZoom / 100)}%`, height: `${100 / (pdfZoom / 100)}%`, border: 'none' }}
                title={viewingFile.name}
              />
            </div>
          ) : isImage ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <img src={viewerUrl} alt={viewingFile.name} style={{ maxWidth: '95%', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} />
            </div>
          ) : (isPPT || isWord) ? (
            <iframe
              src={viewerUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={viewingFile.name}
            />
          ) : (
            <div style={{ padding: 48, maxWidth: 700, margin: '0 auto' }}>
              <div style={{ background: theme.cardBg, borderRadius: 16, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                <FileText size={56} color="#EAB308" style={{ marginBottom: 20 }} />
                <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 12, color: theme.text }}>{viewingFile.name}</h3>
                <p style={{ color: theme.textMuted, marginBottom: 28 }}>Preview not available. Download to view.</p>
                <a
                  href={viewingFile.data}
                  download={viewingFile.name}
                  style={{ display: 'inline-block', padding: '14px 32px', background: '#EAB308', color: '#000', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}
                >
                  <Download size={18} style={{ display: 'inline', marginRight: 8 }} />
                  Download File
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // AUTH SCREEN
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 420, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '4px solid #EAB308' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Brain size={80} color="#EAB308" style={{ margin: '0 auto 16px' }} strokeWidth={2} />
            <h1 style={{ fontSize: 36, fontWeight: 900, color: '#111', margin: 0 }}>Discussant</h1>
            <p style={{ color: '#666', fontWeight: 500, marginTop: 8 }}>Medical Study Platform</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {authMode === 'register' && (
              <input
                type="text"
                placeholder="Full Name"
                value={authName}
                onChange={e => setAuthName(e.target.value)}
                style={{ width: '100%', padding: '14px 20px', border: '2px solid #D1D5DB', borderRadius: 12, fontWeight: 500, fontSize: 15, boxSizing: 'border-box' }}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              style={{ width: '100%', padding: '14px 20px', border: '2px solid #D1D5DB', borderRadius: 12, fontWeight: 500, fontSize: 15, boxSizing: 'border-box' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAuth()}
              style={{ width: '100%', padding: '14px 20px', border: '2px solid #D1D5DB', borderRadius: 12, fontWeight: 500, fontSize: 15, boxSizing: 'border-box' }}
            />
            <button
              onClick={handleAuth}
              style={{ width: '100%', padding: '14px 24px', background: 'linear-gradient(135deg, #EAB308, #CA8A04)', color: '#000', fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {authMode === 'login' ? <><LogIn size={20} /> Login</> : <><UserPlus size={20} /> Sign Up</>}
            </button>
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              style={{ background: 'none', border: 'none', color: '#666', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </button>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 8 }}>
              <p>Demo: Use any email/password</p>
              <p>Use email with 'admin' for admin access</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN PANEL
  if (user.isAdmin && showAdminPanel) {
    return (
      <div style={{ minHeight: '100vh', padding: 24, background: theme.bg }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ borderRadius: 24, padding: 32, marginBottom: 24, background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Shield size={56} color="#000" strokeWidth={2.5} />
                <div>
                  <h1 style={{ fontSize: 36, fontWeight: 900, color: '#000', margin: 0 }}>Admin Panel</h1>
                  <p style={{ color: '#1F2937', fontWeight: 700, margin: 0 }}>Upload Study Materials</p>
                </div>
              </div>
              <button onClick={() => setShowAdminPanel(false)} style={{ padding: '12px 24px', background: '#000', color: '#EAB308', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Back to App
              </button>
            </div>
          </div>

          <div style={{ borderRadius: 20, padding: 32, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: theme.text }}>Upload New Material</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="text"
                placeholder="Material Title"
                value={adminMaterialTitle}
                onChange={e => setAdminMaterialTitle(e.target.value)}
                style={{ width: '100%', padding: '14px 20px', border: `2px solid ${theme.border}`, borderRadius: 12, fontWeight: 500, background: theme.bg, color: theme.text, boxSizing: 'border-box' }}
              />
              <input
                type="text"
                placeholder="Subject/Specialty"
                value={adminMaterialSubject}
                onChange={e => setAdminMaterialSubject(e.target.value)}
                style={{ width: '100%', padding: '14px 20px', border: `2px solid ${theme.border}`, borderRadius: 12, fontWeight: 500, background: theme.bg, color: theme.text, boxSizing: 'border-box' }}
              />
              <textarea
                placeholder="Description"
                value={adminMaterialDesc}
                onChange={e => setAdminMaterialDesc(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '14px 20px', border: `2px solid ${theme.border}`, borderRadius: 12, fontWeight: 500, background: theme.bg, color: theme.text, boxSizing: 'border-box', resize: 'vertical' }}
              />
              <label style={{ width: '100%', padding: '14px 24px', background: 'linear-gradient(135deg, #EAB308, #CA8A04)', color: '#000', fontWeight: 700, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxSizing: 'border-box' }}>
                <Upload size={20} /> Choose File to Upload
                <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={handleAdminUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: theme.text }}>Uploaded Materials ({sharedMaterials.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sharedMaterials.map(m => (
                  <div key={m.id} style={{ padding: 16, borderRadius: 12, border: `2px solid ${theme.border}`, background: theme.bg }}>
                    <div style={{ fontWeight: 700, color: theme.text }}>{m.title}</div>
                    <div style={{ fontSize: 13, marginTop: 4, color: theme.textMuted }}>{m.subject} • {m.fileName}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div style={{ minHeight: '100vh', background: darkMode ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)', transition: 'background 0.3s' }}>
      {/* Case Modal */}
      {showCaseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 640, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: '4px solid #EAB308', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Share a Clinical Case</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="text"
                placeholder="Case Title"
                value={newCaseTitle}
                onChange={e => setNewCaseTitle(e.target.value)}
                style={{ width: '100%', padding: '14px 20px', border: '2px solid #D1D5DB', borderRadius: 12, fontWeight: 500, boxSizing: 'border-box' }}
              />
              <input
                type="text"
                placeholder="Specialty (e.g., Pediatrics, Surgery)"
                value={newCaseSpecialty}
                onChange={e => setNewCaseSpecialty(e.target.value)}
                style={{ width: '100%', padding: '14px 20px', border: '2px solid #D1D5DB', borderRadius: 12, fontWeight: 500, boxSizing: 'border-box' }}
              />
              <textarea
                placeholder="Case Description/Discussion Points..."
                value={newCaseContent}
                onChange={e => setNewCaseContent(e.target.value)}
                rows={8}
                style={{ width: '100%', padding: '14px 20px', border: '2px solid #D1D5DB', borderRadius: 12, fontWeight: 500, boxSizing: 'border-box', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowCaseModal(false)} style={{ flex: 1, padding: '14px 24px', border: '2px solid #D1D5DB', fontWeight: 700, borderRadius: 12, background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleAddCase} style={{ flex: 1, padding: '14px 24px', background: 'linear-gradient(135deg, #EAB308, #CA8A04)', color: '#000', fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer' }}>
                  Share Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Case Modal */}
      {viewingCase && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 40, maxWidth: 720, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{viewingCase.title}</h2>
                <p style={{ color: '#666' }}>By {viewingCase.authorName} • {viewingCase.specialty}</p>
                <p style={{ fontSize: 13, color: '#999' }}>{formatDate(viewingCase.createdAt)}</p>
              </div>
              <button onClick={() => setViewingCase(null)} style={{ padding: 8, background: '#f3f4f6', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: 24, padding: 20, background: '#F9FAFB', borderRadius: 12 }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{viewingCase.content}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #E5E7EB' }}>
              <button
                onClick={() => handleToggleLike(viewingCase.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer', background: viewingCase.likes?.includes(user.id) ? '#EAB308' : '#F3F4F6', color: viewingCase.likes?.includes(user.id) ? '#000' : '#374151' }}
              >
                <ThumbsUp size={18} /> {viewingCase.likes?.length || 0}
              </button>
              <span style={{ color: '#666' }}>{viewingCase.comments?.length || 0} comments</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Discussion</h3>
              {viewingCase.comments?.map(comment => (
                <div key={comment.id} style={{ padding: 16, background: '#F9FAFB', borderRadius: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{comment.userName}</div>
                  <p style={{ color: '#374151', margin: 0 }}>{comment.content}</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>{formatDate(comment.createdAt)}</p>
                </div>
              ))}
              
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={caseComment}
                  onChange={e => setCaseComment(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', border: '2px solid #D1D5DB', borderRadius: 12 }}
                />
                <button
                  onClick={() => handleAddComment(viewingCase.id)}
                  style={{ padding: '12px 20px', background: '#EAB308', color: '#000', fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer' }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 20 }}>
        <div style={{ borderRadius: 24, padding: 32, marginBottom: 24, background: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Brain size={56} color="#000" strokeWidth={2.5} />
              <div>
                <h1 style={{ fontSize: 44, fontWeight: 900, color: '#000', margin: 0 }}>Discussant</h1>
                <p style={{ color: '#1F2937', fontWeight: 700, fontSize: 18, margin: 0 }}>Hey {user.name}! 💪</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {user.isAdmin && (
                <button onClick={() => setShowAdminPanel(true)} style={{ padding: '12px 16px', background: '#000', color: '#EAB308', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={20} /> Admin
                </button>
              )}
              <button onClick={toggleDarkMode} style={{ padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
                {darkMode ? <Sun size={20} color="#000" /> : <Moon size={20} color="#000" />}
              </button>
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={24} color="#000" />
                <span style={{ fontSize: 28, fontWeight: 900, color: '#000' }}>{getTotalStudyTime()}</span>
                <span style={{ fontSize: 13, color: '#1F2937', fontWeight: 600 }}>min</span>
              </div>
              <button onClick={handleLogout} style={{ padding: '12px 20px', background: '#000', color: '#EAB308', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <LogOut size={20} /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderRadius: 20, marginBottom: 24, overflow: 'hidden', background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {['today', 'review', 'library', 'cases', 'stats'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '20px 20px',
                  fontWeight: 700,
                  fontSize: 17,
                  whiteSpace: 'nowrap',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeTab === tab ? 'linear-gradient(135deg, #EAB308, #CA8A04)' : 'transparent',
                  color: activeTab === tab ? '#000' : theme.textMuted
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 24 }}>
            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* TODAY TAB */}
              {activeTab === 'today' && (
                <div style={{ borderRadius: 20, padding: 28, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <div
                    onClick={() => setTodayExpanded(!todayExpanded)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: todayExpanded ? 16 : 0, cursor: 'pointer' }}
                  >
                    <h2 style={{ fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, margin: 0, color: theme.text }}>
                      <Calendar size={32} color="#CA8A04" /> Today's Topics ({getTodayTopics().length})
                    </h2>
                    {todayExpanded ? <ChevronUp size={28} color={theme.text} /> : <ChevronDown size={28} color={theme.text} />}
                  </div>

                  {todayExpanded && (
                    <>
                      <input
                        type="text"
                        placeholder="Search today's topics..."
                        value={todaySearch}
                        onChange={e => setTodaySearch(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', border: `2px solid ${theme.border}`, borderRadius: 12, fontWeight: 500, background: theme.bg, color: theme.text, marginBottom: 16, boxSizing: 'border-box' }}
                      />
                      <div style={{ maxHeight: 384, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {filteredTodayTopics.length === 0 ? (
                          <p style={{ textAlign: 'center', padding: '32px 0', color: theme.textMuted }}>No topics found</p>
                        ) : filteredTodayTopics.map(t => (
                          <div key={t.id} style={{ padding: 20, borderRadius: 16, border: '2px solid #EAB308', background: darkMode ? '#1E293B' : '#FEF9C3' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ padding: '4px 12px', background: '#000', color: '#EAB308', fontSize: 12, fontWeight: 700, borderRadius: 999 }}>{getSubjectName(t.subjectId)}</span>
                                <h3 style={{ fontWeight: 700, fontSize: 20, marginTop: 12, color: theme.text }}>{t.title}</h3>
                                {t.notes && <p style={{ fontSize: 14, marginTop: 8, color: theme.textMuted }}>{t.notes}</p>}
                              </div>
                              <button onClick={() => toggleMastered(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                {t.mastered
                                  ? <CheckCircle size={32} color="#CA8A04" />
                                  : <Circle size={32} color={theme.textMuted} />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* LIBRARY TAB */}
              {activeTab === 'library' && (
                <div style={{ borderRadius: 20, padding: 28, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, color: theme.text }}>
                    <FileText size={32} color="#CA8A04" /> Library ({allFiles.length})
                  </h2>

                  <div style={{ marginBottom: 32, padding: 24, borderRadius: 16, border: `2px dashed ${theme.border}` }}>
                    <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, color: theme.text }}>Upload Your Files</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <select
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', border: `2px solid ${theme.border}`, borderRadius: 12, fontWeight: 500, background: theme.bg, color: theme.text }}
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <label style={{
                        width: '100%', padding: '14px 24px',
                        background: selectedSubject ? 'linear-gradient(135deg, #EAB308, #CA8A04)' : '#E5E7EB',
                        color: '#000', fontWeight: 700, borderRadius: 12,
                        cursor: selectedSubject ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                        boxSizing: 'border-box'
                      }}>
                        <Upload size={20} /> Choose Files
                        <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} style={{ display: 'none' }} disabled={!selectedSubject} />
                      </label>
                    </div>
                  </div>

                  {sharedMaterials.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Lock size={18} color="#CA8A04" />
                        <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0, color: theme.text }}>Shared Study Materials</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {sharedMaterials.map(m => (
                          <div
                            key={m.id}
                            onClick={() => openFile({ id: m.id, name: m.fileName, title: m.title, subject: m.subject, description: m.description, type: m.fileType, data: m.fileData, uploadedAt: m.uploadedAt, isShared: true })}
                            style={{ padding: 20, borderRadius: 16, border: '2px solid #EAB308', background: darkMode ? '#1E293B' : '#FEF9C3', cursor: 'pointer' }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 17, color: theme.text }}>{m.title}</div>
                            <div style={{ fontSize: 13, marginTop: 4, color: theme.textMuted }}>{m.subject}</div>
                            {m.description && <p style={{ fontSize: 12, marginTop: 8, color: theme.textMuted }}>{m.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {files.length > 0 && (
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16, color: theme.text }}>Your Files</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {subjects.map(sub => {
                          const subFiles = files.filter(f => f.subjectId === sub.id);
                          if (!subFiles.length) return null;
                          return (
                            <div key={sub.id} style={{ padding: 16, borderRadius: 16, border: `2px solid ${theme.border}`, background: theme.bg }}>
                              <h4 style={{ fontWeight: 700, marginBottom: 12, color: theme.text }}>{sub.name}</h4>
                              {subFiles.map(file => (
                                <div
                                  key={file.id}
                                  onClick={() => openFile(file)}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 8, borderRadius: 12, cursor: 'pointer', background: theme.cardBg }}
                                >
                                  <div>
                                    <p style={{ fontWeight: 700, margin: 0, color: theme.text }}>{file.name}</p>
                                    <p style={{ fontSize: 12, margin: '4px 0 0', color: theme.textMuted }}>Uploaded {formatDate(file.uploadedAt)}</p>
                                  </div>
                                  <button
                                    onClick={e => { e.stopPropagation(); deleteFile(file.id); }}
                                    style={{ padding: 8, color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8 }}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CASES TAB */}
              {activeTab === 'cases' && (
                <div style={{ borderRadius: 20, padding: 28, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, margin: 0, color: theme.text }}>
                      <MessageCircle size={32} color="#CA8A04" /> Clinical Cases
                    </h2>
                    <button
                      onClick={() => setShowCaseModal(true)}
                      style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #EAB308, #CA8A04)', color: '#000', fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <Plus size={20} /> Share Case
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {cases.length === 0 && (
                      <p style={{ textAlign: 'center', color: theme.textMuted, padding: '32px 0' }}>No cases yet. Be the first to share one!</p>
                    )}
                    {cases.map(c => (
                      <div
                        key={c.id}
                        onClick={() => setViewingCase(c)}
                        style={{ padding: 20, borderRadius: 16, border: `2px solid ${theme.border}`, background: theme.bg, cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: 700, fontSize: 20, margin: 0, color: theme.text }}>{c.title}</h3>
                            <p style={{ fontSize: 13, marginTop: 4, color: theme.textMuted }}>By {c.authorName} • {c.specialty}</p>
                          </div>
                          <span style={{ padding: '4px 12px', background: '#EAB308', color: '#000', fontSize: 12, fontWeight: 700, borderRadius: 999, whiteSpace: 'nowrap' }}>{c.specialty}</span>
                        </div>
                        <p style={{ fontSize: 14, color: theme.textMuted, marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.content}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14, color: theme.textMuted }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsUp size={14} /> {c.likes?.length || 0}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={14} /> {c.comments?.length || 0}</span>
                          <span>{formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REVIEW TAB */}
              {activeTab === 'review' && (
                <div style={{ borderRadius: 20, padding: 28, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, color: theme.text }}>Needs Review ({getNeedsReview().length})</h2>
                  {getNeedsReview().length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <CheckCircle size={80} color="#CA8A04" style={{ margin: '0 auto 16px' }} />
                      <p style={{ fontWeight: 700, fontSize: 20, color: theme.text }}>All caught up! 🎉</p>
                    </div>
                  ) : getNeedsReview().map(t => (
                    <div key={t.id} style={{ padding: 20, borderRadius: 16, border: `2px solid ${theme.border}`, background: theme.bg, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ padding: '4px 12px', background: '#000', color: '#EAB308', fontSize: 12, fontWeight: 700, borderRadius: 999 }}>{getSubjectName(t.subjectId)}</span>
                          <h3 style={{ fontWeight: 700, fontSize: 20, marginTop: 12, color: theme.text }}>{t.title}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => markReviewed(t.id)} style={{ padding: '8px 16px', background: '#EAB308', color: '#000', fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14 }}>Reviewed</button>
                          <button onClick={() => deleteTopic(t.id)} style={{ padding: 8, color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 8 }}><Trash2 size={18} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STATS TAB */}
              {activeTab === 'stats' && (
                <div style={{ borderRadius: 20, padding: 28, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: theme.text }}>Your Stats</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {[
                      { label: 'Topics', value: topics.length, bg: 'linear-gradient(135deg, #FEF9C3, #FEF08A)', textColor: '#000' },
                      { label: 'Mastered', value: topics.filter(t => t.mastered).length, bg: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)', textColor: '#000' },
                      { label: 'Study Min', value: getTotalStudyTime(), bg: 'linear-gradient(135deg, #EAB308, #CA8A04)', textColor: '#000' },
                      { label: 'Files', value: allFiles.length, bg: 'linear-gradient(135deg, #0F172A, #1E293B)', textColor: '#EAB308' }
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, borderRadius: 20, padding: 28, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: 52, fontWeight: 900, color: s.textColor }}>{s.value}</div>
                        <div style={{ fontWeight: 700, marginTop: 12, color: s.textColor, opacity: 0.8 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Add Subject */}
              <div style={{ borderRadius: 20, padding: 24, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, color: theme.text }}>Add Subject</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    placeholder="e.g., Anatomy"
                    style={{ flex: 1, padding: '12px 16px', border: `2px solid ${theme.border}`, borderRadius: 12, fontWeight: 500, background: theme.bg, color: theme.text }}
                  />
                  <button
                    onClick={addSubject}
                    style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #EAB308, #CA8A04)', color: '#000', fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Log Topic */}
              <div style={{ borderRadius: 20, padding: 24, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, color: theme.text }}>Log Topic</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', border: `2px solid ${theme.border}`, borderRadius: 12, fontWeight: 500, background: theme.bg, color: theme.text }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={e => setNewTopic(e.target.value)}
                    placeholder="Topic title"
                    style={{ width: '100%', padding: '12px 16px', border: `2px solid ${theme.border}`, borderRadius: 12, fontWeight: 500, background: theme.bg, color: theme.text, boxSizing: 'border-box' }}
                  />
                  <textarea
                    value={topicNotes}
                    onChange={e => setTopicNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    rows={3}
                    style={{ width: '100%', padding: '12px 16px', border: `2px solid ${theme.border}`, borderRadius: 12, fontWeight: 500, background: theme.bg, color: theme.text, boxSizing: 'border-box', resize: 'vertical' }}
                  />
                  <button
                    onClick={addTopic}
                    style={{ width: '100%', padding: '14px 20px', background: 'linear-gradient(135deg, #EAB308, #CA8A04)', color: '#000', fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15 }}
                  >
                    + Log Topic
                  </button>
                </div>
              </div>

              {/* Subjects List */}
              {subjects.length > 0 && (
                <div style={{ borderRadius: 20, padding: 24, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, color: theme.text }}>Subjects ({subjects.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {subjects.map(sub => {
                      const subTopics = topics.filter(t => t.subjectId === sub.id);
                      const mastered = subTopics.filter(t => t.mastered).length;
                      return (
                        <div key={sub.id} style={{ padding: '12px 16px', borderRadius: 12, border: `2px solid ${theme.border}`, background: theme.bg }}>
                          <div style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{sub.name}</div>
                          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{subTopics.length} topics • {mastered} mastered</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Load Template */}
              <div style={{ borderRadius: 20, padding: 24, background: theme.cardBg, border: `2px solid ${theme.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 16, color: theme.text }}>Load Template</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(templates).map(([key, tmpl]) => (
                    <button
                      key={key}
                      onClick={() => loadTemplate(key)}
                      style={{ width: '100%', padding: '10px 16px', border: `2px solid ${theme.border}`, borderRadius: 10, background: theme.bg, color: theme.text, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontSize: 14 }}
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
