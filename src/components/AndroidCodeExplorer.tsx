import React, { useState } from 'react';
import { ANDROID_PROJECT_FILES } from '../data/androidProjectFiles';
import { Copy, Check, Code, Download, FileCode, Layers, Shield, Cpu } from 'lucide-react';

export const AndroidCodeExplorer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const selectedFile = ANDROID_PROJECT_FILES[selectedFileIndex] || ANDROID_PROJECT_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZipSimulation = () => {
    const element = document.createElement('a');
    const file = new Blob([selectedFile.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = selectedFile.path.split('/').pop() || 'File.kt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Native Android Architecture (Kotlin & Jetpack Compose)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Clean Architecture, Foreground Audio Service, AudioRecord/AudioTrack PCM buffers, and Gemini Live WebSocket engine.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied File' : 'Copy File'}</span>
          </button>

          <button
            onClick={handleDownloadZipSimulation}
            className="px-3.5 py-2 bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Code File</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* File Directory Sidebar */}
        <div className="lg:col-span-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
          <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Project Files</span>
          </div>

          {ANDROID_PROJECT_FILES.map((file, idx) => {
            const fileName = file.path.split('/').pop();
            const isSelected = idx === selectedFileIndex;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left p-2.5 rounded-xl transition-all text-xs flex flex-col space-y-1 ${
                  isSelected
                    ? 'bg-pink-950/60 border border-pink-500/50 text-pink-200 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileCode className={`w-4 h-4 ${isSelected ? 'text-pink-400' : 'text-cyan-400'}`} />
                  <span className="truncate">{fileName}</span>
                </div>
                <span className="text-[10px] text-slate-500 truncate pl-6">{file.description}</span>
              </button>
            );
          })}
        </div>

        {/* Code View Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col h-[500px] overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-cyan-300">
            <span className="truncate max-w-[70%]">{selectedFile.path}</span>
            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {selectedFile.language}
            </span>
          </div>

          <pre className="flex-1 overflow-x-auto overflow-y-auto p-3 text-xs font-mono text-slate-300 leading-relaxed custom-scrollbar selection:bg-pink-500/30 selection:text-pink-200">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
