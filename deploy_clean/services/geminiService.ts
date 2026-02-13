
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentItem, CarePlan, FaceSheetData } from '../types';
import { ASSESSMENT_STRUCTURE } from '../constants';

// const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

const assessmentSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      situation: { type: Type.STRING, description: "具体的な状況の記述（端的に1文で）" },
      judgment: { type: Type.STRING, description: "選択肢の中から最も適切な判定" },
      strengths: { type: Type.STRING, description: "本人の強みやポジティブな要素、社会資源の活用状況（端的に1文で）" }
    },
    required: ["id", "situation", "judgment", "strengths"]
  }
};

const faceSheetPartialSchema = {
  type: Type.OBJECT,
  properties: {
    medicalHistory: { type: Type.STRING, description: "既往歴・主傷病" },
    userAspiration: { type: Type.STRING, description: "本人の意向・希望" },
    familyAspiration: { type: Type.STRING, description: "家族の意向・要望" },
    physicalIndependence: { type: Type.STRING, description: "障害高齢者の日常生活自立度（J1, J2, A1, A2, B1, B2, C1, C2のいずれか）" },
    cognitiveIndependence: { type: Type.STRING, description: "認知症高齢者の日常生活自立度（自立, I, IIa, IIb, IIIa, IIIb, IV, Mのいずれか）" },
    medicationStatus: { type: Type.STRING, description: "服薬管理状況（自立, 家族管理, 訪問薬剤師, 一部介助, 全介助のいずれか）" },
    currentSituation: { type: Type.STRING, description: "現在の生活状況" },
    serviceUtilization: { type: Type.STRING, description: "利用している介護サービス・社会資源" },
    housingType: { type: Type.STRING, description: "居住形態（持ち家(戸建), 持ち家(集合), 借家, 公営住宅, その他）" },
    toiletType: { type: Type.STRING, description: "便所（洋式, 和式, ポータブル）" },
    hasSteps: { type: Type.STRING, description: "段差（無, 有(各所にあり), 有(一部あり)）" },
    hasRenovation: { type: Type.STRING, description: "住宅改修（無, 有(手すり等), 予定あり）" }
  }
};

const combinedResponseSchema = {
  type: Type.OBJECT,
  properties: {
    assessment: assessmentSchema,
    faceSheet: faceSheetPartialSchema
  },
  required: ["assessment", "faceSheet"]
};

const carePlanSchema = {
  type: Type.OBJECT,
  properties: {
    analysisResult: {
      type: Type.STRING,
      description: "第１表：意向を踏まえた課題分析の結果（200〜250文字程度）"
    },
    comprehensivePolicy: {
      type: Type.STRING,
      description: "第１表：総合的な援助の方針（200〜250文字程度）"
    },
    planItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          need: { type: Type.STRING, description: "解決すべき課題" },
          longTermGoal: { type: Type.STRING, description: "長期目標" },
          shortTermGoal: { type: Type.STRING, description: "短期目標" },
          services: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                serviceType: { type: Type.STRING, description: "サービス種別（例：訪問介護、通所介護等）" },
                contentItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "具体的な援助内容の箇条書き（1サービスにつき3〜4個）"
                }
              },
              required: ["serviceType", "contentItems"]
            }
          }
        },
        required: ["need", "longTermGoal", "shortTermGoal", "services"]
      },
      description: "第２表：解決すべき課題ごとの目標とサービス内容"
    },
    utilizingStrengths: {
      type: Type.STRING,
      description: "活用する本人の強み・社会資源"
    }
  },
  required: ["analysisResult", "comprehensivePolicy", "planItems", "utilizingStrengths"]
};

export const analyzeAssessmentAudio = async (
  files?: File[],
  consultationNote?: string
): Promise<{ assessment: Partial<AssessmentItem>[], faceSheet: Partial<FaceSheetData> }> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const aiInstance = new GoogleGenAI({ apiKey });
  const model = "gemini-2.0-flash"; // Using a typically faster/better model for files if available, otherwise fallback. Flash is good.

  // Helper to upload file via REST API since File API SDK is often Node-only
  const uploadFile = async (file: File): Promise<string> => {
    const metadata = { file: { mimeType: file.type, displayName: file.name } };

    // 1. Initial Resumable Upload Request to get the upload URL
    const initRes = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': file.size.toString(),
          'X-Goog-Upload-Header-Content-Type': file.type,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initRes.ok) throw new Error(`Upload failed to initialize: ${initRes.statusText}`);

    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) throw new Error('No upload URL received');

    // 2. Upload the actual bytes
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': file.size.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: file,
    });

    if (!uploadRes.ok) throw new Error(`File upload failed: ${uploadRes.statusText}`);

    const uploadResult = await uploadRes.json();
    return uploadResult.file.uri;
  };

  const structurePrompt = ASSESSMENT_STRUCTURE.map(item =>
    `ID: ${item.id}, 項目: ${item.itemName}, 選択肢: [${item.judgmentOptions?.join(', ')}]`
  ).join('\n');

  const totalItems = ASSESSMENT_STRUCTURE.length;
  const prompt = `
あなたは極めて優秀なケアマネジャーです。提供された「音声データ」または「資料（PDF・テキスト等）」、および「相談記録（メモ）」から、アセスメント項目（全${totalItems}項目）およびフェイスシート（基本情報）の分析を一括で行ってください。

【重要：出力遵守事項】
1. 定義された全${totalItems}項目を、ID順に漏れなく全て出力してください。途中で出力を止めないでください。
2. 情報が不足している項目についても、スキップせず、文脈から推測される内容か、あるいは「情報なし」として判定を選択してください。

【アセスメント出力ルール】
1. 「具体的状況」は、短く【1文で端的に】記載してください。
2. 「判定」は、指定された選択肢の中から最も近いものを選んでください。
3. 「強み」は、ケアプランに活かせるプラス要素を【1文で短く】記載してください。

【フェイスシート出力ルール】
入力内容から読み取れる範囲で、既往歴、意向、自立度、居住環境などの基本情報を抽出してください。
読み取れない項目は空欄（nullまたは空文字）にしてください。

【アセスメント項目定義】
${structurePrompt}

必ずJSONフォーマットで、指定されたスキーマに従って出力してください。
`;

  const parts: any[] = [];

  // Upload files and add URIs to prompt parts
  if (files && files.length > 0) {
    // Parallel uploads
    const uploadPromises = files.map(file => uploadFile(file));
    const fileUris = await Promise.all(uploadPromises);

    fileUris.forEach((uri, index) => {
      parts.push({
        fileData: {
          mimeType: files[index].type,
          fileUri: uri
        }
      });
    });
  }

  if (consultationNote) {
    parts.push({ text: `【補足相談記録】\n${consultationNote}` });
  }

  parts.push({ text: prompt });

  try {
    const response = await aiInstance.models.generateContent({
      model: "gemini-2.0-flash", // Updated to newer model for better performance
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: combinedResponseSchema
      }
    });

    const results = JSON.parse(response.text || '{"assessment": [], "faceSheet": {}}');
    return results;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateCarePlanFromAssessment = async (items: AssessmentItem[], faceSheet: FaceSheetData): Promise<CarePlan> => {
  const aiInstance = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
  const model = "gemini-2.0-flash"; // Use flash for speed/quality balance, or pro if needed

  // 1. Format Face Sheet Data (Basic Info & Environment)
  // Check for family members to determine living situation accurately
  const familyMembersList = faceSheet.familyMembers
    .filter(m => m.name.trim() !== '')
    .map(m => `${m.relationship}（${m.age}歳, ${m.healthStatus || '健康状態記載なし'}）`)
    .join('、');

  const livingSituation = familyMembersList
    ? `同居家族: あり（${familyMembersList}）`
    : '同居家族: なし（独居）';

  const faceSheetSummary = `
【基本情報（フェイスシート）】
- 利用者名: ${faceSheet.userName} (${faceSheet.userAge}歳, ${faceSheet.userGender})
- 要介護度: ${faceSheet.careLevel}
- 住環境: ${faceSheet.housingType}, ${faceSheet.hasSteps === '有' ? '段差あり' : '段差なし'}, ${faceSheet.housingOwnership}
- 生活状況: ${livingSituation}
- 現在の生活: ${faceSheet.currentSituation || '記載なし'}
- 既往歴: ${faceSheet.medicalHistory || '記載なし'}
- 服薬: ${faceSheet.medicationStatus}
- 本人の意向: ${faceSheet.userAspiration || '記載なし'}
- 家族の意向: ${faceSheet.familyAspiration || '記載なし'}
`;

  // 2. Format Assessment Data
  const assessmentSummary = items
    .filter(i => i.situation || i.judgment)
    .map(i => `[${i.category}] ${i.itemName}:
    - 判定: ${i.judgment}
    - 状況: ${i.situation}
    - 強み: ${i.strengths}`)
    .join('\n');

  const prompt = `
あなたは、日本の介護保険制度を熟知した極めて優秀な「主任介護支援専門員（ベテランケアマネジャー）」です。
以下の「基本情報（フェイスシート）」と「アセスメント結果」に基づき、利用者の自立支援に資する質の高い「居宅サービス計画書（ケアプラン）案」を作成してください。

${faceSheetSummary}

【アセスメント結果】
${assessmentSummary}

【思考プロセス指示：課題整理総括表の活用】
ケアプランを作成する前に、あなたの内部で以下の「課題整理総括表」のマトリクスを用いて情報を分析してください（出力不要）。
1. **阻害要因の分析**: 疾患・身体機能（心身機能・構造）だけでなく、環境因子（住宅環境、介護力不足など）や個人因子（性格、役割喪失など）を含めた阻害要因を特定する。
2. **強みの活用**: 本人の残存能力（できること）、本人の意欲（〜したい）、家族の協力、地域資源などの「強み」を具体的で発見する。
3. **生活課題の導出**: 「阻害要因」によって生じている「生活上の支障（ニーズ）」を明確にする。単なる「〜できない」ではなく、「〜できないため、〜な生活が送れない」という視点で考える。

【作成指示】
上記の分析に基づき、以下のケアプラン項目を出力してください。

1. **第1表「意向を踏まえた課題分析の結果」** (200〜300文字程度)
   - 単なる状況説明ではなく、「なぜその支援が必要なのか」という因果関係を含めて記述する。
   - 阻害要因だけでなく、強みをどう活かすかという視点を入れる。
   - 本人の「〜したい」という主観的ニーズ（デマンド）と、専門職から見た客観的ニーズを統合して記述する。

2. **第1表「総合的な援助の方針」** (200〜300文字程度)
   - チーム全体で共有すべき目標と方針を、前向きで具体的な言葉で記述する。
   - 「安心・安全」だけでなく、「自立支援」「生活の質の向上」に向けたビジョンを示す。

3. **第2表「解決すべき課題（ニーズ）」**
   - 優先順位の高いものを抽出する。
   - 表現は「〜ができるようになる」「〜を維持する」といったポジティブな表現や、「〜が整う」といった環境調整の視点を含める。
   - 長期目標・短期目標は、実現可能性があり、評価可能な内容にする。

4. **第2表「サービス内容」**
   - **重要**: 介護ソフト（カイポケ等）に転記しやすいよう、目的語（〜のために）は含めず、**「〜を行う」「〜を確認する」「〜を促す」といった具体的な援助行為のみ**を箇条書きにする。
   - アセスメントから導かれた必要不可欠な支援に絞る。

必ずJSONフォーマットで、指定されたスキーマに従って出力してください。
`;

  try {
    const response = await aiInstance.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: carePlanSchema
      }
    });

    return JSON.parse(response.text || '{}') as CarePlan;
  } catch (error) {
    console.error("Care Plan Generation Error:", error);
    throw error;
  }
};



