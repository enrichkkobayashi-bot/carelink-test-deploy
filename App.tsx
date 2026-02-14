
import React, { useState, useRef, useCallback } from 'react';
import { AssessmentItem, AppStatus, CarePlan, FaceSheetData, FamilyMember } from './types';
import { ASSESSMENT_STRUCTURE } from './constants';
import { analyzeAssessmentAudio, generateCarePlanFromAssessment } from './services/geminiService';
import AssessmentTable from './components/AssessmentTable';
import CarePlanView from './components/CarePlanView';
import FaceSheet from './components/FaceSheet';
import Sidebar from './components/Sidebar';

declare var html2pdf: any;

type Tab = 'new' | 'face' | 'assessment' | 'plan';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [consultationNote, setConsultationNote] = useState('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  // アセスメント実施日
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);

  // Assessment State
  const [items, setItems] = useState<AssessmentItem[]>(
    ASSESSMENT_STRUCTURE.map(item => ({
      ...item,
      situation: '',
      judgment: '',
      strengths: ''
    } as AssessmentItem))
  );

  // Face Sheet State
  const initialFamily: FamilyMember[] = Array(3).fill({
    name: '',
    address: '',
    age: '',
    gender: '',
    relationship: '',
    tel: '',
    healthStatus: '',
    isKeyPerson: false
  });

  const [faceSheetData, setFaceSheetData] = useState<FaceSheetData>({
    consultationDate: '',
    consultationMethod: '',
    referralPath: '',
    userName: '',
    userGender: '',
    userDob: '',
    userAge: '',
    userAddress: '',
    userTel: '',
    careLevel: '未申請',
    carePeriod: '',
    disabilityLevel: '',
    economicStatus: '',
    familyMembers: initialFamily,
    genogramUrl: null,
    lifeHistory: '',
    userAspiration: '',
    familyAspiration: '',
    physicalIndependence: '',
    cognitiveIndependence: '',
    height: '',
    weight: '',
    bmi: '',
    bloodPressure: '',
    doctorName: '',
    hospitalName: '',
    doctorContact: '',
    medicalHistory: '',
    paralysisContracture: '',
    painNumbness: '',
    medicationStatus: '自立',
    medicationTypes: '',
    infections: '',
    allergies: '',
    bpsdSymptoms: '',
    housingType: '持ち家(戸建)',
    housingOwnership: '',
    hasOwnRoom: '有',
    isSoloDuringDay: '無',
    hasBath: '有',
    toiletType: '洋式',
    hasSteps: '無',
    hasRenovation: '無',
    flooringMaterial: '',
    lightingStatus: '',
    footwearStatus: '',
    floorPlanUrl: null,
    currentSituation: '',
    serviceUtilization: '',
    formalService: '',
    informalService: ''
  });

  const [carePlan, setCarePlan] = useState<CarePlan | null>(null);
  const [carePlanInstructions, setCarePlanInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 各コンテンツごとの参照を分けることで、非表示タブの影響を排除
  const faceSheetRef = useRef<HTMLDivElement>(null);
  const assessmentRef = useRef<HTMLDivElement>(null);
  const carePlanRef = useRef<HTMLDivElement>(null);

  const handleUpdateItem = useCallback((id: string, field: keyof AssessmentItem, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  const handleUpdateFaceSheet = (field: keyof FaceSheetData, value: any) => {
    setFaceSheetData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-calculate BMI if height or weight changes
      if (field === 'height' || field === 'weight') {
        const h = parseFloat(newData.height);
        const w = parseFloat(newData.weight);
        if (!isNaN(h) && !isNaN(w) && h > 0) {
          const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
          newData.bmi = bmi;
        }
      }
      return newData;
    });
  };

  // Helper function to determine file type for icon
  const getFileIcon = (mimeType: string, fileName: string) => {
    // Basic check based on MIME type or extension
    if (mimeType.startsWith('audio/')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
      );
    } else if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
      );
    } else {
      // Text or others
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      );
    }
  };

  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    console.log("Dropped files:", fileArray.map(f => ({ name: f.name, type: f.type, size: f.size })));

    const validFiles = fileArray.filter(file => {
      const type = file.type;
      const name = file.name.toLowerCase();
      // Allow Audio (MIME or Extension), PDF, Text, CSV
      const isAudio = type.startsWith('audio/') ||
        name.endsWith('.mp3') ||
        name.endsWith('.wav') ||
        name.endsWith('.m4a') ||
        name.endsWith('.aac') ||
        name.endsWith('.flac') ||
        name.endsWith('.ogg');

      const isValid = isAudio || type === 'application/pdf' || type.startsWith('text/') || name.endsWith('.pdf') || name.endsWith('.txt') || name.endsWith('.csv');

      if (!isValid) {
        console.warn(`File rejected: ${name} (Type: ${type})`);
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      setStagedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    } else {
      const rejectedNames = fileArray.map(f => f.name).join(', ');
      alert(`以下のファイルはサポートされていない形式のため読み込めませんでした。\n${rejectedNames}\n\n対応形式: 音声(mp3,m4a,wav,aac,flac,ogg), PDF, テキスト, CSV`);
      setError("有効なファイル（音声、PDF、テキスト）を選択してください。");
    }
  };

  const removeFile = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setStagedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const executeAnalysis = async () => {
    if (stagedFiles.length === 0 && !consultationNote.trim()) {
      alert("ファイルが選択されていないか、相談記録が入力されていません。");
      setError("音声データ、資料、または相談記録のいずれかを入力してください。");
      return;
    }

    setStatus(AppStatus.PROCESSING);
    setError(null);

    try {
      // Pass the File objects directly to the service which now handles uploading
      const { assessment: aiAssessmentResults, faceSheet: aiFaceSheetResults } = await analyzeAssessmentAudio(stagedFiles, consultationNote);

      setItems(prev => prev.map(item => {
        const aiMatch = aiAssessmentResults.find(r => r.id === item.id);
        if (aiMatch) {
          return {
            ...item,
            situation: aiMatch.situation || item.situation,
            judgment: aiMatch.judgment || item.judgment,
            strengths: aiMatch.strengths || item.strengths
          };
        }
        return item;
      }));

      // Merge Face Sheet Data
      setFaceSheetData(prev => {
        const newData = { ...prev };
        Object.entries(aiFaceSheetResults).forEach(([key, value]) => {
          if (value && Object.prototype.hasOwnProperty.call(newData, key)) {
            (newData as any)[key] = value;
          }
        });
        return newData;
      });

      setStatus(AppStatus.COMPLETED);
      setActiveTab('face'); // Usually go to face sheet after analysis
    } catch (err: any) {
      console.error("Analysis Error:", err);
      const errorMessage = err?.message || "不明なエラーが発生しました";
      alert(`AI分析中にエラーが発生しました。\n詳細: ${errorMessage}`);
      setError(`AI分析エラー: ${errorMessage}`);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleGenerateCarePlan = async () => {
    setStatus(AppStatus.GENERATING_PLAN);
    setError(null);
    try {
      const plan = await generateCarePlanFromAssessment(items, faceSheetData, carePlanInstructions);
      setCarePlan(plan);
      setStatus(AppStatus.COMPLETED);
      setActiveTab('plan');
    } catch (err) {
      console.error(err);
      setError("ケアプランの生成中にエラーが発生しました。");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileSelect(files);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFileSelect(files);
  };

  const handleDownloadPDF = async () => {
    // 現在表示されているタブの要素のみを対象にする
    let targetElement: HTMLElement | null = null;
    let fileName = "";
    const userName = faceSheetData.userName || '未記入';

    if (activeTab === 'face') {
      targetElement = faceSheetRef.current;
      fileName = `フェイスシート_${userName}.pdf`;
    } else if (activeTab === 'assessment') {
      targetElement = assessmentRef.current;
      fileName = `アセスメントシート_${userName}.pdf`;
    } else if (activeTab === 'plan') {
      targetElement = carePlanRef.current;
      fileName = `ケアプラン案_${userName}.pdf`;
    }

    if (!targetElement) {
      if (activeTab === 'new') {
        alert("新規分析画面からはPDFを出力できません。分析完了後にフェイスシートやアセスメント画面から実行してください。");
      }
      return;
    }

    if (typeof html2pdf === 'undefined') {
      alert("PDF生成ライブラリがまだ読み込まれていません。少し待ってから再度お試しください。");
      return;
    }

    // PDF生成専用のクラスを付与
    targetElement.classList.add('pdf-export-mode');

    const opt = {
      margin: 10,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // html2pdfを実行。対象要素をクローンすることで安全に処理
      await html2pdf().set(opt).from(targetElement).save();
    } catch (err) {
      console.error("PDF generation error:", err);
      alert(`PDFの生成に失敗しました。エラー詳細: ${err}`);
    } finally {
      // 終わったらクラスを削除
      targetElement.classList.remove('pdf-export-mode');
    }
  };

  const handleReset = useCallback(() => {
    if (!window.confirm("現在の入力内容と分析結果をすべて消去して、最初からやり直しますか？")) {
      return;
    }

    // File input reset
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setStagedFiles([]);
    setConsultationNote('');
    setStatus(AppStatus.IDLE);
    setError(null);
    setCarePlan(null);
    setActiveTab('new');

    // Reset Items
    setItems(ASSESSMENT_STRUCTURE.map(item => ({
      ...item,
      situation: '',
      judgment: '',
      strengths: ''
    } as AssessmentItem)));

    // Reset FaceSheet
    setFaceSheetData({
      consultationDate: '',
      consultationMethod: '',
      referralPath: '',
      userName: '',
      userGender: '',
      userDob: '',
      userAge: '',
      userAddress: '',
      userTel: '',
      careLevel: '未申請',
      carePeriod: '',
      disabilityLevel: '',
      economicStatus: '',
      keyPersonName: '',
      keyPersonRelationship: '',
      emergencyContact1: undefined,
      emergencyContact2: undefined,

      familyMembers: Array(3).fill({
        name: '',
        address: '',
        age: '',
        gender: '',
        relationship: '',
        tel: '',
        healthStatus: '',
        isKeyPerson: false
      }),
      genogramUrl: null,
      lifeHistory: '',
      userAspiration: '',
      familyAspiration: '',
      physicalIndependence: '',
      cognitiveIndependence: '',
      height: '',
      weight: '',
      bmi: '',
      bloodPressure: '',
      doctorName: '',
      hospitalName: '',
      doctorContact: '',
      medicalHistory: '',
      paralysisContracture: '',
      painNumbness: '',
      medicationStatus: '自立',
      medicationTypes: '',
      infections: '',
      allergies: '',
      bpsdSymptoms: '',
      housingType: '持ち家(戸建)',
      housingOwnership: '',
      hasOwnRoom: '有',
      isSoloDuringDay: '無',
      hasBath: '有',
      toiletType: '洋式',
      hasSteps: '無',
      hasRenovation: '無',
      flooringMaterial: '',
      lightingStatus: '',
      footwearStatus: '',
      floorPlanUrl: null,
      currentSituation: '',
      serviceUtilization: '',
      formalService: '',
      informalService: ''
    });

    // Reset Assessment Date
    setAssessmentDate(new Date().toISOString().split('T')[0]);

  }, []);

  const handlePrint = () => {
    window.print();
  };


  return (
    <div className="flex min-h-screen bg-gray-50 flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 w-0 flex flex-col min-h-screen bg-white text-gray-800 relative">
          {/* ケアプラン生成中のオーバーレイ表示 */}
          {status === AppStatus.GENERATING_PLAN && (
            <div className="fixed inset-0 bg-white/95 z-[100] flex flex-col items-center justify-center backdrop-blur-md">
              <div className="relative w-28 h-28 mb-8">
                <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-10 h-10 text-indigo-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">ケアプラン案を作成中...</h2>
              <p className="text-gray-500 font-bold text-lg">プロのアセスメントに基づき、最適なプランを練っています</p>
              <div className="mt-8 flex gap-3">
                <span className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}

          <nav className="flex justify-center border-b border-gray-100 no-print sticky top-0 bg-white z-[150]">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-8 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'new' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
              新規分析
            </button>
            <button
              onClick={() => setActiveTab('face')}
              className={`px-8 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'face' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
              フェイスシート
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-8 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'assessment' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
              アセスメント
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-8 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'plan' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" /></svg>
              ケアプラン案
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 text-rose-500 border-transparent hover:text-rose-700 hover:bg-rose-50"
              title="リセット"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </nav>

          <main className="max-w-6xl mx-auto pt-12 pb-24 px-6 print:p-0 print:m-0 print:max-w-none">
            {activeTab === 'new' && (
              <div className="flex flex-col items-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AI ケアマネジメント分析</h1>
                <p className="text-gray-500 mb-12 text-center max-w-2xl">面談の音声データや相談記録を入力して、プロの視点でアセスメントとフェイスシートの作成を支援します。</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12">
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group h-96 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${isDragging ? 'border-indigo-400 bg-indigo-50 shadow-inner' : stagedFiles.length > 0 ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 bg-blue-50/30 hover:bg-blue-50/50'}`}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept="audio/*,.pdf,.txt,.csv" multiple onChange={handleFileUpload} />

                    {stagedFiles.length > 0 ? (
                      <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
                        <div className="flex-1 space-y-3 w-full">
                          {stagedFiles.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center p-3 bg-indigo-50 border border-indigo-100 rounded-2xl group/item hover:bg-indigo-100 transition-colors">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600 mr-3 flex-shrink-0">
                                {getFileIcon(file.type, file.name)}
                              </div>
                              <div className="flex-1 min-w-0 mr-3">
                                <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              <button
                                onClick={(e) => removeFile(index, e)}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                                title="削除"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col items-center justify-center text-center">
                          <p className="text-indigo-600 font-bold text-sm mb-2">さらにファイルを追加</p>
                          <p className="text-gray-400 text-xs">クリックまたはドラッグ＆ドロップ</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-gray-200/50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          音声・資料をアップロード
                        </h3>
                        <p className="text-gray-400 text-sm">
                          音声・PDF・テキスト（複数可）
                        </p>
                      </>
                    )}

                    {status === AppStatus.PROCESSING && (
                      <div className="absolute inset-0 bg-white/80 rounded-3xl flex flex-col items-center justify-center z-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                        <p className="text-indigo-600 font-bold">AI解析中...</p>
                      </div>
                    )}
                  </div>

                  <div className="h-96 relative">
                    <textarea
                      className="w-full h-full p-8 rounded-3xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none resize-none text-gray-600 placeholder-gray-300"
                      placeholder="相談記録の要約を入力してください。"
                      value={consultationNote}
                      onChange={(e) => setConsultationNote(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={executeAnalysis}
                  disabled={status === AppStatus.PROCESSING || (stagedFiles.length === 0 && !consultationNote.trim())}
                  className="group relative flex items-center justify-center gap-2 bg-indigo-600 text-white px-12 py-5 rounded-2xl font-bold transition-all hover:bg-indigo-700 w-full max-w-xl shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-lg">AIアセスメント実行</span>
                </button>
              </div>
            )}

            <div className="pdf-container">
              {activeTab === 'face' && (
                <div className="space-y-6" ref={faceSheetRef}>
                  <div className="flex justify-between items-center mb-4 no-print">
                    <h2 className="text-2xl font-bold text-gray-800">フェイスシート</h2>
                    <div className="flex gap-2">
                      <button onClick={handlePrint} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold">印刷ダイアログ</button>
                    </div>
                  </div>
                  <FaceSheet data={faceSheetData} onUpdate={handleUpdateFaceSheet} />
                </div>
              )}

              {activeTab === 'assessment' && (
                <div className="space-y-6" ref={assessmentRef}>
                  <div className="flex justify-between items-center mb-4 no-print">
                    <h2 className="text-2xl font-bold text-gray-800">アセスメント解析結果</h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleGenerateCarePlan}
                        disabled={status === AppStatus.GENERATING_PLAN}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.727 2.903a2 2 0 01-3.532.547l-1.428-2.142a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.727 2.903a2 2 0 01-3.532.547l-1.428-2.142" /></svg>
                        {status === AppStatus.GENERATING_PLAN ? '生成中...' : 'ケアプラン案を作成'}
                      </button>
                      <button onClick={handlePrint} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold">
                        印刷ダイアログ
                      </button>
                    </div>
                  </div>

                  {/* ケアプラン作成指示入力エリア */}
                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mb-6 print:hidden">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="carePlanInstructions" className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          ケアプラン作成の方針・指示（自由記述）
                        </label>
                        <span className="text-xs text-indigo-500 bg-white px-2 py-1 rounded-full border border-indigo-100">AIへの追加指示</span>
                      </div>
                      <textarea
                        id="carePlanInstructions"
                        className="w-full h-24 p-4 rounded-xl border-2 border-indigo-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none text-gray-700 placeholder-indigo-300/70"
                        placeholder="例：&#13;&#10;・リハビリを重視したプランにしてください。&#13;&#10;・家族の介護負担軽減（腰痛対策）を最優先に考えてください。&#13;&#10;・本人は「自宅で最期まで過ごしたい」と強く希望しています。"
                        value={carePlanInstructions}
                        onChange={(e) => setCarePlanInstructions(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 ml-1">
                        ※ここに入力した内容は、ケアプラン生成時のAIプロンプト（指示）として直接反映されます。「どのようなプランにしたいか」を具体的に書くと精度が向上します。
                      </p>
                    </div>
                  </div>

                  {/* 印刷用ヘッダー & 入力エリア */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-6 print:border-none print:p-0 print:bg-white">
                    <div className="flex flex-wrap gap-6 items-center">
                      <div className="flex flex-col gap-1 w-64">
                        <label className="text-xs font-bold text-gray-500 uppercase">利用者名</label>
                        <input
                          type="text"
                          className="w-full border-b-2 border-gray-200 bg-transparent py-1 px-1 font-bold text-lg focus:outline-none focus:border-indigo-500 transition-colors print:border-none"
                          placeholder="氏名を入力"
                          value={faceSheetData.userName}
                          onChange={(e) => handleUpdateFaceSheet('userName', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-48">
                        <label className="text-xs font-bold text-gray-500 uppercase">実施日</label>
                        <input
                          type="date"
                          className="w-full border-b-2 border-gray-200 bg-transparent py-1 px-1 font-bold text-lg focus:outline-none focus:border-indigo-500 transition-colors print:border-none"
                          value={assessmentDate}
                          onChange={(e) => setAssessmentDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <AssessmentTable items={items} onUpdate={handleUpdateItem} />
                </div>
              )}

              {activeTab === 'plan' && (
                <div className="space-y-6" ref={carePlanRef}>
                  <div className="flex justify-between items-center mb-4 no-print">
                    <h2 className="text-2xl font-bold text-gray-800">ケアプラン案（AI生成）</h2>
                    <button
                      onClick={handleDownloadPDF}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      PDFとして保存
                    </button>
                  </div>
                  {carePlan ? <CarePlanView plan={carePlan} /> : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed no-print">
                      <p>アセスメント結果からプランを生成してください</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main >


        </div>
      </div>
    </div>
  );
};

export default App;
