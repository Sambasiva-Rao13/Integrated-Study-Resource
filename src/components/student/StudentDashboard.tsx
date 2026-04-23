import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import {
  FolderOpen,
  FileText,
  LogOut,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { ChatBot } from '../shared/ChatBot';
import { Material } from '../../types';

const REGULATIONS = ['R20', 'R23'];
const SEMESTERS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
const BRANCHES = ['CSE', 'CSE(AI&ML)', 'CSE(COS)', 'ECE', 'EEE', 'MECH', 'CIVIL'];

const CATEGORIES = [
  { id: 'previous_questions', name: 'Previous Questions', icon: FileText },
  { id: 'jntuk_materials', name: 'JNTUK Materials', icon: FolderOpen },
  { id: 'assignment_questions', name: 'Assignment Questions', icon: FileText },
  { id: 'provided_materials', name: 'Provided Materials', icon: FolderOpen },
  { id: 'lab_manuals', name: 'Lab Manuals', icon: FileText }
];

export const StudentDashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  const [regulation, setRegulation] = useState('');
  const [semester, setSemester] = useState('');
  const [branch, setBranch] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setRegulation(user.regulation || '');
      setSemester(user.semester || '');
      setBranch(user.branch || '');
    }
  }, [user]);

  useEffect(() => {
    if (regulation && semester && branch) fetchSubjects();
  }, [regulation, semester, branch]);

  useEffect(() => {
    if (subject && regulation && semester && branch) fetchMaterials();
  }, [subject, regulation, semester, branch]);

  const fetchSubjects = async () => {
    const q = query(
      collection(db, 'materials'),
      where('regulation', '==', regulation),
      where('semester', '==', semester),
      where('section', '==', branch)
    );

    const snap = await getDocs(q);
    const set = new Set<string>();

    snap.forEach(d => {
      const m = d.data() as Material;
      if (m.subject) set.add(m.subject);
    });

    setSubjects([...set]);
  };

  const fetchMaterials = async () => {
    setLoading(true);

    try {
      const q = query(
        collection(db, 'materials'),
        where('regulation', '==', regulation),
        where('semester', '==', semester),
        where('section', '==', branch),
        where('subject', '==', subject),
        orderBy('uploaded_at', 'desc')
      );

      const snap = await getDocs(q);
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() } as Material)));
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMaterial = async (m: Material) => {
    const url = await getDownloadURL(ref(storage, m.file_url));
    window.open(url, '_blank');
  };

  const getByCategory = (id: string) =>
    materials.filter(m => m.category === id);

  const ready = regulation && semester && branch && subject;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <div className="sticky top-0 z-30 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div>
            <p className="text-sm text-white/60">Welcome back,</p>
            <p className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {user?.name}
              {user?.roll_number && <span className="text-white/40 ml-2">({user.roll_number})</span>}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 transition border border-blue-500/30"
            >
              <MessageSquare className="h-4 w-4" />
              AI Assistant
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition border border-red-500/30"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!ready ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-white">
              Select Your Course Details
            </h2>
            <p className="text-white/60 mb-6">Choose your course information to access materials</p>

            <div className="grid md:grid-cols-2 gap-6">
              <Select label="Regulation" value={regulation} set={setRegulation} options={REGULATIONS}/>
              <Select label="Semester" value={semester} set={setSemester} options={SEMESTERS}/>
              <Select label="Branch" value={branch} set={setBranch} options={BRANCHES}/>

              <Select
                label="Subject"
                value={subject}
                set={setSubject}
                options={subjects}
                disabled={!subjects.length}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-white/10 shadow-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">{subject}</h2>
                <p className="text-sm text-white/60 mt-1">
                  {regulation} • {semester} • {branch}
                </p>
              </div>

              <button
                onClick={() => {
                  setSubject('');
                  setSelectedCategory(null);
                }}
                className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition font-medium border border-blue-500/30"
              >
                Change
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-white/60">Loading materials...</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const list = getByCategory(cat.id);

                  return (
                    <div
                      key={cat.id}
                      className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 p-6 cursor-pointer hover:border-white/20 hover:shadow-xl transition group"
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === cat.id ? null : cat.id
                        )
                      }
                    >
                      <div className="flex justify-between mb-4">
                        <div className="flex gap-3">
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition">{cat.name}</h3>
                            <p className="text-sm text-white/50">
                              {list.length} file{list.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          className={`h-5 w-5 text-white/40 transition ${
                            selectedCategory === cat.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>

                      {selectedCategory === cat.id && (
                        <div className="pt-4 border-t border-white/10 space-y-2">
                          {list.length === 0 ? (
                            <p className="text-sm text-white/50">
                              No materials available
                            </p>
                          ) : (
                            list.map(m => (
                              <button
                                key={m.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleViewMaterial(m);
                                }}
                                className="w-full flex justify-between items-center p-3 bg-white/5 hover:bg-blue-500/10 rounded-lg transition border border-white/10 hover:border-blue-500/30"
                              >
                                <span className="text-sm font-medium text-white">{m.title}</span>
                                <span className="text-blue-400 text-xs font-medium">
                                  View
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {showChat && <ChatBot onClose={() => setShowChat(false)} />}
    </div>
  );
};

const Select = ({ label, value, set, options, disabled=false }: any) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">{label}</label>
    <select
      value={value}
      onChange={e => set(e.target.value)}
      disabled={disabled}
      className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition"
      required
    >
      <option value="" className="bg-slate-700">Select {label}</option>
      {options.map((o:string) => (
        <option key={o} value={o} className="bg-slate-700">{o}</option>
      ))}
    </select>
  </div>
);
