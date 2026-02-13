
import { AssessmentItem } from './types';

export const ASSESSMENT_STRUCTURE: Partial<AssessmentItem>[] = [
  // 10. 健康状態
  { id: '10-1', category: '健康状態', itemName: '自覚症状', judgmentOptions: ['無', '有'] },
  
  // 11. ADL
  { id: '11-1', category: 'ADL', itemName: '寝返り', judgmentOptions: ['自力で可', '介助で可'] },
  { id: '11-2', category: 'ADL', itemName: '起き上がり', judgmentOptions: ['自力で可', '介助で可'] },
  { id: '11-3', category: 'ADL', itemName: '座位保持', judgmentOptions: ['自力で保てる', '保てない'] },
  { id: '11-4', category: 'ADL', itemName: '立位保持', judgmentOptions: ['自力で保てる', '保てない'] },
  { id: '11-5', category: 'ADL', itemName: '立ち上がり', judgmentOptions: ['自力で可', '介助で可'] },
  { id: '11-6', category: 'ADL', itemName: '移乗', judgmentOptions: ['自力で可', '介助で可'] },
  { id: '11-7', category: 'ADL', itemName: '歩行状態(室内)', judgmentOptions: ['歩行で可', '付き添い介助', '歩行不可'] },
  { id: '11-8', category: 'ADL', itemName: '歩行状態(室外)', judgmentOptions: ['歩行で可', '付き添い介助', '歩行不可'] },
  { id: '11-9', category: 'ADL', itemName: '食事動作', judgmentOptions: ['自力で可', '見守り声掛け', '介助'] },
  { id: '11-10', category: 'ADL', itemName: '整容', judgmentOptions: ['自力で可', '見守り声掛け', '介助'] },
  { id: '11-11', category: 'ADL', itemName: '更衣', judgmentOptions: ['自力で可', '見守り声掛け', '介助'] },
  { id: '11-12', category: 'ADL', itemName: '入浴動作', judgmentOptions: ['自力で可', '見守り声掛け', '介助'] },
  { id: '11-13', category: 'ADL', itemName: 'トイレ動作', judgmentOptions: ['自力で可', '見守り声掛け', '介助'] },

  // 12. IADL
  { id: '12-1', category: 'IADL', itemName: '調理', judgmentOptions: ['自立', '一部介助', '全介助'] },
  { id: '12-2', category: 'IADL', itemName: '掃除', judgmentOptions: ['自立', '一部介助', '全介助'] },
  { id: '12-3', category: 'IADL', itemName: '洗濯', judgmentOptions: ['自立', '一部介助', '全介助'] },
  { id: '12-4', category: 'IADL', itemName: '買物', judgmentOptions: ['自立', '一部介助', '全介助'] },
  { id: '12-5', category: 'IADL', itemName: '服薬管理', judgmentOptions: ['自立', '一部介助', '全介助'] },
  { id: '12-6', category: 'IADL', itemName: '金銭管理', judgmentOptions: ['自立', '一部介助', '全介助'] },
  { id: '12-7', category: 'IADL', itemName: '電話', judgmentOptions: ['自立', '一部介助', '全介助'] },
  { id: '12-8', category: 'IADL', itemName: '交通機関の利用', judgmentOptions: ['自立', '一部介助', '全介助'] },
  { id: '12-9', category: 'IADL', itemName: '車の運転', judgmentOptions: ['運転している', '運転していない'] },

  // 13. 認知機能や判断能力
  { id: '13-1', category: '認知機能や判断能力', itemName: '認知機能', judgmentOptions: ['支障なし', '支障あり'] },
  { id: '13-2', category: '認知機能や判断能力', itemName: '判断能力', judgmentOptions: ['支障なし', '支障あり'] },

  // 14. コミュニケーション
  { id: '14-1', category: 'コミュニケーション', itemName: '視覚', judgmentOptions: ['正常', '大きい字は可', 'ほぼ見えない', '失明'] },
  { id: '14-2', category: 'コミュニケーション', itemName: '聴覚', judgmentOptions: ['正常', '大きい声は可', 'ほぼ聞こえない', '失聴'] },
  { id: '14-3', category: 'コミュニケーション', itemName: '意思疎通', judgmentOptions: ['可能', 'やや不自由', 'その場のみ可', '全くできない'] },
  { id: '14-4', category: 'コミュニケーション', itemName: '会話', judgmentOptions: ['可能', 'やや不自由', '不明瞭', '全できない'] },

  // 15. 社会との関わり
  { id: '15-1', category: '社会との関わり', itemName: '社会的活動への参加意欲', judgmentOptions: ['意欲あり', '現状維持', '意欲なし'] },
  { id: '15-2', category: '社会との関わり', itemName: '近隣との付き合い', judgmentOptions: ['頻繁にある', '時々ある', '全くない'] },
  { id: '15-3', category: '社会との関わり', itemName: '疎外感の有無', judgmentOptions: ['無', '有'] },

  // 16. 排泄・排便
  { id: '16-1', category: '排泄・排便', itemName: '尿・便意', judgmentOptions: ['有', 'あいまい', '無'] },
  { id: '16-2', category: '排泄・排便', itemName: '失禁の状況', judgmentOptions: ['無', '時々あり', '頻繁にあり'] },

  // 17. 皮膚
  { id: '17-1', category: '皮膚', itemName: '褥瘡', judgmentOptions: ['異常なし', '要観察', '異常あり'] },
  { id: '17-2', category: '皮膚', itemName: '皮膚の清潔状態', judgmentOptions: ['異常なし', '要観察', '異常あり'] },

  // 18. 口腔内の状況
  { id: '18-1', category: '口腔内', itemName: '口腔ケア', judgmentOptions: ['自力で可', '見守り声掛け', '介助'] },
  { id: '18-2', category: '口腔内', itemName: '嚥下機能', judgmentOptions: ['良い', 'やや低下', '悪い'] },

  // 19. 食事摂取
  { id: '19-1', category: '食事摂取', itemName: '食形態(主食)', judgmentOptions: ['普通', 'おかゆ', 'ペースト'] },
  { id: '19-2', category: '食事摂取', itemName: '食形態(副食)', judgmentOptions: ['普通', '一口大', '刻み', 'ミキサー', 'ペースト', 'とろみ'] },
  { id: '19-3', category: '食事摂取', itemName: '食事量', judgmentOptions: ['多い', '普通', '少ない'] },

  // 21. 介護力
  { id: '21-1', category: '介護力', itemName: '主な介護者', judgmentOptions: ['有', '無'] },
  { id: '21-2', category: '介護力', itemName: '介護負担感', judgmentOptions: ['軽い', 'やや軽い', '普通', 'やや重い', '重い'] },
  { id: '21-3', category: '介護力', itemName: '介護継続の意思', judgmentOptions: ['有', '無'] },
  
  // 20, 22, 23
  { id: '20-1', category: '問題行動', itemName: '問題行動(BPSD)', judgmentOptions: ['無', '有'] },
  { id: '22-1', category: '居住環境', itemName: '居住環境問題点', judgmentOptions: ['無', '有'] },
  { id: '23-1', category: '特別な状況', itemName: '特別な状況(医療的ケア等)', judgmentOptions: ['無', '有'] },
];
