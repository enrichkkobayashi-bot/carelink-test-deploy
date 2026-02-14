
export interface AssessmentItem {
  id: string;
  category: string;
  itemName: string;
  situation: string;
  judgment: string;
  judgmentOptions: string[];
  strengths: string;
}

export interface AssessmentData {
  items: AssessmentItem[];
}

export interface CarePlanService {
  serviceType: string;
  contentItems: string[]; // 目的と援助内容を統合した箇条書きリスト
}

export interface CarePlanItem {
  need: string;
  longTermGoal: string;
  shortTermGoal: string;
  services: CarePlanService[];
}

export interface CarePlan {
  analysisResult: string; // 第1表：意向を踏まえた課題分析の結果 (200-250字)
  comprehensivePolicy: string; // 第1表：総合的な援助の方方針 (200-250字)
  planItems: CarePlanItem[]; // 第2表：解決すべき課題ごとの計画
  utilizingStrengths: string;
}

export interface FamilyMember {
  name: string;
  address: string;
  age: string;
  gender: string;
  relationship: string;
  tel: string;
  healthStatus: string;
  isKeyPerson: boolean;   // キーパーソンかどうか
}

export interface FaceSheetData {
  // Block 1
  consultationDate: string;
  consultationMethod: string;
  referralPath: string;
  userName: string;
  userGender: string;
  userDob: string;
  userAge: string;
  userAddress: string;
  userTel: string;
  careLevel: string;
  carePeriod: string;
  disabilityLevel: string;
  economicStatus: string;
  familyMembers: FamilyMember[];
  genogramUrl: string | null;
  lifeHistory: string; // 今までの生活
  userAspiration: string;
  familyAspiration: string;

  // Block 2
  physicalIndependence: string;
  cognitiveIndependence: string;
  height: string;
  weight: string;
  bmi: string;
  bloodPressure: string;
  doctorName: string;      // 主治医: 医師名
  hospitalName: string;    // 主治医: 病院名
  doctorContact: string;   // 主治医: 連絡先
  medicalHistory: string;
  paralysisContracture: string;
  painNumbness: string;
  medicationStatus: string;
  medicationTypes: string;
  infections: string;      // 感染症の有無
  allergies: string;       // アレルギー
  bpsdSymptoms: string;    // 認知症の具体的症状（BPSD）

  // Block 3
  housingType: string;
  housingOwnership: string;
  hasOwnRoom: string;
  isSoloDuringDay: string;
  hasBath: string;
  toiletType: string;
  hasSteps: string;
  hasRenovation: string;
  flooringMaterial: string;
  lightingStatus: string;
  footwearStatus: string;
  floorPlanUrl: string | null;
  currentSituation: string;    // 現在の生活状況
  serviceUtilization: string;  // 利用サービス
  formalService: string;       // 現在使用しているフォーマルサービス
  informalService: string;     // 現在使用しているインフォーマルサービス
}

export enum AppStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  GENERATING_PLAN = 'GENERATING_PLAN'
}
