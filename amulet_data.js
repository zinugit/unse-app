/**
 * UNSE (운세) - 부적 데이터 레이어
 * ─────────────────────────────────────────────────────
 * 17종 실제 부적 데이터 (Red/Gold 버전 이미지 경로 포함)
 * matchKeywords: 키워드 UI와 매칭되는 배열 (복수 키워드 가능)
 * scoreCondition: 'high' | 'low' | 'all' — 사주 점수 기반 필터링 조건
 */

window.AMULET_DATA = [
    // ── 재물 ──
    { id: 'm1', category: 'money', title: '북두칠성부', shortDesc: '삶의 풍요로움을 기원', longDesc: '일생의 고난을 제거하고 건강, 학문, 재물 등 전반적인 운이 긍정적으로 흘러 삶의 풍요로움을 기원합니다.', imgRed: './assets/amulets/북두칠성부_Red.png', imgGold: './assets/amulets/북두칠성부_Gold.png', matchKeywords: ['money'], scoreCondition: 'high' },
    { id: 'm2', category: 'money', title: '재왕부', shortDesc: '재물이 많이 쌓이길 기원', longDesc: '새로운 사업이나 커리어가 번창하여 금전적으로 풍요로워지고, 위기 상황을 잘 극복하도록 돕습니다.', imgRed: './assets/amulets/재왕부_red.png', imgGold: './assets/amulets/재왕부_gold.png', matchKeywords: ['money'], scoreCondition: 'low' },

    // ── 연애/가정 ──
    { id: 'l1', category: 'love', title: '금슬연리지부', shortDesc: '외도를 막고 서로만 바라보게 함', longDesc: '연인이나 부부 사이에서 외도 대상에 대한 관심을 거두게 하고, 파트너와 긴밀하게 소통하고 교감하게 만듭니다.', imgRed: './assets/amulets/금슬연리지부_red.png', imgGold: './assets/amulets/금슬연리지부_gold.png', matchKeywords: ['family'], scoreCondition: 'low' },
    { id: 'l2', category: 'love', title: '재회부', shortDesc: '헤어진 사람과 관계 회복 기원', longDesc: '꼬이거나 막힌 인연을 풀어주어, 헤어진 연인이나 부부가 마음을 돌이켜 예전 관계로 돌아올 수 있게 돕는 강력한 촉매입니다.', imgRed: './assets/amulets/재회부_red.png', imgGold: './assets/amulets/재회부_gold.png', matchKeywords: ['love_reunion'], scoreCondition: 'all' },
    { id: 'l3', category: 'love', title: '화목창성생자부', shortDesc: '귀한 자녀의 탄생 기원', longDesc: '부부가 화목하고 귀한 자식을 낳아 가정이 무탈하고 득세할 수 있는 기운을 불어넣습니다.', imgRed: './assets/amulets/화목창성생자부_red.png', imgGold: './assets/amulets/화목창성생자부_gold.png', matchKeywords: ['family'], scoreCondition: 'high' },
    { id: 'l4', category: 'love', title: '인연부', shortDesc: '원하는 상대와 좋은 결실 기원', longDesc: '두 사람의 노력과 운이 조화되도록 도와, 짝사랑, 연애, 결혼 등 간절히 원하는 인연이 이루어지도록 돕습니다.', imgRed: './assets/amulets/인연부_red.png', imgGold: './assets/amulets/인연부_gold.png', matchKeywords: ['love_new'], scoreCondition: 'high' },
    { id: 'l5', category: 'love', title: '구도선인부', shortDesc: '사람들에게 인기를 얻길 기원', longDesc: '만인의 관심과 이목을 끌어 나를 찾는 사람이 많아지게 하며, 대인관계 개선 및 인기를 얻고 싶을 때 사용합니다.', imgRed: './assets/amulets/구도선인부_red.png', imgGold: './assets/amulets/구도선인부_gold.png', matchKeywords: ['love_new'], scoreCondition: 'low' },

    // ── 사업/취업 ──
    { id: 'b1', category: 'business', title: '관재구설부', shortDesc: '시비, 소송, 구설수 방지', longDesc: '사업 시 발생하는 위기나 의도치 않은 언행으로 인한 관재구설 불이익을 막고 긍정적 상황을 만듭니다.', imgRed: './assets/amulets/관재구설부_red.png', imgGold: './assets/amulets/관재구설부_gold.png', matchKeywords: ['business'], scoreCondition: 'low' },
    { id: 'b2', category: 'business', title: '임관부', shortDesc: '직장을 얻어 출세하길 기원', longDesc: '갈수록 어려워지는 취업, 이직 문턱에서 원하는 직장이나 업무를 얻을 수 있도록 좋은 기운을 담은 부적입니다.', imgRed: './assets/amulets/임관부_red.png', imgGold: './assets/amulets/임관부_gold.png', matchKeywords: ['job'], scoreCondition: 'all' },
    { id: 'b3', category: 'business', title: '치백사부', shortDesc: '계획한 일이 잘 해결되길 기원', longDesc: '자영업 및 사업 과정에서 발생하는 위기를 극복하고, 백가지 일이 순조롭게 잘 풀리도록 돕습니다.', imgRed: './assets/amulets/치백사부_red.png', imgGold: './assets/amulets/치백사부_gold.png', matchKeywords: ['business'], scoreCondition: 'high' },

    // ── 건강 ──
    { id: 'h1', category: 'health', title: '사고방지부', shortDesc: '각종 사고 예방 및 피해 방지', longDesc: '화재, 수해, 자동차 사고 등 예기치 못하게 발생하는 순간적인 사고를 막고 피해를 최소화하도록 보호합니다.', imgRed: './assets/amulets/사고방지부_red.png', imgGold: './assets/amulets/사고방지부_gold.png', matchKeywords: ['health', 'protect'], scoreCondition: 'high' },
    { id: 'h2', category: 'health', title: '경문부', shortDesc: '외적 모습의 개선 기원', longDesc: '외면의 화려함을 표출하게 도와 외적으로 돋보이게 하며, 대화나 대인관계의 폭과 깊이도 긍정적으로 만들어 줍니다.', imgRed: './assets/amulets/경문부_red.png', imgGold: './assets/amulets/경문부_gold.png', matchKeywords: ['health'], scoreCondition: 'all' },
    { id: 'h3', category: 'health', title: '침아고질부', shortDesc: '질병을 물리치고 건강 기원', longDesc: '치료를 받아도 낫지 않던 고질병이나 질환에서 벗어나 건강함을 회복하고 억압된 기운에서 해방되도록 돕습니다.', imgRed: './assets/amulets/침아고질부_red.png', imgGold: './assets/amulets/침아고질부_gold.png', matchKeywords: ['health'], scoreCondition: 'low' },

    // ── 액막이/소원 ──
    { id: 'u1', category: 'luck', title: '인동살소멸부', shortDesc: '조상의 안 좋은 업보 차단', longDesc: '애정, 금전, 건강 등을 가로막는 조상의 안 좋은 기운(인동살)과 업보를 소멸시키고 후손의 안녕을 기원합니다.', imgRed: './assets/amulets/인동살소멸부_red.png', imgGold: './assets/amulets/인동살소멸부_gold.png', matchKeywords: ['protect'], scoreCondition: 'low' },
    { id: 'u2', category: 'luck', title: '제삼재팔난부', shortDesc: '삼재와 액운 방지 기원', longDesc: '9년 주기의 삼재를 면하게 해주고, 주변 사람에게까지 미치는 악영향과 액운을 쳐냅니다.', imgRed: './assets/amulets/제삼재팔난부_red.png', imgGold: './assets/amulets/제삼재팔난부_gold.png', matchKeywords: ['protect'], scoreCondition: 'low' },
    { id: 'u3', category: 'luck', title: '만사형통부', shortDesc: '모든 일이 뜻대로 이루어지길 기원', longDesc: '겪고 있는 어려움을 벗어나 계획하는 모든 일에 안 좋은 기운을 물리치고 좋은 기운을 깊게 받아 무탈하길 기원합니다.', imgRed: './assets/amulets/만사형통부_red.png', imgGold: './assets/amulets/만사형통부_gold.png', matchKeywords: ['wish'], scoreCondition: 'all' },

    // ── 학업 ──
    { id: 's1', category: 'study', title: '관대부', shortDesc: '학업운이 트이길 기원', longDesc: '수능, 자격증 등 다양한 시험 운이 트여 합격하고, 이를 통해 사회로 성공적으로 진출할 수 있도록 돕습니다.', imgRed: './assets/amulets/관대부_red.png', imgGold: './assets/amulets/관대부_gold.png', matchKeywords: ['study'], scoreCondition: 'all' }
];
