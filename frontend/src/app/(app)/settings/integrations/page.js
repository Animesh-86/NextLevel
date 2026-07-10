'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import IntegrationCard from '@/components/IntegrationCard';
import { Upload, Download, FileText, Calendar, Cloud } from 'lucide-react';

export default function IntegrationsPage() {
  const [notionConnected, setNotionConnected] = useState(false);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    console.log("Integrations page mounted");
    console.log("Current window.location.search:", window.location.search);
    console.log("localStorage gcalConnected:", localStorage.getItem('gcalConnected'));
    console.log("localStorage notionConnected:", localStorage.getItem('notionConnected'));

    // Check local storage first
    if (localStorage.getItem('notionConnected') === 'true') {
      console.log("Setting notionConnected to true from localStorage");
      setNotionConnected(true);
    }
    if (localStorage.getItem('gcalConnected') === 'true') {
      console.log("Setting gcalConnected to true from localStorage");
      setGcalConnected(true);
    }

    // Then check query params from a fresh OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const connectedParam = params.get('connected');
    console.log("URL connectedParam:", connectedParam);
    
    if (connectedParam === 'notion') {
      console.log("Setting notionConnected to true from URL param");
      setNotionConnected(true);
      localStorage.setItem('notionConnected', 'true');
    } else if (connectedParam === 'google') {
      console.log("Setting gcalConnected to true from URL param");
      setGcalConnected(true);
      localStorage.setItem('gcalConnected', 'true');
    }
  }, []);

  const handleNotionConnect = () => {
    const clientId = '398d872b-594c-811b-bd9c-00370889bddf';
    const redirectUri = encodeURIComponent('http://localhost:8080/api/integrations/notion/callback');
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}`;
    window.location.href = authUrl;
  };

  const handleGcalConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1001317630355-ov73mljn8f7cml51ta79h95k9f5b4b4i.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent('http://localhost:8080/api/integrations/google/callback');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    // Scaffold for export
    setTimeout(() => {
      alert(`Exported as ${format.toUpperCase()}`);
      setIsExporting(false);
    }, 1000);
  };

  const handleImport = () => {
    // Scaffold for import
    alert("File picker for .zip (Obsidian) or .json will open here");
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Integrations</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Connect your favorite tools and manage your data portability.
        </p>
      </header>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          Data Import & Export
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Export Box */}
          <div style={{
            padding: '1.5rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--surface-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Download size={24} style={{ color: 'var(--text-secondary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Export Data</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Download your entire second brain. Backup your captures, links, and graph locally.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => handleExport('json')}
                disabled={isExporting}
                style={{ padding: '0.5rem 1rem', background: 'var(--surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', cursor: 'pointer', flex: 1 }}
              >
                JSON
              </button>
              <button 
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                style={{ padding: '0.5rem 1rem', background: 'var(--surface-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', cursor: 'pointer', flex: 1 }}
              >
                CSV
              </button>
            </div>
          </div>

          {/* Import Box */}
          <div style={{
            padding: '1.5rem',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--surface-primary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Upload size={24} style={{ color: 'var(--text-secondary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Import Data</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Upload an Obsidian Vault (.zip) or a JSON backup to populate your brain.
            </p>
            <button 
              onClick={handleImport}
              style={{ width: '100%', padding: '0.5rem 1rem', background: 'var(--foreground)', color: 'var(--background)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500 }}
            >
              Select File...
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          Connected Apps
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <IntegrationCard 
            title="Notion"
            description="Import databases and pages directly from your Notion workspace."
            icon={<FileText size={24} />}
            isConnected={notionConnected}
            onConnect={handleNotionConnect}
            onDisconnect={() => { setNotionConnected(false); localStorage.removeItem('notionConnected'); }}
          />

          <IntegrationCard 
            title="Google Calendar"
            description="Sync your tasks, study sessions, and events to your calendar."
            icon={<Calendar size={24} />}
            isConnected={gcalConnected}
            onConnect={handleGcalConnect}
            onDisconnect={() => { setGcalConnected(false); localStorage.removeItem('gcalConnected'); }}
          />
        </div>
      </section>

    </div>
  );
}
