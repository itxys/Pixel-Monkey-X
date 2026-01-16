
import React, { useState, useEffect, useRef } from 'react';
import { PixelArt, Language } from '../types';
import { getAllArts, createNewArt, deleteArt, saveArt } from '../services/storage';
import { Plus, Trash2, Database, Monitor, Cpu, Languages, Image as ImageIcon, Upload } from 'lucide-react';

interface GalleryProps {
  onSelect: (art: PixelArt) => void;
}

const translations = {
  zh: {
    title: '像素猴',
    storageLabel: '单元: 存储_V1.1_稳定版',
    readOk: '读取完毕',
    noData: '驱动器 A: 未找到数据单元',
    initButton: '初始化新单元',
    importButton: '导入外部图像',
    modalTitle: '格式化系统作品',
    unitLabel: '单元标签',
    gridRes: '网格分辨率',
    cancel: '取消',
    confirm: '确认',
    placeholder: '未命名数据',
    deleteConfirm: '确认抹除此数据单元？',
    idLabel: '编号',
    processing: '正在解析数据...',
  },
  en: {
    title: 'PixelMonkey',
    storageLabel: 'Unit: STORAGE_V1.1_STABLE',
    readOk: 'READ_OK',
    noData: 'NO DATA FOUND IN DRIVE A:',
    initButton: 'INITIALIZE NEW UNIT',
    importButton: 'IMPORT EXTERNAL IMAGE',
    modalTitle: 'Format System Art',
    unitLabel: 'Unit Label',
    gridRes: 'Grid Resolution',
    cancel: 'CANCEL',
    confirm: 'CONFIRM',
    placeholder: 'UNTITLED_DATA',
    deleteConfirm: 'Confirm erase this data unit?',
    idLabel: 'ID',
    processing: 'PARSING_DATA...',
  }
};

export const Gallery: React.FC<GalleryProps> = ({ onSelect }) => {
  const [arts, setArts] = useState<PixelArt[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportMode, setIsImportMode] = useState(false);
  const [newArtName, setNewArtName] = useState('');
  const [newSize, setNewSize] = useState(32);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('pixel_monkey_lang') as Language) || 'zh');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  useEffect(() => {
    setArts(getAllArts().sort((a, b) => b.updatedAt - a.updatedAt));
    localStorage.setItem('pixel_monkey_lang', lang);
  }, [lang]);

  const handleCreate = () => {
    if (!newArtName.trim()) return;
    
    if (isImportMode && pendingImage) {
      processAndCreateFromImage();
    } else {
      const art = createNewArt(newArtName, newSize);
      onSelect(art);
    }
  };

  const processAndCreateFromImage = () => {
    if (!pendingImage) return;
    setIsProcessing(true);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = newSize;
      canvas.height = newSize;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (ctx) {
        // High quality pixelation by disabling smoothing
        ctx.imageSmoothingEnabled = false;
        
        // Handle aspect ratio: crop to center square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, newSize, newSize);
        
        const imageData = ctx.getImageData(0, 0, newSize, newSize).data;
        const pixelData: (string | null)[] = [];
        
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];
          
          if (a < 128) {
            pixelData.push(null);
          } else {
            const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            pixelData.push(hex);
          }
        }
        
        const art = createNewArt(newArtName, newSize);
        art.layers[0].data = pixelData;
        
        // Generate preview
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = newSize;
        previewCanvas.height = newSize;
        const pCtx = previewCanvas.getContext('2d');
        if (pCtx) {
          pixelData.forEach((color, idx) => {
            if (!color) return;
            pCtx.fillStyle = color;
            pCtx.fillRect(idx % newSize, Math.floor(idx / newSize), 1, 1);
          });
          art.preview = previewCanvas.toDataURL();
        }
        
        saveArt(art);
        setIsProcessing(false);
        onSelect(art);
      }
    };
    img.src = pendingImage;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingImage(event.target?.result as string);
        setNewArtName(file.name.split('.')[0].toUpperCase());
        setIsImportMode(true);
        setIsModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t.deleteConfirm)) {
      deleteArt(id);
      setArts(getAllArts().sort((a, b) => b.updatedAt - a.updatedAt));
    }
  };

  const toggleLang = () => setLang(prev => prev === 'zh' ? 'en' : 'zh');

  return (
    <div className="flex flex-col h-full bg-[var(--bg-color)] text-[var(--text-color)] relative theme-transition">
      <header className="p-6 md:p-8 bg-[var(--hardware-beige)] border-b-8 border-[var(--panel-shadow)] flex justify-between items-center text-[var(--text-color)] z-50">
        <div className="relative">
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none italic">
            {lang === 'zh' ? '像素' : 'Pixel'}<span className="text-[var(--accent-orange)]">{lang === 'zh' ? '猴' : 'Monkey'}</span>
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={toggleLang} className="p-2 border-2 border-[var(--border-color)] bg-white/20 hover:bg-white/40 rounded flex items-center gap-2">
            <Languages size={18} />
            <span className="text-[10px] font-black uppercase">{lang}</span>
          </button>
          <div className="flex gap-2">
            <div className="status-led text-green-500 bg-current"></div>
            <div className="status-led text-yellow-500 bg-current animate-pulse"></div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-8 md:pt-10 pb-48 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {arts.map((art) => (
            <div 
              key={art.id} 
              onClick={() => onSelect(art)}
              className="bg-[var(--hardware-dark)] border-4 border-[var(--border-color)] p-4 flex gap-4 hover:border-[var(--accent-orange)] cursor-pointer transition-all hover:scale-[1.02] active:scale-95 relative group overflow-hidden shadow-lg"
            >
              <div className="absolute top-0 right-0 w-24 h-full bg-white/5 -skew-x-12 translate-x-10 pointer-events-none"></div>
              
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--monitor-bg)] border-2 border-[var(--border-color)] shrink-0 relative flex items-center justify-center overflow-hidden">
                {art.preview ? (
                  <img src={art.preview} alt={art.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <Database className="text-[var(--text-color)] opacity-60" size={32} />
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between py-1 overflow-hidden">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs md:text-sm font-black text-white uppercase truncate pr-2">{t.idLabel}: {art.name}</h3>
                    <button onClick={(e) => handleDelete(e, art.id)} className="text-red-500 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-[var(--led-green)] font-mono mt-1 opacity-80">RES: {art.width}x{art.height}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-[var(--accent-orange)] w-full"></div>
                  </div>
                  <span className="text-[8px] font-black font-mono text-white/70">{t.readOk}</span>
                </div>
              </div>
            </div>
          ))}

          {arts.length === 0 && (
            <div className="py-20 col-span-full flex flex-col items-center opacity-30 italic">
              <Monitor size={64} className="mb-4" />
              <p className="text-lg font-bold">{t.noData}</p>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-[var(--bg-color)] via-[var(--bg-color)]/95 to-transparent z-40 flex flex-col items-center gap-3">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 font-mono text-[var(--text-color)] mb-1">
          {t.storageLabel}
        </div>
        
        <div className="w-full max-w-md flex flex-col gap-3">
          <button 
            onClick={() => { setIsImportMode(false); setPendingImage(null); setIsModalOpen(true); }}
            className="w-full p-4 md:p-5 flex items-center justify-center gap-3 font-black uppercase text-xl bg-[var(--accent-orange)] text-white border-4 border-[var(--border-color)] shadow-[6px_6px_0px_var(--border-color)] hover:shadow-[2px_2px_0px_var(--border-color)] hover:translate-x-[4px] hover:translate-y-[4px] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all"
          >
            <Plus size={28} strokeWidth={4} />
            <span>{t.initButton}</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-3 flex items-center justify-center gap-3 font-black uppercase text-sm bg-[var(--hardware-beige)] text-[var(--text-color)] border-4 border-[var(--border-color)] shadow-[4px_4px_0px_var(--border-color)] hover:shadow-[1px_1px_0px_var(--border-color)] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            <Upload size={20} strokeWidth={3} />
            <span>{t.importButton}</span>
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-6 z-[200]">
          <div className="bg-[var(--hardware-beige)] w-full max-w-sm md:max-w-md border-8 border-[var(--border-color)] p-8 text-[var(--text-color)] shadow-[20px_20px_0px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 mb-8 border-b-4 border-[var(--panel-shadow)] pb-4">
              {isImportMode ? <ImageIcon size={24} className="text-[var(--accent-orange)]" /> : <Cpu size={24} className="text-[var(--accent-orange)]" />}
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{isImportMode ? t.importButton : t.modalTitle}</h2>
            </div>
            
            <div className="space-y-6">
              {isImportMode && pendingImage && (
                <div className="flex justify-center bg-black/10 p-2 border-2 border-[var(--panel-shadow)]">
                   <img src={pendingImage} className="max-h-32 object-contain" alt="Preview" />
                </div>
              )}

              <div>
                <label className="block text-[10px] md:text-xs font-black uppercase mb-2">{t.unitLabel}</label>
                <input 
                  type="text" 
                  value={newArtName}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  onChange={(e) => setNewArtName(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full bg-[var(--monitor-bg)] border-4 border-[var(--panel-shadow)] p-4 text-[var(--text-color)] font-black font-mono outline-none focus:border-[var(--accent-orange)] text-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-black uppercase mb-2">{t.gridRes}</label>
                <div className="grid grid-cols-4 gap-3">
                  {[8, 16, 32, 64].map(s => (
                    <button 
                      key={s}
                      onClick={() => setNewSize(s)}
                      className={`p-3 border-4 font-black font-mono text-sm transition-all ${newSize === s ? 'bg-[var(--accent-orange)] border-[var(--border-color)] text-white' : 'bg-white border-[var(--panel-shadow)] text-[var(--text-color)] opacity-60 hover:opacity-100'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 p-4 border-4 border-[var(--border-color)] font-black uppercase text-sm hover:bg-black/10">{t.cancel}</button>
                <button 
                  onClick={handleCreate} 
                  disabled={isProcessing}
                  className="flex-1 bg-[var(--accent-orange)] p-4 border-4 border-[var(--border-color)] text-white font-black uppercase text-sm shadow-[4px_4px_0px_var(--border-color)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                >
                  {isProcessing ? t.processing : t.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
