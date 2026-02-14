import React, { useState, useRef, useEffect } from 'react';
import { Camera } from './components/Camera';
import { Button } from './components/Button';
import { generateFlooringVisualization } from './services/geminiService';
import { AppState, EPOXY_STYLES, EpoxyStyle } from './types';
import { 
  Camera as CameraIcon, 
  Sparkles, 
  ArrowLeft, 
  Download, 
  Layers,
  Wand2,
  AlertCircle,
  Upload,
  Ruler,
  Grid3X3,
  User,
  Phone,
  Mail,
  FileCheck,
  MessageSquare,
  HardHat,
  Home,
  Calculator,
  DollarSign
} from 'lucide-react';

interface LeadData {
  name: string;
  phone: string;
  email: string;
}

interface QuoteData {
  sqFt: string;
  pricePerSqFt: string;
}

type UserMode = 'CUSTOMER' | 'CONTRACTOR';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [userMode, setUserMode] = useState<UserMode>('CUSTOMER');
  const [isMobile, setIsMobile] = useState(false);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [finalQuoteImage, setFinalQuoteImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<EpoxyStyle | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Forms State
  const [showForm, setShowForm] = useState(false);
  const [leadData, setLeadData] = useState<LeadData>({ name: '', phone: '', email: '' });
  const [quoteData, setQuoteData] = useState<QuoteData>({ sqFt: '', pricePerSqFt: '6.50' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect Mobile/Tablet
  useEffect(() => {
    const checkMobile = () => {
      // Check for touch capability or small screen width as proxies for mobile/tablet devices
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobile(isTouch || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setAppState(AppState.PREVIEW);
    setProcessedImage(null);
    setFinalQuoteImage(null);
    setSelectedStyle(null);
    setShowForm(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleCapture(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleStyleSelect = (style: EpoxyStyle) => {
    setSelectedStyle(style);
    setCustomPrompt(''); 
  };

  const generatePreview = async () => {
    if (!capturedImage) return;

    let finalPrompt = "";
    if (customPrompt.trim().length > 0) {
      finalPrompt = customPrompt;
    } else if (selectedStyle) {
      finalPrompt = selectedStyle.promptDescription;
    } else {
      setErrorMsg("Please select a palette or enter a custom description.");
      return;
    }

    try {
      setAppState(AppState.PROCESSING);
      setErrorMsg(null);
      const resultImage = await generateFlooringVisualization(capturedImage, finalPrompt);
      setProcessedImage(resultImage);
      setAppState(AppState.RESULT);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate image. Please try again or use a different angle.");
      setAppState(AppState.PREVIEW);
    }
  };

  // --- Image Composition Logic ---
  const generateBlueprintOverlay = async () => {
    if (!processedImage) return;

    const img = new Image();
    img.src = processedImage;
    await new Promise((resolve) => { img.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas setup: Image height + Footer height
    const footerHeight = 220; 
    canvas.width = img.width;
    canvas.height = img.height + footerHeight;

    // 1. Draw Original Image
    ctx.drawImage(img, 0, 0);

    // 2. Draw Blueprint Footer Background (Navy)
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, img.height, canvas.width, footerHeight);

    // 3. Draw Top Border for Footer (Orange)
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, img.height, canvas.width, 4);

    // 4. Draw Content based on Mode
    const startY = img.height + 50;
    const marginLeft = 40;
    
    // Header Label
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#ea580c'; // Orange Label
    
    if (userMode === 'CONTRACTOR') {
        ctx.fillText('OFFICIAL ESTIMATE:', marginLeft, startY);
    } else {
        ctx.fillText('PROJECT SPECIFICATION:', marginLeft, startY);
    }

    ctx.font = '20px monospace';
    ctx.fillStyle = '#94a3b8'; // Slate Text
    
    // Column 1: Variable Info
    let currentY = startY + 40;

    if (userMode === 'CONTRACTOR') {
        // Contractor Data
        const sqFt = parseFloat(quoteData.sqFt) || 0;
        const rate = parseFloat(quoteData.pricePerSqFt) || 0;
        const total = sqFt * rate;

        ctx.fillText(`CLIENT:   ${leadData.name.toUpperCase() || 'VALUED CUSTOMER'}`, marginLeft, currentY);
        ctx.fillText(`AREA:     ${quoteData.sqFt} SQ FT`, marginLeft, currentY + 30);
        ctx.fillText(`RATE:     $${quoteData.pricePerSqFt}/SF`, marginLeft, currentY + 60);
        
        // Total Highlight
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`TOTAL:    $${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, marginLeft, currentY + 100);
    } else {
        // Customer Data
        ctx.fillText(`CLIENT: ${leadData.name.toUpperCase()}`, marginLeft, currentY);
        ctx.fillText(`PHONE:  ${leadData.phone}`, marginLeft, currentY + 30);
        ctx.fillText(`EMAIL:  ${leadData.email}`, marginLeft, currentY + 60);
        
        ctx.fillStyle = '#ea580c';
        ctx.font = 'italic 16px monospace';
        ctx.fillText('>> QUOTE REQUEST PENDING', marginLeft, currentY + 100);
    }

    // Column 2: Brand Info (Right Aligned)
    const rightX = canvas.width - 40;
    ctx.textAlign = 'right';
    
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('CAREFREE STONE', rightX, startY + 10);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('CONCRETE COATINGS', rightX, startY + 35);
    ctx.fillText('(602) 867-0867', rightX, startY + 60);
    
    ctx.fillStyle = '#475569';
    ctx.font = '14px monospace';
    const dateStr = new Date().toLocaleDateString();
    ctx.fillText(`DATE: ${dateStr}`, rightX, startY + 120);
    ctx.fillText(`REF: ${Date.now().toString().slice(-6)}`, rightX, startY + 140);

    setFinalQuoteImage(canvas.toDataURL('image/jpeg', 0.9));
    setShowForm(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userMode === 'CUSTOMER') {
        if (leadData.name && leadData.phone) {
            generateBlueprintOverlay();
        } else {
            alert("Please enter your name and phone number.");
        }
    } else {
        // Contractor Mode
        if (quoteData.sqFt) {
            generateBlueprintOverlay();
        } else {
            alert("Please enter the square footage.");
        }
    }
  };

  const reset = () => {
    setAppState(AppState.IDLE);
    setCapturedImage(null);
    setProcessedImage(null);
    setFinalQuoteImage(null);
    setSelectedStyle(null);
    setCustomPrompt('');
    setErrorMsg(null);
    setShowForm(false);
    // Keep userMode as is
  };

  // --- Render Helpers ---

  const renderIdle = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center relative overflow-hidden">
      
      {/* Blueprint Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="w-full h-full border-[20px] border-slate-800/50"></div>
         <div className="absolute top-10 left-10 w-4 h-4 border-t-2 border-l-2 border-orange-500"></div>
         <div className="absolute top-10 right-10 w-4 h-4 border-t-2 border-r-2 border-orange-500"></div>
         <div className="absolute bottom-10 left-10 w-4 h-4 border-b-2 border-l-2 border-orange-500"></div>
         <div className="absolute bottom-10 right-10 w-4 h-4 border-b-2 border-r-2 border-orange-500"></div>
      </div>

      <div className="w-24 h-24 bg-[#0F172A] border-2 border-orange-500/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,88,12,0.15)] relative">
        <div className="absolute inset-0 bg-orange-500/5 rotate-45 transform scale-75"></div>
        <Layers className="text-orange-500 w-12 h-12" strokeWidth={1.5} />
        {/* Corner markers on logo */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-orange-500"></div>
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-orange-500"></div>
      </div>
      
      <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-blue-900/30 border border-blue-500/30 text-blue-300 text-[10px] tracking-[0.2em] font-mono uppercase">
        <Ruler size={10} />
        Architectural Visualization
      </div>

      <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-white tracking-tight">
        <span className="text-orange-500">Carefree</span> Stone
      </h1>
      <p className="text-slate-400 text-sm tracking-widest uppercase mb-8 max-w-sm border-t border-slate-700 pt-4 mt-2">
        Project: Epoxy Vision
      </p>

      {/* Mode Switcher */}
      <div className="flex bg-[#1e293b] p-1 border border-slate-700 mb-8 relative z-10">
        <button
            onClick={() => setUserMode('CUSTOMER')}
            className={`flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${userMode === 'CUSTOMER' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
            <Home size={14} /> Homeowner
        </button>
        <button
            onClick={() => setUserMode('CONTRACTOR')}
            className={`flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${userMode === 'CONTRACTOR' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
            <HardHat size={14} /> Contractor
        </button>
      </div>
      
      <div className="w-full max-w-xs space-y-4 relative z-10">
        {/* Only show Camera button if on Mobile/Tablet */}
        {isMobile && (
          <Button 
            onClick={() => setAppState(AppState.CAMERA)} 
            fullWidth 
            icon={<CameraIcon size={18} />}
          >
            {userMode === 'CUSTOMER' ? 'Take Photo' : 'Take Site Photo'}
          </Button>
        )}

        <Button 
          variant={isMobile ? "secondary" : "primary"}
          onClick={triggerFileUpload} 
          fullWidth 
          icon={<Upload size={18} />}
        >
          {isMobile ? 'Load Image' : 'Upload Garage Photo'}
        </Button>
      </div>
      
      <div className="mt-16 text-center opacity-40">
        <Grid3X3 className="mx-auto mb-2 text-slate-500" size={24} strokeWidth={1} />
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          System Ready • v2.6.0
        </p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );

  const renderCamera = () => (
    <Camera 
      onCapture={handleCapture} 
      onCancel={() => setAppState(AppState.IDLE)}
      onUpload={triggerFileUpload} 
    />
  );

  const renderPreview = () => (
    <div className="flex flex-col h-screen bg-[#0B1120]">
      {/* Header */}
      <div className="h-16 flex-none flex items-center bg-[#0F172A] border-b border-slate-700 px-4 justify-between">
        <div className="flex items-center">
          <button onClick={reset} className="p-2 -ml-2 text-slate-400 hover:text-orange-500 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <div className="ml-2">
            <h2 className="text-xs text-orange-500 font-mono tracking-widest uppercase">Step 01</h2>
            <h3 className="font-bold text-sm tracking-wide text-white">Specify Material</h3>
          </div>
        </div>
        <div className="flex flex-col items-end">
             <div className="text-[10px] font-mono text-slate-500 hidden sm:block">
                ID: {Date.now().toString().slice(-6)}
             </div>
             <div className="text-[10px] font-mono text-orange-500 uppercase tracking-wider">
                Mode: {userMode}
             </div>
        </div>
      </div>

      {/* Image Preview */}
      <div className="flex-1 min-h-0 relative bg-[#050912] overflow-hidden flex items-center justify-center border-b border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
        {capturedImage && (
          <div className="relative max-w-[95%] max-h-[95%] border border-slate-700 p-1 bg-[#0B1120] shadow-2xl flex items-center justify-center">
            <img 
              src={capturedImage} 
              alt="Original" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-none bg-[#0F172A] p-6 border-t border-orange-500/20 shadow-2xl z-10">
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between mb-3">
               <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest font-mono">
                 Select Texture
               </label>
               <span className="text-[10px] text-slate-500 font-mono">LIB-V1</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {EPOXY_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleSelect(style)}
                  className={`
                    relative group flex flex-col items-center gap-2 p-1.5 border transition-all duration-200
                    ${selectedStyle?.id === style.id 
                      ? 'bg-slate-800 border-orange-500 ring-1 ring-orange-500' 
                      : 'bg-[#1e293b] border-slate-700 hover:border-slate-500'}
                  `}
                >
                  <div 
                    className="w-full aspect-square shadow-inner border border-black/20" 
                    style={{ background: style.cssBackground }}
                  />
                  {selectedStyle?.id === style.id && (
                    <div className="absolute top-0 right-0 p-0.5 bg-orange-500 text-black">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                  <span className={`text-[9px] font-mono uppercase tracking-tighter ${selectedStyle?.id === style.id ? 'text-orange-400' : 'text-slate-400'}`}>
                    {style.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <details className="group">
              <summary className="list-none cursor-pointer flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 hover:text-orange-400 transition-colors font-mono">
                <Wand2 size={12} />
                <span>Manual Override Spec</span>
                <div className="h-[1px] flex-1 bg-slate-800 ml-2 group-open:bg-orange-900"></div>
              </summary>
              <input 
                type="text" 
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  if (e.target.value.length > 0) setSelectedStyle(null);
                }}
                placeholder='SPECIFY CUSTOM TEXTURE...'
                className="w-full bg-[#050912] border border-slate-700 text-orange-100 rounded-none px-4 py-3 text-xs font-mono focus:outline-none focus:border-orange-500 placeholder-slate-600 uppercase"
              />
            </details>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-900/20 border-l-2 border-red-500 flex items-center gap-2 text-red-200 text-xs font-mono">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}

          <Button 
            onClick={generatePreview}
            disabled={!selectedStyle && customPrompt.trim().length === 0}
            icon={<Sparkles size={16} />}
          >
            Generate Render
          </Button>
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B1120] p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 animate-pulse"></div>
      <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-slate-800 rounded-full"></div>
        <div className="absolute inset-2 border-t-2 border-orange-500 rounded-full animate-spin"></div>
        <div className="absolute inset-6 border-b-2 border-orange-300 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
        <Sparkles className="text-orange-500 animate-pulse" size={24} />
      </div>
      <div className="font-mono space-y-2">
        <h3 className="text-xl font-bold text-white uppercase tracking-widest">Processing</h3>
        <p className="text-orange-500 text-xs uppercase tracking-widest">
          Analysing Geometry <span className="animate-pulse">...</span>
        </p>
      </div>
    </div>
  );

  const renderFormOverlay = () => {
    return (
        <div className="flex flex-col h-screen bg-[#0B1120]">
           <div className="h-16 flex-none flex items-center bg-[#0F172A] border-b border-slate-700 px-4">
             <button onClick={() => setShowForm(false)} className="p-2 -ml-2 text-slate-400">
               <ArrowLeft size={24} />
             </button>
             <h2 className="ml-2 font-mono text-orange-500 text-xs uppercase tracking-widest">
                {userMode === 'CONTRACTOR' ? 'Project Data' : 'Contact Data'}
             </h2>
           </div>
           
           <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>
             
             <div className="w-full max-w-md bg-[#0F172A] border border-orange-500/30 p-8 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500"></div>

                <div className="mb-6 text-center">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">
                      {userMode === 'CONTRACTOR' ? 'Estimate Details' : 'Request Quote'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                      {userMode === 'CONTRACTOR' 
                        ? 'Enter project specs to generate official estimate card.' 
                        : 'Enter details to personalize your design card.'}
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                   {userMode === 'CONTRACTOR' ? (
                       // CONTRACTOR FORM
                       <>
                           <div className="space-y-1">
                                <label className="text-[10px] font-mono text-orange-500 uppercase">Client Name (Optional)</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        value={leadData.name}
                                        onChange={(e) => setLeadData({...leadData, name: e.target.value})}
                                        className="w-full bg-[#050912] border border-slate-700 text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
                                        placeholder="Client Name / Address"
                                    />
                                </div>
                            </div>
                           <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-orange-500 uppercase">Total Sq Ft</label>
                                    <div className="relative">
                                        <Calculator className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                                        <input 
                                            required
                                            type="number" 
                                            value={quoteData.sqFt}
                                            onChange={(e) => setQuoteData({...quoteData, sqFt: e.target.value})}
                                            className="w-full bg-[#050912] border border-slate-700 text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
                                            placeholder="400"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-orange-500 uppercase">Price / Sq Ft</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                                        <input 
                                            required
                                            type="number"
                                            step="0.01"
                                            value={quoteData.pricePerSqFt}
                                            onChange={(e) => setQuoteData({...quoteData, pricePerSqFt: e.target.value})}
                                            className="w-full bg-[#050912] border border-slate-700 text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
                                            placeholder="6.50"
                                        />
                                    </div>
                                </div>
                           </div>
                           
                           {/* Live Total Calculation */}
                           <div className="p-4 bg-slate-800/50 border border-slate-700 text-center">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Estimated Total</span>
                                <span className="text-2xl font-bold text-white">
                                    ${((parseFloat(quoteData.sqFt) || 0) * (parseFloat(quoteData.pricePerSqFt) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                           </div>
                       </>
                   ) : (
                       // CUSTOMER FORM
                       <>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-orange-500 uppercase">Your Name</label>
                            <div className="relative">
                            <User className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                            <input 
                                required
                                type="text" 
                                value={leadData.name}
                                onChange={(e) => setLeadData({...leadData, name: e.target.value})}
                                className="w-full bg-[#050912] border border-slate-700 text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
                                placeholder="John Doe"
                            />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-orange-500 uppercase">Phone Contact</label>
                            <div className="relative">
                            <Phone className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                            <input 
                                required
                                type="tel" 
                                value={leadData.phone}
                                onChange={(e) => setLeadData({...leadData, phone: e.target.value})}
                                className="w-full bg-[#050912] border border-slate-700 text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
                                placeholder="(555) 123-4567"
                            />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-orange-500 uppercase">Email Address (Optional)</label>
                            <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                            <input 
                                type="email" 
                                value={leadData.email}
                                onChange={(e) => setLeadData({...leadData, email: e.target.value})}
                                className="w-full bg-[#050912] border border-slate-700 text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none"
                                placeholder="john@example.com"
                            />
                            </div>
                        </div>
                       </>
                   )}

                   <Button type="submit" fullWidth icon={<FileCheck size={18} />}>
                     {userMode === 'CONTRACTOR' ? 'Generate Official Quote' : 'Create Project Card'}
                   </Button>
                </form>
             </div>
           </div>
        </div>
      );
  }

  const renderResult = () => {
    if (showForm) {
      return renderFormOverlay();
    }

    // Main Result View
    return (
      <div className="flex flex-col h-screen bg-[#0B1120]">
        <div className="h-16 flex-none flex items-center justify-between bg-[#0F172A] border-b border-slate-700 px-4">
          <button onClick={() => setAppState(AppState.PREVIEW)} className="p-2 -ml-2 text-slate-400 hover:text-orange-500 transition-colors">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <div className="text-center">
            <h2 className="text-xs text-orange-500 font-mono tracking-widest uppercase">Step 02</h2>
            <h2 className="font-bold text-sm tracking-wide text-white">Render Complete</h2>
          </div>
          <div className="w-8"></div>
        </div>

        <div className="flex-1 min-h-0 relative bg-[#050912] flex items-center justify-center overflow-hidden p-4">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none"></div>

          {processedImage ? (
             <div className="relative max-w-full max-h-full border border-slate-700 bg-[#0B1120] shadow-2xl flex flex-col justify-center">
               <img 
                 src={finalQuoteImage || processedImage} 
                 alt="Processed" 
                 className="max-w-full max-h-full object-contain"
               />
               {!finalQuoteImage && (
                 <div className="absolute bottom-4 right-4 bg-[#0F172A]/90 text-orange-500 text-[10px] px-3 py-1 border border-orange-500/30 font-mono uppercase tracking-widest">
                   Preview Mode
                 </div>
               )}
             </div>
          ) : (
            <div className="text-red-500 font-mono">ERR: Image Stream Lost</div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex-none p-6 bg-[#0F172A] border-t border-slate-700">
          {!finalQuoteImage ? (
            <div className="space-y-3">
              <Button 
                onClick={() => setShowForm(true)} 
                fullWidth 
                icon={userMode === 'CONTRACTOR' ? <Calculator size={18} /> : <FileCheck size={18} />}
                className="animate-pulse shadow-[0_0_15px_rgba(234,88,12,0.3)]"
              >
                {userMode === 'CONTRACTOR' ? 'Calculate & Finalize Estimate' : 'Request Quote'}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                 <Button variant="secondary" onClick={() => setAppState(AppState.PREVIEW)}>Try Again</Button>
                 <Button variant="secondary" onClick={reset}>New Photo</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = finalQuoteImage;
                    link.download = `carefree-stone-${userMode.toLowerCase()}-${Date.now()}.jpg`;
                    link.click();
                  }}
                  icon={<Download size={16} />}
                >
                  Save Image
                </Button>

                <Button 
                  onClick={() => {
                     // SMS Link
                     if (userMode === 'CUSTOMER') {
                         const body = `Hi Carefree Stone, I'm ${leadData.name}. I'd like a quote for this epoxy floor design. (My Ref: ${Date.now().toString().slice(-6)})`;
                         window.location.href = `sms:16028670867?body=${encodeURIComponent(body)}`;
                     } else {
                        // Contractor share
                         if (navigator.share) {
                             fetch(finalQuoteImage).then(res => res.blob()).then(blob => {
                                 const file = new File([blob], "estimate.jpg", { type: "image/jpeg" });
                                 navigator.share({
                                     title: 'Carefree Stone Estimate',
                                     text: `Estimate for ${leadData.name || 'Client'}`,
                                     files: [file]
                                 }).catch(console.error);
                             });
                         } else {
                             alert("Use 'Save Image' to download and share.");
                         }
                     }
                  }}
                  icon={<MessageSquare size={16} />}
                >
                  {userMode === 'CONTRACTOR' ? 'Share Estimate' : 'Text Business'}
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 text-center font-mono">
                 {userMode === 'CONTRACTOR' 
                    ? 'Official estimate generated. Save for records.'
                    : 'Tap "Text Business" to start your inquiry.'}
              </p>
              <Button variant="ghost" onClick={reset} className="w-full text-xs">Start Over</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-50 font-sans selection:bg-orange-500/30 selection:text-white bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]">
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
      {appState === AppState.IDLE && renderIdle()}
      {appState === AppState.CAMERA && renderCamera()}
      {appState === AppState.PREVIEW && renderPreview()}
      {appState === AppState.PROCESSING && renderProcessing()}
      {appState === AppState.RESULT && renderResult()}
    </div>
  );
};

export default App;