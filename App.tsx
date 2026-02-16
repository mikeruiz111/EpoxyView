import React, { useReducer, useRef } from 'react';
import { Button } from './components/Button';
import { Camera } from './components/Camera';
import { generateFlooringVisualization } from './services/geminiService';
import { AppState, EpoxyStyle, LeadData, QuoteData, FormErrors, UserMode } from './types';
import { EPOXY_STYLES } from './epoxy-styles';
import { 
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
  DollarSign,
  RefreshCw,
  X,
  Camera as CameraIcon
} from 'lucide-react';

// Reducer logic
interface AppStateObject {
    appState: AppState;
    userMode: UserMode;
    capturedImage: string | null;
    processedImage: string | null;
    finalQuoteImage: string | null;
    selectedStyle: EpoxyStyle | null;
    customPrompt: string;
    errorMsg: string | null;
    showForm: boolean;
    leadData: LeadData;
    quoteData: QuoteData;
    formErrors: FormErrors;
}

type Action = 
    | { type: 'SET_APP_STATE', payload: AppState } 
    | { type: 'SET_USER_MODE', payload: UserMode }
    | { type: 'CAPTURE_IMAGE', payload: string }
    | { type: 'SET_PROCESSED_IMAGE', payload: string | null }
    | { type: 'SET_FINAL_QUOTE_IMAGE', payload: string | null }
    | { type: 'SET_STYLE', payload: EpoxyStyle | null }
    | { type: 'SET_CUSTOM_PROMPT', payload: string }
    | { type: 'SET_ERROR', payload: string | null }
    | { type: 'TOGGLE_FORM', payload: boolean }
    | { type: 'SET_LEAD_DATA', payload: Partial<LeadData> }
    | { type: 'SET_QUOTE_DATA', payload: Partial<QuoteData> }
    | { type: 'SET_FORM_ERRORS', payload: FormErrors }
    | { type: 'RESET' };

const initialState: AppStateObject = {
    appState: AppState.IDLE,
    userMode: 'CUSTOMER',
    capturedImage: null,
    processedImage: null,
    finalQuoteImage: null,
    selectedStyle: null,
    customPrompt: '',
    errorMsg: null,
    showForm: false,
    leadData: { name: '', phone: '', email: '' },
    quoteData: { sqFt: '', pricePerSqFt: '6.50' },
    formErrors: {},
};

function appReducer(state: AppStateObject, action: Action): AppStateObject {
    switch (action.type) {
        case 'SET_APP_STATE':
            return { ...state, appState: action.payload };
        case 'SET_USER_MODE':
            return { ...state, userMode: action.payload };
        case 'CAPTURE_IMAGE':
            return {
                ...state,
                appState: AppState.PREVIEW,
                capturedImage: action.payload,
                processedImage: null,
                finalQuoteImage: null,
                selectedStyle: null,
                showForm: false,
                formErrors: {},
            };
        case 'SET_PROCESSED_IMAGE':
            return { ...state, processedImage: action.payload, appState: AppState.RESULT };
        case 'SET_FINAL_QUOTE_IMAGE':
            return { ...state, finalQuoteImage: action.payload, showForm: false };
        case 'SET_STYLE':
            return { ...state, selectedStyle: action.payload, customPrompt: '', errorMsg: null };
        case 'SET_CUSTOM_PROMPT':
            return { ...state, customPrompt: action.payload, selectedStyle: action.payload.length > 0 ? null : state.selectedStyle };
        case 'SET_ERROR':
            return { ...state, errorMsg: action.payload, appState: AppState.PREVIEW };
        case 'TOGGLE_FORM':
            return { ...state, showForm: action.payload };
        case 'SET_LEAD_DATA':
            return { ...state, leadData: { ...state.leadData, ...action.payload } };
        case 'SET_QUOTE_DATA':
            return { ...state, quoteData: { ...state.quoteData, ...action.payload } };
        case 'SET_FORM_ERRORS':
            return { ...state, formErrors: action.payload };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}


const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { 
      appState, userMode, capturedImage, processedImage, finalQuoteImage, 
      selectedStyle, customPrompt, errorMsg, showForm, leadData, quoteData, formErrors
  } = state;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        dispatch({ type: 'CAPTURE_IMAGE', payload: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const generatePreview = async () => {
    if (!capturedImage) return;

    const internalApiKey = import.meta.env.VITE_INTERNAL_API_KEY;
    if (!internalApiKey) {
      dispatch({ type: 'SET_ERROR', payload: "App configuration error. Please refresh." });
      console.error("VITE_INTERNAL_API_KEY not set");
      return;
    }

    let finalPrompt = "";
    if (customPrompt.trim().length > 0) {
      finalPrompt = customPrompt;
    } else if (selectedStyle) {
      finalPrompt = selectedStyle.promptDescription;
    } else {
      dispatch({ type: 'SET_ERROR', payload: "Please select a palette or enter a custom description." });
      return;
    }

    try {
      dispatch({ type: 'SET_APP_STATE', payload: AppState.PROCESSING });
      dispatch({ type: 'SET_ERROR', payload: null });
      const resultImage = await generateFlooringVisualization(capturedImage, finalPrompt, internalApiKey);
      dispatch({ type: 'SET_PROCESSED_IMAGE', payload: resultImage });
    } catch (err: any) {
      console.error(err);
      dispatch({ type: 'SET_ERROR', payload: err.message || "Failed to generate image. Please try again or use a different angle." });
    }
  };

  const generateBlueprintOverlay = async () => {
    if (!processedImage) return;

    try {
      const img = new Image();
      img.src = processedImage;
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Image load timeout')), 5000);
        img.onload = () => { clearTimeout(timeout); resolve(null); };
        img.onerror = () => { clearTimeout(timeout); reject(new Error('Image load failed')); };
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const footerHeight = 220; 
      canvas.width = img.width;
      canvas.height = img.height + footerHeight;

      ctx.drawImage(img, 0, 0);

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, img.height, canvas.width, footerHeight);

      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, img.height, canvas.width, 4);

      const startY = img.height + 50;
      const marginLeft = 40;
      
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#ea580c';
      
      if (userMode === 'CONTRACTOR') {
          ctx.fillText('OFFICIAL ESTIMATE:', marginLeft, startY);
      } else {
          ctx.fillText('PROJECT SPECIFICATION:', marginLeft, startY);
      }

      ctx.font = '20px monospace';
      ctx.fillStyle = '#94a3b8';
      
      let currentY = startY + 40;

      if (userMode === 'CONTRACTOR') {
          const sqFt = parseFloat(quoteData.sqFt) || 0;
          const rate = parseFloat(quoteData.pricePerSqFt) || 0;
          const total = sqFt * rate;

          ctx.fillText(`CLIENT:   ${leadData.name.toUpperCase() || 'VALUED CUSTOMER'}`, marginLeft, currentY);
          ctx.fillText(`AREA:     ${quoteData.sqFt} SQ FT`, marginLeft, currentY + 30);
          ctx.fillText(`RATE:     $${quoteData.pricePerSqFt}/SF`, marginLeft, currentY + 60);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px monospace';
          ctx.fillText(`TOTAL:    $${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, marginLeft, currentY + 100);
      } else {
          ctx.fillText(`CLIENT: ${leadData.name.toUpperCase()}`, marginLeft, currentY);
          ctx.fillText(`PHONE:  ${leadData.phone}`, marginLeft, currentY + 30);
          ctx.fillText(`EMAIL:  ${leadData.email}`, marginLeft, currentY + 60);
          
          ctx.fillStyle = '#ea580c';
          ctx.font = 'italic 16px monospace';
          ctx.fillText('>> QUOTE REQUEST PENDING', marginLeft, currentY + 100);
      }

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

      dispatch({ type: 'SET_FINAL_QUOTE_IMAGE', payload: canvas.toDataURL('image/jpeg', 0.9) });
    } catch (err) {
      console.error("Failed to generate blueprint overlay:", err);
      dispatch({ type: 'SET_ERROR', payload: "Failed to load the generated image for final processing. Please try again." });
    }
  };

  const validateForm = (): FormErrors => {
      const errors: FormErrors = {};
      if (userMode === 'CUSTOMER') {
          if (leadData.name.trim().length < 2) {
              errors.name = "Name must be at least 2 characters.";
          }
          const phoneRegex = /^\(?(\d{3})\)?[-. ]?(\d{3})[-. ]?(\d{4})$/;
          if (!phoneRegex.test(leadData.phone)) {
              errors.phone = "Please enter a valid 10-digit phone number.";
          }
          const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
          if (leadData.email && !emailRegex.test(leadData.email)) {
              errors.email = "Please enter a valid email address.";
          }
      } else {
          const sqFtNum = parseFloat(quoteData.sqFt);
          if (isNaN(sqFtNum) || sqFtNum <= 0) {
              errors.sqFt = "Must be a positive number.";
          }
          const priceNum = parseFloat(quoteData.pricePerSqFt);
          if (isNaN(priceNum) || priceNum < 0) {
              errors.pricePerSqFt = "Must be a non-negative number.";
          }
      }
      return errors;
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
        dispatch({ type: 'SET_FORM_ERRORS', payload: validationErrors });
    } else {
        dispatch({ type: 'SET_FORM_ERRORS', payload: {} });
        generateBlueprintOverlay();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target as { name: keyof (LeadData & QuoteData), value: string };
      
      if (formErrors[name]) {
          dispatch({ type: 'SET_FORM_ERRORS', payload: { ...formErrors, [name]: undefined } });
      }

      if (name in leadData) {
          dispatch({ type: 'SET_LEAD_DATA', payload: { [name]: value } });
      } else if (name in quoteData) {
          dispatch({ type: 'SET_QUOTE_DATA', payload: { [name]: value } });
      }
  }

  const renderIdle = () => (
    <div className="flex flex-col h-full px-6 py-6 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="w-full h-full border-[20px] border-slate-800/50"></div>
         <div className="absolute top-10 left-10 w-4 h-4 border-t-2 border-l-2 border-orange-500"></div>
         <div className="absolute top-10 right-10 w-4 h-4 border-t-2 border-r-2 border-orange-500"></div>
         <div className="absolute bottom-10 left-10 w-4 h-4 border-b-2 border-l-2 border-orange-500"></div>
         <div className="absolute bottom-10 right-10 w-4 h-4 border-b-2 border-r-2 border-orange-500"></div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-[#0F172A] border-2 border-orange-500/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,88,12,0.15)] relative">
            <div className="absolute inset-0 bg-orange-500/5 rotate-45 transform scale-75"></div>
            <Layers className="text-orange-500 w-12 h-12" strokeWidth={1.5} />
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
      </div>
      <div className="flex-none flex flex-col items-center w-full z-10 pb-4">
        <div className="flex bg-[#1e293b] p-1 border border-slate-700 mb-6">
            <button
                onClick={() => dispatch({ type: 'SET_USER_MODE', payload: 'CUSTOMER' })}
                className={`flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${userMode === 'CUSTOMER' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Home size={14} /> Homeowner
            </button>
            <button
                onClick={() => dispatch({ type: 'SET_USER_MODE', payload: 'CONTRACTOR' })}
                className={`flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all ${userMode === 'CONTRACTOR' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <HardHat size={14} /> Contractor
            </button>
        </div>
        <div className="w-full max-w-xs space-y-3">
            <Button 
                variant="primary"
                onClick={() => dispatch({ type: 'SET_APP_STATE', payload: AppState.CAPTURE })}
                fullWidth 
                icon={<CameraIcon size={18} />}
            >
                Take Photo
            </Button>
            <Button 
                variant="secondary"
                onClick={triggerFileUpload} 
                fullWidth 
                icon={<Upload size={18} />}
            >
                Upload Photo
            </Button>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest text-center border-t border-slate-800 pt-2">
                For best results, use a <span className="text-orange-500">Landscape</span> photo.
            </p>
        </div>
        <div className="mt-6 text-center opacity-40">
            <Grid3X3 className="mx-auto mb-2 text-slate-500" size={20} strokeWidth={1} />
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            System Ready • v2.6.2
            </p>
        </div>
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

  const renderCapture = () => (
    <Camera 
        onCapture={(image) => dispatch({ type: 'CAPTURE_IMAGE', payload: image })}
        onCancel={() => dispatch({ type: 'SET_APP_STATE', payload: AppState.IDLE })}
        onUpload={triggerFileUpload}
    />
  );

  const renderPreview = () => (
    <div className="flex flex-col h-full bg-[#0B1120]">
      <div className="h-16 flex-none flex items-center bg-[#0F172A] border-b border-slate-700 px-4 justify-between">
        <div className="flex items-center">
          <button onClick={() => dispatch({ type: 'RESET' })} className="p-2 -ml-2 text-slate-400 hover:text-orange-500 transition-colors">
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
        {errorMsg && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-20 backdrop-blur-sm">
                <div className="bg-[#0F172A] border border-red-600 p-6 max-w-sm text-center shadow-2xl">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Generation Failed</h3>
                    <p className="text-slate-300 text-sm mb-6">{errorMsg}</p>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => dispatch({ type: 'SET_ERROR', payload: null })} fullWidth>Close</Button>
                        <Button onClick={generatePreview} fullWidth icon={<RefreshCw size={16} />}>Retry</Button>
                    </div>
                </div>
            </div>
        )}
      </div>
      <div className="flex-none bg-[#0F172A] p-4 border-t border-orange-500/20 shadow-2xl z-10">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
               <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest font-mono">
                 Select Texture
               </label>
               <span className="text-[10px] text-slate-500 font-mono">LIB-V1</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {EPOXY_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => dispatch({ type: 'SET_STYLE', payload: style })}
                  className={`
                    relative group flex flex-col items-center gap-1 p-1 border rounded-lg transition-all duration-200
                    ${selectedStyle?.id === style.id 
                      ? 'bg-slate-800 border-orange-500 ring-1 ring-orange-500' 
                      : 'bg-[#1e293b] border-slate-700 hover:border-slate-500'}
                  `}
                >
                  <div 
                    className="w-full aspect-square shadow-inner border border-black/20 rounded-md" 
                    style={{ background: style.css }}
                  />
                  {selectedStyle?.id === style.id && (
                    <div className="absolute top-0 right-0 p-0.5 bg-orange-500 text-black rounded-tr-lg rounded-bl-lg shadow-sm">
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                  )}
                  <span className={`text-[7px] sm:text-[9px] font-mono uppercase tracking-tighter truncate w-full text-center ${selectedStyle?.id === style.id ? 'text-orange-400' : 'text-slate-400'}`}>
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
                onChange={(e) => dispatch({ type: 'SET_CUSTOM_PROMPT', payload: e.target.value })}
                placeholder='SPECIFY CUSTOM TEXTURE...'
                className="w-full bg-[#050912] border border-slate-700 text-orange-100 rounded-none px-4 py-3 text-xs font-mono focus:outline-none focus:border-orange-500 placeholder-slate-600 uppercase"
              />
            </details>
          </div>
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
    <div className="flex flex-col items-center justify-center h-full bg-[#0B1120] p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 animate-pulse"></div>
      <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-slate-800 rounded-full"></div>
        <div className="absolute inset-2 border-t-2 border-orange-500 rounded-full animate-spin"></div>
        <div className="absolute inset-6 border-b-2 border-orange-300 rounded-full animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
        <Sparkles className="text-orange-500 animate-pulse" size={24} />
      </div>
      <div className="font-mono space-y-2 mb-8">
        <h3 className="text-xl font-bold text-white uppercase tracking-widest">Processing</h3>
        <p className="text-orange-500 text-xs uppercase tracking-widest">
          Analysing Geometry <span className="animate-pulse">...</span>
        </p>
        <p className="text-slate-500 text-[10px] mt-2">
           AI generation can take up to 30 seconds.
        </p>
      </div>
      <Button 
        variant="ghost" 
        onClick={() => dispatch({ type: 'SET_APP_STATE', payload: AppState.PREVIEW })}
        icon={<X size={16} />}
        className="text-xs"
      >
        Cancel
      </Button>
    </div>
  );

  const renderFormOverlay = () => {
    return (
        <div className="flex flex-col h-full bg-[#0B1120]">
           <div className="h-16 flex-none flex items-center bg-[#0F172A] border-b border-slate-700 px-4">
             <button onClick={() => dispatch({ type: 'TOGGLE_FORM', payload: false })} className="p-2 -ml-2 text-slate-400">
               <ArrowLeft size={24} />
             </button>
             <h2 className="ml-2 font-mono text-orange-500 text-xs uppercase tracking-widest">
                {userMode === 'CONTRACTOR' ? 'Project Data' : 'Contact Data'}
             </h2>
           </div>
           
           <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>
             <div className="w-full max-w-md max-h-full overflow-y-auto bg-[#0F172A] border border-orange-500/30 p-8 shadow-2xl relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500 pointer-events-none"></div>
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
                <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
                   {userMode === 'CONTRACTOR' ? (
                       <>
                           <div className="space-y-1">
                                <label className="text-[10px] font-mono text-orange-500 uppercase">Client Name (Optional)</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={leadData.name}
                                        onChange={handleInputChange}
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
                                            type="number" 
                                            name="sqFt"
                                            value={quoteData.sqFt}
                                            onChange={handleInputChange}
                                            className={`w-full bg-[#050912] border ${formErrors.sqFt ? 'border-red-500' : 'border-slate-700'} text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none`}
                                            placeholder="400"
                                        />
                                    </div>
                                     {formErrors.sqFt && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.sqFt}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-orange-500 uppercase">Price / Sq Ft</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                                        <input 
                                            type="number"
                                            name="pricePerSqFt"
                                            step="0.01"
                                            value={quoteData.pricePerSqFt}
                                            onChange={handleInputChange}
                                            className={`w-full bg-[#050912] border ${formErrors.pricePerSqFt ? 'border-red-500' : 'border-slate-700'} text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none`}
                                            placeholder="6.50"
                                        />
                                    </div>
                                    {formErrors.pricePerSqFt && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.pricePerSqFt}</p>}
                                </div>
                           </div>
                           <div className="p-4 bg-slate-800/50 border border-slate-700 text-center">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Estimated Total</span>
                                <span className="text-2xl font-bold text-white">
                                    ${((parseFloat(quoteData.sqFt) || 0) * (parseFloat(quoteData.pricePerSqFt) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </span>
                           </div>
                       </>
                   ) : (
                       <>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-orange-500 uppercase">Your Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                                <input 
                                    type="text" 
                                    name="name"
                                    value={leadData.name}
                                    onChange={handleInputChange}
                                    className={`w-full bg-[#050912] border ${formErrors.name ? 'border-red-500' : 'border-slate-700'} text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none`}
                                    placeholder="John Doe"
                                />
                            </div>
                            {formErrors.name && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.name}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-orange-500 uppercase">Phone Contact</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                                <input 
                                    type="tel" 
                                    name="phone"
                                    value={leadData.phone}
                                    onChange={handleInputChange}
                                    className={`w-full bg-[#050912] border ${formErrors.phone ? 'border-red-500' : 'border-slate-700'} text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none`}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            {formErrors.phone && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.phone}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-mono text-orange-500 uppercase">Email Address (Optional)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                                <input 
                                    type="email" 
                                    name="email"
                                    value={leadData.email}
                                    onChange={handleInputChange}
                                    className={`w-full bg-[#050912] border ${formErrors.email ? 'border-red-500' : 'border-slate-700'} text-white pl-10 pr-4 py-3 text-sm focus:border-orange-500 focus:outline-none`}
                                    placeholder="john@example.com"
                                />
                            </div>
                            {formErrors.email && <p className="text-red-500 text-xs mt-1 font-mono">{formErrors.email}</p>}
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

    return (
      <div className="flex flex-col h-full bg-[#0B1120]">
        <div className="h-16 flex-none flex items-center justify-between bg-[#0F172A] border-b border-slate-700 px-4">
          <button onClick={() => dispatch({ type: 'SET_APP_STATE', payload: AppState.PREVIEW })} className="p-2 -ml-2 text-slate-400 hover:text-orange-500 transition-colors">
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

        <div className="flex-none p-6 bg-[#0F172A] border-t border-slate-700">
          {!finalQuoteImage ? (
            <div className="space-y-3">
              <Button 
                onClick={() => dispatch({ type: 'TOGGLE_FORM', payload: true })}
                fullWidth 
                icon={userMode === 'CONTRACTOR' ? <Calculator size={18} /> : <FileCheck size={18} />}
                className="animate-pulse shadow-[0_0_15px_rgba(234,88,12,0.3)]"
              >
                {userMode === 'CONTRACTOR' ? 'Calculate & Finalize Estimate' : 'Request Quote'}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                 <Button variant="secondary" onClick={() => dispatch({ type: 'SET_APP_STATE', payload: AppState.PREVIEW })}>Try Again</Button>
                 <Button variant="secondary" onClick={() => dispatch({ type: 'RESET' })}>New Photo</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = finalQuoteImage!;
                    link.download = `carefree-stone-${userMode.toLowerCase()}-${Date.now()}.jpg`;
                    link.click();
                  }}
                  icon={<Download size={16} />}
                >
                  Save Image
                </Button>

                <Button 
                  onClick={() => {
                     if (userMode === 'CUSTOMER') {
                         const body = `Hi Carefree Stone, I'm ${leadData.name}. I'd like a quote for this epoxy floor design. (My Ref: ${Date.now().toString().slice(-6)})`;
                         window.location.href = `sms:16028670867?body=${encodeURIComponent(body)}`;
                     } else {
                         if (navigator.share) {
                             fetch(finalQuoteImage!).then(res => res.blob()).then(blob => {
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
              <Button variant="ghost" onClick={() => dispatch({ type: 'RESET' })} className="w-full text-xs">Start Over</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentState = () => {
      switch(appState) {
          case AppState.IDLE:
              return renderIdle();
          case AppState.CAPTURE:
              return renderCapture();
          case AppState.PREVIEW:
              return renderPreview();
          case AppState.PROCESSING:
              return renderProcessing();
          case AppState.RESULT:
              return renderResult();
          default:
              return renderIdle();
      }
  }

  return (
    <div className="h-full w-full bg-[#0B1120] text-slate-50 font-sans selection:bg-orange-500/30 selection:text-white bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] overflow-hidden fixed inset-0">
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
      {renderCurrentState()}
    </div>
  );
};

export default App;