import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL
} from 'firebase/storage';
import {
  Upload,
  Trash2,
  Eye,
  LogOut,
  MessageSquare,
  Filter,
  X,
  FileText
} from 'lucide-react';
import { ChatBot } from '../shared/ChatBot';
import { Material } from '../../types';

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

export const TeacherDashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  const [materials,setMaterials]=useState<Material[]>([]);
  const [filtered,setFiltered]=useState<Material[]>([]);
  const [showUpload,setShowUpload]=useState(false);
  const [showChat,setShowChat]=useState(false);
  const [loading,setLoading]=useState(false);

  const [fReg,setFReg]=useState('');
  const [fSem,setFSem]=useState('');
  const [fBranch,setFBranch]=useState('');
  const [fSubject,setFSubject]=useState('');

  useEffect(()=>{ fetchMaterials(); },[]);
  useEffect(()=>{ applyFilters(); },[materials,fReg,fSem,fBranch,fSubject]);

  const fetchMaterials = async()=>{
    setLoading(true);
    const q=query(collection(db,'materials'),orderBy('uploaded_at','desc'));
    const snap=await getDocs(q);
    setMaterials(snap.docs.map(d=>({id:d.id,...d.data()} as Material)));
    setLoading(false);
  };

  const applyFilters = ()=>{
    let list=[...materials];

    if(fReg) list=list.filter(m=>m.regulation===fReg);
    if(fSem) list=list.filter(m=>m.semester===fSem);
    if(fBranch) list=list.filter(m=>m.section===fBranch);
    if(fSubject) list=list.filter(m=>m.subject?.toLowerCase().includes(fSubject.toLowerCase()));

    setFiltered(list);
  };

  const deleteMaterial = async(m:Material)=>{
    if(!confirm('Delete this material?')) return;

    try{
      await deleteObject(ref(storage,m.file_url));
      await deleteDoc(doc(db,'materials',m.id));
      fetchMaterials();
    }catch(e){
      console.error(e);
    }
  };

  const downloadMaterial = async(m:Material)=>{
    const url=await getDownloadURL(ref(storage,m.file_url));
    window.open(url,'_blank');
  };

  const getFilteredSubjects = ()=>{
    return Array.from(new Set(
      materials
        .filter(m => (!fReg || m.regulation === fReg) && (!fSem || m.semester === fSem) && (!fBranch || m.section === fBranch))
        .map(m => m.subject)
        .filter(Boolean)
    )).sort();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <div className="sticky top-0 z-30 bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div>
            <p className="text-sm text-white/60">Welcome back,</p>
            <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {user?.name}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={()=>setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 transition border border-purple-500/30"
            >
              <MessageSquare className="h-4 w-4"/>
              AI Assistant
            </button>

            <button
              onClick={()=>setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition"
            >
              <Upload className="h-4 w-4"/>
              Upload
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition border border-red-500/30"
            >
              <LogOut className="h-4 w-4"/>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-white/10 shadow-2xl mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-purple-400"/>
            <h2 className="font-semibold text-white">Filter Materials</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <Select value={fReg} set={setFReg} options={REGULATIONS} label="Regulation"/>
            <Select value={fSem} set={setFSem} options={SEMESTERS} label="Semester"/>
            <Select value={fBranch} set={setFBranch} options={BRANCHES} label="Branch"/>
            <Select value={fSubject} set={setFSubject} options={getFilteredSubjects()} label="Subject"/>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-white mb-4 text-lg">
            Materials ({filtered.length})
          </h2>

          {loading ? (
            <div className="py-12 text-center text-white/60">Loading...</div>
          ) : filtered.length===0 ? (
            <div className="py-12 text-center text-white/60 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10">
              No materials found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(m=>(
                <div key={m.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 p-4 hover:border-white/20 hover:shadow-xl transition group">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                      <FileText className="h-5 w-5 text-white"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate group-hover:text-purple-400 transition" title={m.title}>{m.title}</h3>
                      <p className="text-xs text-purple-300 mt-1">{m.category.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  <div className="text-xs text-white/50 mb-4 space-y-1 bg-white/5 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">{m.regulation}</span>
                      <span className="inline-block px-2 py-1 bg-pink-500/20 text-pink-300 rounded text-xs">{m.semester}</span>
                    </div>
                    <div>{m.section} • {m.subject}</div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={()=>downloadMaterial(m)}
                      className="flex-1 flex items-center justify-center gap-1 text-purple-400 hover:text-purple-300 text-sm font-medium transition"
                    >
                      <Eye className="h-4 w-4"/>
                      View
                    </button>

                    {(m.uploaded_by === user?.id || user?.role === 'admin') && (
                      <button
                        onClick={()=>deleteMaterial(m)}
                        className="flex-1 flex items-center justify-center gap-1 text-red-400 hover:text-red-300 text-sm font-medium transition"
                      >
                        <Trash2 className="h-4 w-4"/>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showUpload && (
        <UploadModal
          onClose={()=>setShowUpload(false)}
          onSuccess={()=>{setShowUpload(false);fetchMaterials();}}
        />
      )}

      {showChat && <ChatBot onClose={()=>setShowChat(false)}/>}
    </div>
  );
};

const UploadModal:React.FC<{onClose:()=>void;onSuccess:()=>void}> = ({onClose,onSuccess})=>{
  const {user}=useAuth();

  const [form,setForm]=useState({
    title:'',
    category:'',
    regulation:'',
    semester:'',
    branch:'',
    subject:''
  });

  const [file,setFile]=useState<File|null>(null);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');
  const [existingSubjects, setExistingSubjects] = useState<string[]>([]);

  useEffect(() => {
    const fetchExistingSubjects = async () => {
      if (!form.regulation || !form.semester || !form.branch) {
        setExistingSubjects([]);
        return;
      }
      
      const q = query(
        collection(db, 'materials'),
        where('regulation', '==', form.regulation),
        where('semester', '==', form.semester),
        where('section', '==', form.branch)
      );
      
      const snap = await getDocs(q);
      const subjects = new Set<string>();
      snap.forEach(d => {
        const data = d.data();
        if (data.subject) subjects.add(data.subject);
      });
      setExistingSubjects([...subjects]);
    };

    fetchExistingSubjects();
  }, [form.regulation, form.semester, form.branch]);

  const handleUpload=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!file||!user) return;

    setUploading(true);

    try{
      const path=`${form.regulation}/${form.semester}/${form.branch}/${form.subject}/${form.category}/${Date.now()}_${file.name}`;

      await uploadBytes(ref(storage,path),file);

      await addDoc(collection(db,'materials'),{
        title:form.title,
        category:form.category,
        regulation:form.regulation,
        semester:form.semester,
        section:form.branch,
        subject:form.subject,
        file_url:path,
        file_name:file.name,
        file_size:file.size,
        uploaded_by:user.id,
        uploaded_at:new Date().toISOString()
      });

      onSuccess();
    }catch(e:any){
      setError(e.message);
    }

    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-[600px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="flex justify-between mb-6">
          <h2 className="font-bold text-lg text-white">Upload Material</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X className="h-5 w-5"/></button>
        </div>

        {error && <div className="text-red-400 mb-4 bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleUpload} className="grid grid-cols-2 gap-4">
          <input placeholder="Title" value={form.title}
            onChange={e=>setForm({...form,title:e.target.value})} 
            className="col-span-2 bg-slate-700/50 border border-white/10 p-2.5 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 text-white placeholder-white/40 transition" 
            required/>

          <Select value={form.category} set={(v:string)=>setForm({...form,category:v})} options={CATEGORIES.map(c=>c.id)} label="Category"/>
          <Select value={form.regulation} set={(v:string)=>setForm({...form,regulation:v})} options={REGULATIONS} label="Regulation"/>
          <Select value={form.semester} set={(v:string)=>setForm({...form,semester:v})} options={SEMESTERS} label="Semester"/>
          <Select value={form.branch} set={(v:string)=>setForm({...form,branch:v})} options={BRANCHES} label="Branch"/>
          
          <div className="col-span-2">
            <Select value={form.subject} set={(v:string)=>setForm({...form,subject:v})} options={existingSubjects} label="Subject" required={true} canAddNew={true}/>
          </div>

          <input type="file" accept=".pdf"
            onChange={e=>setFile(e.target.files?.[0]||null)}
            className="col-span-2 bg-slate-700/50 border border-white/10 p-2 rounded-lg text-white file:bg-purple-600 file:border-0 file:text-white file:px-3 file:py-1 file:rounded file:cursor-pointer hover:border-white/20 transition"
            required/>

          <button disabled={uploading}
            className="col-span-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 font-semibold transition">
            {uploading?'Uploading...':'Upload Material'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Select = ({value,set,options,label,required,canAddNew}:any)=>{
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    set(e.target.value);
  };

  const listId = `list-${label.toLowerCase().replace(/\\s+/g, '-')}`;

  if (canAddNew) {
    return (
      <>
        <input
          list={listId}
          placeholder={label}
          value={value}
          onChange={handleChange}
          className="w-full bg-slate-700/50 border border-white/10 p-2.5 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 text-white placeholder-white/40 transition"
          required={required}
        />
        <datalist id={listId}>
          {options.map((o:string)=>(
            <option key={o} value={o} />
          ))}
        </datalist>
      </>
    );
  }

  return (
    <select value={value} onChange={handleChange} className="bg-slate-700/50 border border-white/10 p-2.5 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 text-white transition" required>
      <option value="" className="bg-slate-700">{label}</option>
      {options.map((o:string)=>(
        <option key={o} value={o} className="bg-slate-700">
          {typeof o === 'string' && o.includes('_') ? CATEGORIES.find(c=>c.id===o)?.name || o : o}
        </option>
      ))}
    </select>
  );
};
