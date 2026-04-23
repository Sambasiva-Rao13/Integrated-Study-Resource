import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../lib/firebase';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  orderBy,
  query
} from 'firebase/firestore';
import { ref, deleteObject, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { firebaseConfig } from '../../lib/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  UserPlus,
  Users,
  FileText,
  LogOut,
  Trash2,
  X,
  Eye,
  Filter
} from 'lucide-react';
import { User, Material, UserRole } from '../../types';

const REGULATIONS = ['R20', 'R23'];
const SEMESTERS = ['1-1','1-2','2-1','2-2','3-1','3-2','4-1','4-2'];
const BRANCHES = ['CSE','CSE(AI&ML)','CSE(COS)','ECE','EEE','MECH','CIVIL'];
const CATEGORIES = [
  { id:'previous_questions', name:'Previous Questions' },
  { id:'jntuk_materials', name:'JNTUK Materials' },
  { id:'assignment_questions', name:'Assignment Questions' },
  { id:'provided_materials', name:'Provided Materials' },
  { id:'lab_manuals', name:'Lab Manuals' }
];

export const AdminDashboard: React.FC = () => {
  const { user: currentUser, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'materials'>('users');
  const [userFilter, setUserFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [fReg, setFReg] = useState('');
  const [fSem, setFSem] = useState('');
  const [fBranch, setFBranch] = useState('');
  const [fSubject, setFSubject] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchMaterials();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [materials, fReg, fSem, fBranch, fSubject]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage('');
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    } catch (e) {
      console.error('Error fetching users', e);
    }
    setLoading(false);
  };

  const fetchMaterials = async () => {
    try {
      const q = query(collection(db, 'materials'), orderBy('uploaded_at', 'desc'));
      const snap = await getDocs(q);
      setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() } as Material)));
    } catch (e) {
      console.error('Error fetching materials', e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user profile?')) return;
    await deleteDoc(doc(db, 'users', userId));
    fetchUsers();
  };

  const handleDeleteMaterial = async (id: string, fileUrl: string) => {
    if (!confirm('Delete this material?')) return;

    try {
      if (fileUrl) await deleteObject(ref(storage, fileUrl));
      await deleteDoc(doc(db, 'materials', id));
      fetchMaterials();
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewMaterial = async (fileUrl: string) => {
    if (!fileUrl) return;
    try {
      const url = await getDownloadURL(ref(storage, fileUrl));
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  const applyFilters = () => {
    let list = [...materials];
    if (fReg) list = list.filter(m => m.regulation === fReg);
    if (fSem) list = list.filter(m => m.semester === fSem);
    if (fBranch) list = list.filter(m => m.section === fBranch);
    if (fSubject) list = list.filter(m => m.subject?.toLowerCase().includes(fSubject.toLowerCase()));
    setFilteredMaterials(list);
  };

  const getFilteredSubjects = () => {
    return Array.from(new Set(
      materials
        .filter(m => (!fReg || m.regulation === fReg) && (!fSem || m.semester === fSem) && (!fBranch || m.section === fBranch))
        .map(m => m.subject)
        .filter(Boolean)
    )).sort();
  };

  const stats = {
    totalUsers: users.length,
    students: users.filter(u => u.role === 'student').length,
    teachers: users.filter(u => u.role === 'teacher').length,
    totalMaterials: materials.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <div className="sticky top-0 z-30 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div>
            <p className="text-sm text-white/60">Welcome back,</p>
            <p className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {currentUser?.name}
            </p>
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition border border-red-500/30"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} gradient="from-blue-500 to-blue-600" onClick={() => { setActiveTab('users'); setUserFilter('all'); }} />
          <StatCard label="Students" value={stats.students} icon={Users} gradient="from-green-500 to-emerald-600" onClick={() => { setActiveTab('users'); setUserFilter('student'); }} />
          <StatCard label="Teachers" value={stats.teachers} icon={Users} gradient="from-purple-500 to-purple-600" onClick={() => { setActiveTab('users'); setUserFilter('teacher'); }} />
          <StatCard label="Materials" value={stats.totalMaterials} icon={FileText} gradient="from-orange-500 to-orange-600" onClick={() => setActiveTab('materials')} />
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="border-b border-white/10 px-6 flex gap-8">
            <Tab active={activeTab==='users'} onClick={()=>setActiveTab('users')}>
              User Management
            </Tab>
            <Tab active={activeTab==='materials'} onClick={()=>setActiveTab('materials')}>
              Material Management
            </Tab>
          </div>

          {activeTab==='users' && (
            <>
              {successMessage && (
                <div className="mx-6 mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300" role="status" aria-live="polite">
                  {successMessage}
                </div>
              )}

              <div className="px-6 py-6 flex justify-between items-center border-b border-white/10">
                <h2 className="font-bold text-white text-lg">
                  {userFilter === 'all' ? 'All Users' : userFilter === 'student' ? 'Students' : 'Teachers'}
                </h2>
                {userFilter !== 'student' && (
                  <button
                    onClick={()=>setShowCreateUser(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition"
                  >
                    <UserPlus className="h-4 w-4"/>
                    Create User
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/10">
                {loading ? (
                  <div className="py-12 text-center text-white/60">Loading...</div>
                ) : users.filter(u => userFilter === 'all' || u.role === userFilter).length === 0 ? (
                  <div className="py-12 text-center text-white/60">No users found</div>
                ) : (
                  users.filter(u => userFilter === 'all' || u.role === userFilter).map(u=>(
                    <div key={u.id} className="px-6 py-4 flex justify-between items-center hover:bg-white/5 transition group">
                      <div>
                        <div className="font-semibold text-white group-hover:text-blue-400 transition">{u.name}</div>
                        <div className="text-xs text-white/40 mt-1">
                          <span className={`inline-block px-2 py-1 rounded text-white/70 text-xs mr-2 ${u.role === 'student' ? 'bg-green-500/20' : u.role === 'teacher' ? 'bg-purple-500/20' : 'bg-orange-500/20'}`}>
                            {u.role.toUpperCase()}
                          </span>
                          {u.email}
                        </div>
                      </div>

                      {u.role === 'teacher' && (
                        <button
                          onClick={()=>handleDeleteUser(u.id)}
                          disabled={u.id===currentUser?.id}
                          className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab==='materials' && (
            <div>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border-b border-white/10 shadow-2xl m-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-blue-400"/>
                  <h2 className="font-semibold text-white">Filter Materials</h2>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <Select value={fReg} set={setFReg} options={REGULATIONS} label="Regulation"/>
                  <Select value={fSem} set={setFSem} options={SEMESTERS} label="Semester"/>
                  <Select value={fBranch} set={setFBranch} options={BRANCHES} label="Branch"/>
                  <Select value={fSubject} set={setFSubject} options={getFilteredSubjects()} label="Subject"/>
                </div>
              </div>

              <div className="px-6 py-6 border-b border-white/10">
                <h2 className="font-bold text-white text-lg">All Materials ({filteredMaterials.length})</h2>
              </div>

              {filteredMaterials.length === 0 ? (
                <div className="py-12 text-center text-white/60">No materials found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {filteredMaterials.map(m=>(
                    <div key={m.id} className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-white/10 p-4 hover:border-white/20 hover:shadow-xl transition group">
                      <h3 className="font-semibold text-white mb-2 truncate group-hover:text-blue-400 transition" title={m.title}>{m.title}</h3>
                      <div className="text-xs text-white/50 mb-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">{m.regulation}</span>
                          <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">{m.semester}</span>
                        </div>
                        <div>{m.section} • {m.subject}</div>
                        <div className="text-white/40">{m.category.replace(/_/g, ' ')}</div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-white/10">
                        <button
                          onClick={()=>handleViewMaterial(m.file_url)}
                          className="flex-1 flex items-center justify-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                        >
                          <Eye className="h-4 w-4"/>
                          View
                        </button>
                        <button
                          onClick={()=>handleDeleteMaterial(m.id,m.file_url)}
                          className="flex-1 flex items-center justify-center gap-1 text-red-400 hover:text-red-300 text-sm font-medium transition"
                        >
                          <Trash2 className="h-4 w-4"/>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showCreateUser && (
        <CreateUserModal
          onClose={()=>setShowCreateUser(false)}
          onSuccess={(createdName)=>{
            setShowCreateUser(false);
            setActiveTab('users');
            setUserFilter('all');
            setSuccessMessage(`${createdName || 'User'} successfully added`);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

const StatCard = ({label,value,icon:Icon,gradient='from-blue-500 to-blue-600',onClick}:any)=>(
  <div 
    className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-white/10 cursor-pointer hover:border-white/20 hover:shadow-xl transition-all group"
    onClick={onClick}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-white/60 mb-2">{label}</p>
        <p className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{value}</p>
      </div>
      <div className={`h-12 w-12 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition`}>
        <Icon className="h-6 w-6 text-white"/>
      </div>
    </div>
  </div>
);

const Tab = ({children,active,onClick}:any)=>(
  <button
    onClick={onClick}
    className={`py-4 border-b-2 font-semibold transition ${
      active ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/60 hover:text-white/80'
    }`}
  >
    {children}
  </button>
);

const Select = ({value,set,options,label}:any)=>(
  <select value={value} onChange={e=>set(e.target.value)} className="bg-slate-700/50 border border-white/10 p-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-white transition">
    <option value="" className="bg-slate-700">{label}</option>
    {options.map((o:string)=>(
      <option key={o} value={o} className="bg-slate-700">
        {typeof o === 'string' && o.includes('_') ? CATEGORIES.find(c=>c.id===o)?.name || o : o}
      </option>
    ))}
  </select>
);

const CreateUserModal: React.FC<{
  onClose: () => void;
  onSuccess: (createdName: string) => void;
}> = ({ onClose, onSuccess }) => {

  const [form, setForm] = useState({
    email:'',
    password:'',
    name:'',
    role:'teacher' as UserRole
  });

  const [creating,setCreating]=useState(false);
  const [error,setError]=useState('');

  const handleSubmit = async(e:React.FormEvent)=>{
    e.preventDefault();
    setCreating(true);
    setError('');

    try{
      // Initialize a secondary Firebase app instance to avoid replacing the current admin session
      const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
      const secondaryAuth = getAuth(secondaryApp);

      const {user:newUser}=await createUserWithEmailAndPassword(
        secondaryAuth,
        form.email,
        form.password
      );

      const profile:User={
        id:newUser.uid,
        email:form.email,
        name:form.name,
        role:form.role,
        created_at:new Date().toISOString()
      } as User;

      await setDoc(doc(db,'users',newUser.uid),profile);

      // Clean up the secondary app
      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);

      onSuccess(form.name);
    }catch(e:any){
      setError(e.message);
    }

    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-96 p-6 shadow-2xl border border-white/10">
        <div className="flex justify-between mb-6">
          <h2 className="font-bold text-lg text-white">Create Faculty</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X className="h-5 w-5"/></button>
        </div>

        {error && <div className="text-red-400 mb-4 bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={e=>setForm({...form,name:e.target.value})}
            className="w-full bg-slate-700/50 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-white placeholder-white/40 transition"
            required
          />

          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e=>setForm({...form,email:e.target.value})}
            className="w-full bg-slate-700/50 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-white placeholder-white/40 transition"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e=>setForm({...form,password:e.target.value})}
            className="w-full bg-slate-700/50 border border-white/10 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-white placeholder-white/40 transition"
            required
          />

          <button
            disabled={creating}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 font-semibold transition"
          >
            {creating?'Creating...':'Create Faculty'}
          </button>
        </form>
      </div>
    </div>
  );
};
