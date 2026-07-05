'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Link2, Search, Upload, Plus, ExternalLink, FolderOpen } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { SkeletonCard } from '@/components/SkeletonLoader';

function itemId(item) {
  return item._id || item.id;
}

export default function LibraryPage() {
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      setLoading(true);
      try {
        const [filesRes, linksRes] = await Promise.all([
          apiFetch('/api/files'),
          apiFetch('/api/links'),
        ]);
        const [filesData, linksData] = await Promise.all([
          filesRes.json(),
          linksRes.json(),
        ]);

        if (!active) return;
        setFiles(filesData.success ? filesData.data || [] : []);
        setLinks(linksData.success ? linksData.data || [] : []);
      } catch (err) {
        if (active) {
          setFiles([]);
          setLinks([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLibrary();
    return () => {
      active = false;
    };
  }, []);

  const filteredFiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return files;
    return files.filter((file) =>
      [file.title, file.fileName, file.summary, file.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [files, search]);

  const filteredLinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return links;
    return links.filter((link) =>
      [link.title, link.url, link.description, link.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q))
    );
  }, [links, search]);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <header className="capture-hub-header">
        <div>
          <h1 className="capture-hub-title">Library</h1>
          <p className="capture-hub-subtitle">
            Files and saved links in one searchable place.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="btn btn-secondary" href="/vault">
            <Upload size={16} /> Upload File
          </Link>
          <Link className="btn btn-primary" href="/links">
            <Plus size={16} /> Add Link
          </Link>
        </div>
      </header>

      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <FileText size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{files.length}</span>
          <span className="dash-stat-label">Files</span>
        </div>
        <div className="dash-stat-card">
          <Link2 size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{links.length}</span>
          <span className="dash-stat-label">Links</span>
        </div>
        <div className="dash-stat-card">
          <FolderOpen size={22} className="dash-stat-icon" />
          <span className="dash-stat-value">{files.length + links.length}</span>
          <span className="dash-stat-label">Library Items</span>
        </div>
      </div>

      <div className="capture-toolbar">
        <div className="capture-search-wrapper">
          <Search size={16} className="capture-search-icon" />
          <input
            className="input capture-search-input"
            type="text"
            placeholder="Search files and links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="dash-main-grid">
          <SkeletonCard height="260px" />
          <SkeletonCard height="260px" />
        </div>
      ) : (
        <div className="dash-main-grid">
          <section className="card">
            <div className="card-title-row">
              <h2 className="card-title">Files</h2>
              <Link className="dash-see-all" href="/vault">Manage files</Link>
            </div>
            <div className="dash-capture-list">
              {filteredFiles.slice(0, 8).map((file) => (
                <Link key={itemId(file)} className="dash-capture-item" href="/vault">
                  <span className="dash-capture-title">{file.title || file.fileName || 'Untitled file'}</span>
                  <span className="dash-capture-cat">{file.fileType || file.category || 'file'}</span>
                </Link>
              ))}
              {filteredFiles.length === 0 && (
                <div className="dash-empty-mini">
                  <FileText size={24} />
                  <p>No files match your search.</p>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-title-row">
              <h2 className="card-title">Links</h2>
              <Link className="dash-see-all" href="/links">Manage links</Link>
            </div>
            <div className="dash-capture-list">
              {filteredLinks.slice(0, 8).map((link) => (
                <a
                  key={itemId(link)}
                  className="dash-capture-item"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="dash-capture-title">{link.title || link.url || 'Untitled link'}</span>
                  <span className="dash-capture-cat"><ExternalLink size={12} /></span>
                </a>
              ))}
              {filteredLinks.length === 0 && (
                <div className="dash-empty-mini">
                  <Link2 size={24} />
                  <p>No links match your search.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
