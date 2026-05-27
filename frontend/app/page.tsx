'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { fetchAssignments, deleteAssignment } from '@/lib/api';
import { Bell, Search, Filter, MoreVertical, Plus, Trash2, Eye } from 'lucide-react';

interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

interface Assignment {
  _id: string;
  dueDate: string;
  status: string;
  createdAt: string;
  questionTypes: QuestionType[];
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAssignments()
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a._id !== id));
      setShowConfirm(null);
      setOpenMenu(null);
    } catch {
      alert('Failed to delete assignment. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = assignments.filter(a =>
    a.status.includes(search) ||
    a.questionTypes?.[0]?.type?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    done: 'text-green-600 bg-green-50 border border-green-200',
    processing: 'text-blue-600 bg-blue-50 border border-blue-200',
    pending: 'text-yellow-600 bg-yellow-50 border border-yellow-200',
    failed: 'text-red-600 bg-red-50 border border-red-200',
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-center mb-2">
              Delete Assignment?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete the assignment and its generated
              paper. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showConfirm)}
                disabled={deletingId === showConfirm}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId === showConfirm ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">⊞</span>
          <span className="font-medium text-gray-900">Assignment</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
            <span className="text-sm font-medium text-gray-800">John Doe</span>
            <span className="text-gray-400 text-xs">∨</span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-lg font-bold text-gray-900">Assignments</h1>
        </div>
        <p className="text-sm text-gray-500">
          Manage and create assignments for your classes.
        </p>
      </div>

      {/* Filter + Search */}
      <div className="px-6 pb-4 flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 bg-white transition-colors">
          <Filter size={13} /> Filter By
        </button>
        <div className="flex-1 relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Assignment"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">
              No assignments yet
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              Create your first assignment to start generating AI-powered
              question papers.
            </p>
            <Link href="/assignments/new">
              <button className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2">
                <Plus size={16} /> Create Assignment
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((a) => (
              <div
                key={a._id}
                className="relative"
                ref={openMenu === a._id ? menuRef : null}
              >
                <Link href={`/assignments/${a._id}`}>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer hover:border-orange-200 group">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        Quiz on Electricity
                      </h3>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenu(openMenu === a._id ? null : a._id);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        <span className="font-medium text-gray-700">
                          Assigned on
                        </span>{' '}
                        :{' '}
                        {new Date(a.createdAt)
                          .toLocaleDateString('en-GB')
                          .replace(/\//g, '-')}
                      </span>
                      <span>
                        <span className="font-medium text-gray-700">Due</span>{' '}
                        : {a.dueDate}
                      </span>
                    </div>
                    <div className="mt-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          statusColor[a.status] || ''
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Dropdown Menu */}
                {openMenu === a._id && (
                  <div className="absolute top-10 right-4 bg-white border border-gray-200 rounded-xl shadow-xl z-10 py-1.5 min-w-[160px] overflow-hidden">
                    <Link href={`/assignments/${a._id}`}>
                      <button
                        onClick={() => setOpenMenu(null)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye size={14} className="text-gray-400" />
                        View Assignment
                      </button>
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenu(null);
                        setShowConfirm(a._id);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <Link href="/assignments/new">
        <button className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm font-medium hover:bg-purple-700 transition-all hover:shadow-2xl hover:scale-105">
          <span>⊞</span> Create Assignment
        </button>
      </Link>
    </div>
  );
}