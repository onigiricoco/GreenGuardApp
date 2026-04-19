import React, { useState, useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Camera, 
  Sprout, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Droplets, 
  Sun, 
  Thermometer, 
  RotateCcw,
  Leaf,
  Loader2,
  Languages,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { cn } from './lib/utils';
import { analyzePlantImage } from './services/gemini';
import { checkAndIncrementUsage } from './services/firebase';
import { DetectionResult, PlantAssessment } from './types/plant';

const i18n = {
  zh: {
    title: "植保识屏",
    subtitle: "识别植物种类，分析健康状况并获取专业建议",
    uploadBtn: "上传新照片",
    startBtn: "开始分析",
    analyzing: "正在分析...",
    analyzingDesc: "正在识别所有植物种类并评估健康状态",
    reset: "重置",
    summary: "分析摘要",
    detected: "检测结果",
    plantType: "植物种类",
    score: "健康评分",
    diagnosis: "健康诊断",
    care: "养护建议",
    globalSummary: "全局摘要",
    water: "水分",
    light: "光照",
    temp: "温度",
    recKey: "重点建议",
    recSupp: "补充建议",
    symptoms: "检测到症状",
    multiplePlants: "检测到多株植物",
    prev: "上一个",
    next: "下一个",
    healthScoreLabel: "健康评分",
    healthCore: "健康核心",
    expertRecs: "专家建议",
    noPlant: "请上传一张植物的照片",
    limitReached: "今日超过访问次数，请明日再查询"
  },
  en: {
    title: "PlantCare AI",
    subtitle: "Identify plant species, analyze health, and get expert advice.",
    uploadBtn: "Upload New Photo",
    startBtn: "Start Analysis",
    analyzing: "Analyzing...",
    analyzingDesc: "Identifying all plant species and assessing health status",
    reset: "Reset",
    summary: "Analysis Summary",
    detected: "Detection Result",
    plantType: "Plant Species",
    score: "Health Score",
    diagnosis: "Health Diagnosis",
    care: "Care Advice",
    globalSummary: "Global Summary",
    water: "Water",
    light: "Light",
    temp: "Temp",
    recKey: "Key Advice",
    recSupp: "Supp. Advice",
    symptoms: "Symptoms Detected",
    multiplePlants: "Multiple plants detected",
    prev: "Prev",
    next: "Next",
    healthScoreLabel: "Health Score",
    healthCore: "Health Core",
    expertRecs: "Expert Recommendations",
    noPlant: "Please upload a photo of a plant",
    limitReached: "Daily limit reached, please try again tomorrow"
  }
};

export default function App() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlantIdx, setSelectedPlantIdx] = useState(0);

  const t = i18n[lang];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  const handleAnalyze = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const usage = await checkAndIncrementUsage();
      if (!usage.allowed) {
        setError(t.limitReached);
        return;
      }

      const analysisResult = await analyzePlantImage(image, "image/jpeg", lang);
      
      if (!analysisResult.plants || analysisResult.plants.length === 0) {
        setError(t.noPlant);
        return;
      }

      setResult(analysisResult);
      setSelectedPlantIdx(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-brand-accent selection:text-white">
      {/* Header */}
      <nav className="h-20 px-4 md:px-10 flex items-center justify-between bg-white border-b border-brand-border">
        <div className="flex items-center gap-2 text-xl md:text-2xl font-extrabold text-brand-accent">
          <span className="bg-brand-accent text-white px-2.5 py-1 rounded-lg text-lg leading-none flex items-center justify-center">🌿</span>
          {t.title}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="p-2.5 rounded-xl border border-brand-border text-brand-muted hover:bg-brand-bg transition-colors flex items-center gap-2"
            title="Switch Language"
          >
            <Languages size={18} />
            <span className="text-xs font-bold uppercase hidden md:inline">{lang === 'zh' ? 'English' : '中文'}</span>
          </button>
          {(image || result) && (
            <button 
              onClick={reset}
              className="bg-brand-accent text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center gap-2"
            >
              <RotateCcw size={16} md:size={18} />
              <span className="hidden md:inline">{t.uploadBtn}</span>
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8 min-h-[calc(100vh-80px)]">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="uploader"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl mx-auto py-10 md:py-20 px-4"
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-black text-brand-dark mb-4">{t.title}</h1>
                <p className="text-brand-muted text-base md:text-lg">{t.subtitle}</p>
              </div>

              {!image ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "relative aspect-video rounded-[32px] border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 md:p-12 text-center group cursor-pointer",
                    isDragActive ? "border-brand-accent bg-brand-accent/5" : "border-brand-border bg-white hover:border-brand-accent"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="w-12 h-12 md:w-16 md:h-16 mb-4 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-muted group-hover:scale-110 transition-transform">
                    <Upload size={24} md:size={32} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">{lang === 'zh' ? '点击或拖拽照片' : 'Click or drag photo'}</h3>
                  <p className="text-brand-muted text-xs md:text-sm">{lang === 'zh' ? '支持 JPG, PNG 格式' : 'Support JPG, PNG formats'}</p>
                </div>
              ) : (
                <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-xl border border-brand-border">
                  <img src={image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {isAnalyzing ? (
                    <div className="absolute inset-0 bg-brand-accent/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 md:p-8">
                      <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin mb-4" />
                      <h3 className="text-xl md:text-2xl font-bold mb-2">{t.analyzing}</h3>
                      <p className="text-white/80 text-sm animate-pulse">{t.analyzingDesc}</p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity">
                      <button onClick={handleAnalyze} className="bg-brand-accent text-white px-6 md:px-8 py-2 md:py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                        <Camera size={20} />
                        {t.startBtn}
                      </button>
                      <button {...getRootProps()} className="bg-white text-brand-accent p-3 rounded-2xl shadow-lg hover:scale-105 transition-transform">
                        <input {...getInputProps()} />
                        <Upload size={20} />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-medium">
                  <AlertCircle size={20} /> {error}
                </div>
              )}
            </motion.div>
          ) : (
            <div key="results" className="space-y-6">
              {result.plants.length > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-brand-border shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
                      <Leaf size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{t.multiplePlants}</h3>
                      <p className="text-xs text-brand-muted">{selectedPlantIdx + 1} / {result.plants.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedPlantIdx(prev => Math.max(0, prev - 1))}
                      disabled={selectedPlantIdx === 0}
                      className="p-2 rounded-xl bg-brand-bg text-brand-accent disabled:opacity-30 hover:bg-brand-accent hover:text-white transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-1.5 px-2">
                      {result.plants.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedPlantIdx(i)}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all",
                            selectedPlantIdx === i ? "bg-brand-accent w-6" : "bg-brand-border"
                          )}
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => setSelectedPlantIdx(prev => Math.min(result.plants.length - 1, prev + 1))}
                      disabled={selectedPlantIdx === result.plants.length - 1}
                      className="p-2 rounded-xl bg-brand-bg text-brand-accent disabled:opacity-30 hover:bg-brand-accent hover:text-white transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
              <div className="md:col-span-4 md:row-span-3 grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-5">
                <BentoResults result={result} image={image!} selectedIdx={selectedPlantIdx} t={t} />
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-brand-border py-12 text-center md:text-left">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
          <div className="flex items-center gap-2">
            <Leaf size={20} className="text-brand-accent" />
            <span className="font-bold">PlantCare AI</span>
          </div>
          <p className="text-sm italic">Powered by Gemini 3.0 • Sustainable Plant Care</p>
        </div>
      </footer>
    </div>
  );
}

function BentoResults({ result, image, selectedIdx, t }: { result: DetectionResult; image: string, selectedIdx: number, t: any }) {
  const plant = result.plants[selectedIdx];
  if (!plant) return null;

  return (
    <>
      {/* Hero Image Card */}
      <motion.div 
        key={`hero-${selectedIdx}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[24px] border border-brand-border p-0 overflow-hidden relative shadow-sm md:col-span-2 md:row-span-2"
      >
        <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full font-bold text-sm z-10 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-brand-accent" />
          {t.detected}：{plant.name}
        </div>
        <img src={image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </motion.div>

      {/* Name Card */}
      <motion.div 
        key={`name-${selectedIdx}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[24px] border border-brand-border p-6 flex flex-col justify-center shadow-sm md:col-span-1 md:row-span-1"
      >
        <div className="text-[12px] uppercase tracking-widest text-brand-muted mb-2 font-bold">{t.plantType}</div>
        <div className="text-3xl font-black leading-tight text-brand-dark">{plant.name}</div>
        {plant.scientificName && (
          <div className="text-sm italic text-brand-muted mt-2 font-medium">{plant.scientificName}</div>
        )}
      </motion.div>

      {/* Score Card */}
      <motion.div 
        key={`score-${selectedIdx}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[24px] border border-brand-border p-6 flex flex-col items-center justify-center text-center shadow-sm md:col-span-1 md:row-span-1"
      >
        <div className="text-[12px] uppercase tracking-widest text-brand-muted mb-3 font-bold">{t.score}</div>
        <div className="w-24 h-24 rounded-full border-[6px] border-brand-bg border-t-brand-score flex items-center justify-center text-3xl font-black text-brand-score mb-4 shadow-inner">
          {plant.healthScore}
        </div>
        <div className="text-brand-score font-black uppercase text-sm">{plant.healthStatus}</div>
      </motion.div>

      {/* Analysis Card */}
      <motion.div 
        key={`analysis-${selectedIdx}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-[24px] border border-brand-border p-6 shadow-sm md:col-span-2 md:row-span-1 flex flex-col"
      >
        <div className="text-[12px] uppercase tracking-widest text-brand-muted mb-3 font-bold">{t.diagnosis}</div>
        <p className="text-sm leading-relaxed mb-6 text-brand-dark/80 font-medium">{plant.summary}</p>
        <div className="mt-auto grid grid-cols-3 gap-4">
          {Object.entries(plant.careTips).slice(0, 3).map(([key, value]) => (
            <div key={key} className="border-l-4 border-brand-accent pl-3">
              <h4 className="text-[10px] font-black text-brand-muted uppercase tracking-wider mb-1">
                {key === 'watering' ? t.water : key === 'light' ? t.light : t.temp}
              </h4>
              <p className="text-xs font-bold text-brand-dark truncate">{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Care Advice Card */}
      <motion.div 
        key={`care-${selectedIdx}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[24px] border border-brand-border p-6 shadow-sm md:col-span-2 md:row-span-1 flex flex-col"
      >
        <div className="text-[12px] uppercase tracking-widest text-brand-muted mb-3 font-bold">{t.care}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {plant.recommendations.slice(0, 2).map((rec, i) => (
            <div key={i} className="bg-brand-bg p-3 rounded-xl text-xs font-bold leading-relaxed border border-brand-border/50">
              <strong className="block text-brand-accent mb-1 text-[10px] uppercase tracking-tight">{i === 0 ? t.recKey : t.recSupp}</strong>
              {rec}
            </div>
          ))}
        </div>
        {plant.symptoms && plant.symptoms.length > 0 && (
          <div className="mt-auto flex gap-2 overflow-hidden scrollbar-hide">
            {plant.symptoms.map((s, i) => (
              <span key={i} className="whitespace-nowrap px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100 uppercase">
                {s}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Extra Card (Summary/Overall) */}
      <motion.div 
        key={`global-${selectedIdx}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-[24px] border border-brand-border p-6 shadow-sm md:col-span-2 md:row-span-1 flex items-center gap-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-accent shrink-0 shadow-sm">
          <Activity size={32} />
        </div>
        <div>
          <div className="text-[12px] uppercase tracking-widest text-brand-muted mb-1 font-bold">{t.globalSummary}</div>
          <p className="text-sm text-brand-muted line-clamp-2 font-medium italic">{result.overallSummary}</p>
        </div>
      </motion.div>
    </>
  );
}
