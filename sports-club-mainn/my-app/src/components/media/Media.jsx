"use client";
import React, { useState, useEffect } from "react";
import { Eye, Heart, MessageCircle, Image as ImageIcon, Video, FileText, PlugZap } from "lucide-react";
import { api } from "@/src/lib/api"; // الربط الأساسي

export default function Media() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  // The Media/Posts microservice (/posts) isn't deployed yet. Track that so
  // the page degrades to a friendly "not connected" state instead of crashing.
  const [connected, setConnected] = useState(true);

  const [formData, setFormData] = useState({
    category: "",
    title: "",
    desc: "",
    date: "",
    type: "Article",
  });

  // 1. جلب المنشورات من السيرفر
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getPosts();
      const actualData = data?.content || (Array.isArray(data) ? data : []);
      setPosts(actualData);
      setConnected(true);
    } catch (err) {
      console.error("Fetch Posts Error:", err);
      // Backend missing → flip to empty state, don't crash.
      setConnected(false);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 2. دالة حفظ/تعديل المنشور (POST/PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIndex !== null) {
        const postId = posts[editingIndex].id;
        await api.updatePost(postId, formData);
      } else {
        await api.createPost(formData);
      }
      await fetchPosts();
      setModalOpen(false);
    } catch (err) {
      alert("Error saving post: " + err.message);
    }
  };

  const openModal = (post = null, index = null) => {
    if (post) {
      setFormData({ ...post });
      setEditingIndex(index);
    } else {
      setFormData({ category: "", title: "", desc: "", date: "", type: "Article" });
      setEditingIndex(null);
    }
    setModalOpen(true);
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title?.toLowerCase().includes(search.toLowerCase()) ||
      post.desc?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "All" || post.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="bg-slate-950 min-h-screen p-6 overflow-y-auto w-full">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Gradient Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a] p-8 shadow-2xl">
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-100 tracking-tight mb-2">Media & Communications</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">FC Barcelona · News and Fan Engagement</p>
            </div>
            <button onClick={() => openModal()} disabled={!connected} className="px-6 py-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
              + Create Post
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] animate-pulse">Loading Media Hub...</div>
        ) : !connected ? (
          <NotConnected />
        ) : (
          <>
            {/* Stats - Dynamic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Total Posts", value: posts.length, icon: FileText },
                { title: "Engagement", value: posts.reduce((acc, p) => acc + (p.likes || 0), 0), icon: Heart },
                { title: "Videos", value: posts.filter(p => p.type === 'Video').length, icon: Video },
                { title: "Comments", value: posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0), icon: MessageCircle },
              ].map((s, i) => (
                <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex justify-between items-center group">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{s.title}</p>
                    <h3 className="text-2xl font-black text-slate-100">{s.value}</h3>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl text-emerald-500 group-hover:bg-emerald-500/10 transition-all">
                    <s.icon size={22} />
                  </div>
                </div>
              ))}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-2xl py-3 px-6 text-slate-200 text-[10px] font-black uppercase tracking-widest outline-none focus:border-emerald-500/50 w-full md:w-80"
              />
              <div className="flex gap-2 overflow-x-auto">
                {["All", "Article", "Video", "Social"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-slate-100 text-slate-950" : "text-slate-500"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Posts Grid */}
            {filteredPosts.length === 0 ? (
              <p className="text-center py-16 text-slate-600 font-black uppercase text-[10px] tracking-widest">No posts match your filters</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPosts.map((p, i) => (
                  <div key={i} className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden group">
                    <div className="h-40 bg-slate-950 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-emerald-500/5" />
                      {p.type === "Video" ? <Video size={40} className="text-emerald-500 opacity-50" /> : <ImageIcon size={40} className="text-emerald-500 opacity-50" />}
                    </div>
                    <div className="p-6">
                      <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full uppercase">{p.category}</span>
                      <h4 className="text-sm font-black text-slate-100 uppercase mt-4 mb-2">{p.title}</h4>
                      <p className="text-xs text-slate-500 mb-6 line-clamp-2">{p.desc}</p>
                      <div className="flex gap-4 border-t border-slate-800 pt-4">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold"><Eye size={12}/> {p.views || 0}</span>
                        <span className="flex items-center gap-1 text-[10px] text-rose-500 font-bold"><Heart size={12} fill="currentColor"/> {p.likes || 0}</span>
                      </div>
                      <button onClick={() => openModal(p, i)} className="mt-6 w-full py-3 bg-slate-950 border border-slate-800 text-[10px] font-black text-slate-400 rounded-xl hover:text-white hover:border-emerald-500 transition-all uppercase tracking-widest">
                        Edit Post
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-950 rounded-2xl p-8 w-full max-w-md border border-slate-800">
             <h2 className="text-lg font-black text-slate-100 mb-6 uppercase tracking-tight">
               {editingIndex !== null ? "Update Media Post" : "Create New Post"}
             </h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="Post Title" className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-white outline-none"
                  value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                <textarea placeholder="Content Description" className="w-full bg-slate-900 p-3 rounded-xl border border-slate-700 text-white outline-none h-24"
                  value={formData.desc} onChange={(e) => setFormData({...formData, desc: e.target.value})} required />
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-white" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="Article">Article</option>
                    <option value="Video">Video</option>
                    <option value="Social">Social</option>
                  </select>
                  <input type="text" placeholder="Category" className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-white"
                    value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px]">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px]">Save Post</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Friendly empty state shown when the Media/Posts microservice isn't reachable.
function NotConnected() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 px-8 py-20 text-center">
      <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="relative max-w-md mx-auto flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
          <PlugZap size={30} />
        </div>
        <h3 className="text-xl font-black text-slate-100 mb-3">Media service not connected</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          The media &amp; communications microservice isn&apos;t available yet.
          Once the Media backend is deployed, club news, videos and social posts
          will appear here automatically — no further setup required.
        </p>
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Awaiting backend
        </span>
      </div>
    </div>
  );
}
