import React, { useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { ThemeType } from '../types';
import { Download, X, Image as ImageIcon, Loader2, Camera, AlertCircle, CheckCircle2, Save, Info } from 'lucide-react';

interface AssetExporterProps {
  onClose: () => void;
}

const themes: ThemeType[] = ['gameboy', 'cassette', 'cyberpunk', 'stealth'];

export const AssetExporter: React.FC<AssetExporterProps> = ({ onClose }) => {
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [isSnapshotted, setIsSnapshotted] = useState(false);
  const [snapshots, setSnapshots] = useState<Record<string, string>>({});

  const generateSnapshots = async () => {
    setExportingId('all');
    setErrorInfo(null);
    const newSnapshots: Record<string, string> = {};

    try {
      // 遍历所有主题和组件进行“拍照”
      for (const theme of themes) {
        const ids = [
          `btn-${theme}`, 
          `panel-${theme}`, 
          `tag-${theme}`, 
          `led-${theme}`
        ];
        
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el) {
            try {
              const dataUrl = await htmlToImage.toPng(el, { 
                pixelRatio: 2, 
                backgroundColor: 'transparent',
                cacheBust: true,
              }).catch(async () => {
                console.warn(`Font loading issues for ${id}, falling back...`);
                return await htmlToImage.toPng(el, { pixelRatio: 2, skipFonts: true });
              });
              newSnapshots[id] = dataUrl;
            } catch (e) {
              console.error(`Failed to snapshot ${id}`, e);
            }
          }
        }
      }

      // 捕获 CRT 纹理
      const crtEl = document.getElementById('crt-pattern');
      if (crtEl) {
        try {
          newSnapshots['crt-pattern'] = await htmlToImage.toPng(crtEl, { pixelRatio: 1 });
        } catch (e) {
          console.error("Failed to snapshot CRT pattern", e);
        }
      }

      setSnapshots(newSnapshots);
      setIsSnapshotted(true);
    } catch (err) {
      console.error(err);
      setErrorInfo("生成快照失败。请确保页面已完全加载，并在现代浏览器中重试。");
    } finally {
      setExportingId(null);
    }
  };

  const downloadSingle = (id: string, name: string) => {
    const data = snapshots[id];
    if (!data) return;
    const link = document.createElement('a');
    link.href = data;
    link.download = `${name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[600] overflow-y-auto p-6 text-white font-mono selection:bg-orange-500">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b-2 border-white/10 pb-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-xl shadow-lg shadow-orange-500/20">
              <ImageIcon size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                UI SNAPSHOTTER <span className="text-orange-500">/ 资源仓库</span>
              </h2>
              <p className="text-[10px] opacity-50 mt-1 uppercase tracking-widest">Convert CSS components to Image assets</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {!isSnapshotted ? (
              <button 
                onClick={generateSnapshots}
                disabled={exportingId !== null}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-black text-xs transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                {exportingId === 'all' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                {exportingId === 'all' ? 'CAPTURING UI...' : 'GENERATE ALL IMG SNAPSHOTS'}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-[10px] font-black uppercase animate-pulse">
                <Save size={14} /> Ready to "Save Page As"
              </div>
            )}
            <button 
              onClick={onClose} 
              className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </header>

        {errorInfo && (
          <div className="mb-8 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl flex items-center gap-3 text-red-200">
            <AlertCircle />
            <p className="text-xs font-bold">{errorInfo}</p>
          </div>
        )}

        {isSnapshotted ? (
          <div className="mb-8 p-6 bg-blue-500/10 border-2 border-blue-500/50 rounded-2xl flex items-start gap-5 text-blue-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-blue-500 p-2 rounded-lg">
                <CheckCircle2 size={24} className="text-white" />
            </div>
            <div>
              <p className="text-base font-black uppercase mb-1">快照就绪！(SNAPSHOT_READY)</p>
              <p className="text-[11px] opacity-80 leading-relaxed">
                现在页面上显示的所有 UI 元素都已经转换成了标准的 <code className="bg-white/20 px-1 rounded">IMG</code> 图片标签。
                <br />
                <span className="text-orange-400 font-bold">导出建议：</span> 直接按 <kbd className="bg-white/20 px-1 rounded text-[9px]">Ctrl + S</kbd> 保存网页，
                或者右键点击下方的任何组件选择“图片另存为”。
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-zinc-900 border border-white/10 rounded-xl flex items-center gap-4 text-zinc-400">
             <Info size={20} className="text-orange-500" />
             <p className="text-[10px] font-bold uppercase tracking-widest">请点击上方的黄色按钮，将所有的 CSS 实时组件转换为可保存的图片资源。</p>
          </div>
        )}

        <div className="space-y-16">
          {themes.map(theme => (
            <section key={theme} className={`theme-${theme} p-8 border-2 border-white/10 rounded-2xl bg-zinc-900/50 backdrop-blur-sm relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 font-black text-6xl pointer-events-none uppercase">{theme}</div>
              
              <h3 className="text-lg font-black uppercase mb-10 border-l-4 border-orange-500 pl-4 tracking-widest">
                Profile: {theme.toUpperCase()}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                <AssetBox 
                  id={`btn-${theme}`} 
                  label="UI_Button" 
                  snapshot={snapshots[`btn-${theme}`]} 
                  onDownload={() => downloadSingle(`btn-${theme}`, `ui_${theme}_button`)}
                >
                  <div className="cassette-button px-8 py-3 no-active whitespace-nowrap">BUTTON_UI</div>
                </AssetBox>

                <AssetBox 
                  id={`panel-${theme}`} 
                  label="UI_Panel" 
                  snapshot={snapshots[`panel-${theme}`]} 
                  onDownload={() => downloadSingle(`panel-${theme}`, `ui_${theme}_panel`)}
                >
                  <div className="hardware-panel w-32 h-20 flex items-center justify-center font-black text-[10px]">PANEL</div>
                </AssetBox>

                <AssetBox 
                  id={`tag-${theme}`} 
                  label="UI_Label" 
                  snapshot={snapshots[`tag-${theme}`]} 
                  onDownload={() => downloadSingle(`tag-${theme}`, `ui_${theme}_label`)}
                >
                  <div className="label-tag">MONKEY_V1.0</div>
                </AssetBox>

                <AssetBox 
                  id={`led-${theme}`} 
                  label="UI_LEDs" 
                  snapshot={snapshots[`led-${theme}`]} 
                  onDownload={() => downloadSingle(`led-${theme}`, `ui_${theme}_leds`)}
                >
                  <div className="flex gap-4 p-4 bg-black/40 rounded-lg border border-white/5">
                      <div className="status-led text-green-500 bg-current scale-150"></div>
                      <div className="status-led text-red-500 bg-current scale-150"></div>
                      <div className="status-led text-blue-500 bg-current scale-150"></div>
                  </div>
                </AssetBox>
              </div>
            </section>
          ))}

          <section className="p-8 border-2 border-dashed border-white/10 rounded-2xl bg-zinc-900/30 text-center relative overflow-hidden">
            <h3 className="text-sm font-bold opacity-50 mb-8 uppercase tracking-[0.4em]">CRT Texture Snap</h3>
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div id="crt-pattern" className="w-64 h-32 relative overflow-hidden bg-black rounded-lg border-2 border-white/10">
                {snapshots['crt-pattern'] ? (
                  <img src={snapshots['crt-pattern']} className="w-full h-full object-cover" alt="CRT Texture" />
                ) : (
                  <div className="absolute inset-0" style={{ 
                    background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(255, 255, 255, 0.1) 50%)',
                    backgroundSize: '100% 4px'
                  }}></div>
                )}
              </div>
            </div>
          </section>
        </div>
        
        <footer className="mt-20 py-16 border-t border-white/5 text-center">
          <p className="text-[10px] opacity-20 font-black tracking-[1em] uppercase">Pixel Monkey Dev Resource Center // Snapshot Mode</p>
        </footer>
      </div>
    </div>
  );
};

interface AssetBoxProps {
  id: string;
  label: string;
  snapshot?: string;
  children: React.ReactNode;
  onDownload: () => void;
}

const AssetBox: React.FC<AssetBoxProps> = ({ id, label, snapshot, children, onDownload }) => (
  <div className="bg-black/20 p-6 rounded-xl border border-white/5 flex flex-col justify-between h-44 group/box transition-all hover:bg-black/40">
    <div className="flex justify-between items-start">
      <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{label}</label>
      {snapshot && (
        <button 
          onClick={onDownload}
          className="p-2 bg-white/10 hover:bg-orange-500 rounded-md transition-all text-[10px] font-bold flex items-center gap-1 group-hover/box:opacity-100"
        >
          <Download size={12} /> PNG
        </button>
      )}
    </div>
    <div className="flex justify-center items-center flex-1 py-4">
      {snapshot ? (
        <img src={snapshot} alt={label} className="max-h-28 object-contain shadow-2xl animate-in zoom-in duration-300" />
      ) : (
        <div id={id}>{children}</div>
      )}
    </div>
  </div>
);
