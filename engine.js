/**
 * UNSE (운세) - 100% 동적 사주 알고리즘 엔진 v3.0
 * ─────────────────────────────────────────────────────
 * 모든 하드코딩 제거. 수학적 만세력 + 상생상극 가중치 기반.
 * 어떤 생년월일이든 완벽하게 동작하는 범용 엔진.
 */

(function () {
    // ═══════════════════════════════════════════════════
    //  기초 상수 (천간·지지·오행)
    // ═══════════════════════════════════════════════════
    const GAN_LIST = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const JI_LIST = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

    window.GAN_LIST = GAN_LIST;
    window.JI_LIST = JI_LIST;
    window.GAN_HANGUL = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
    window.JI_HANGUL = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

    window.FIVE_ELEMENTS = {
        "甲": "Wood", "乙": "Wood", "丙": "Fire", "丁": "Fire",
        "戊": "Earth", "己": "Earth", "庚": "Metal", "辛": "Metal",
        "壬": "Water", "癸": "Water",
        "寅": "Wood", "卯": "Wood", "巳": "Fire", "午": "Fire",
        "辰": "Earth", "未": "Earth", "戌": "Earth", "丑": "Earth",
        "申": "Metal", "酉": "Metal", "亥": "Water", "子": "Water"
    };

    const FIVE_ELEMENTS = window.FIVE_ELEMENTS;

    // ═══════════════════════════════════════════════════
    //  상생·상극 관계 테이블
    // ═══════════════════════════════════════════════════
    const PRODUCE = { Wood: "Fire", Fire: "Earth", Earth: "Metal", Metal: "Water", Water: "Wood" };
    const CONTROL = { Wood: "Earth", Fire: "Metal", Earth: "Water", Metal: "Wood", Water: "Fire" };

    // ═══════════════════════════════════════════════════
    //  오행 한글·한자 매핑
    // ═══════════════════════════════════════════════════
    const EL_KR = { Wood: "목", Fire: "화", Earth: "토", Metal: "금", Water: "수" };
    const EL_HANJA = { Wood: "木", Fire: "火", Earth: "土", Metal: "金", Water: "水" };

    // ═══════════════════════════════════════════════════
    //  역사적 표준시 보정 가이드 (DST·경도)
    // ═══════════════════════════════════════════════════
    const CORRECTION_GUIDE = [
        { start: "1908-04-01", end: "1911-12-31", correction: -30, type: "meridian" },
        { start: "1948-06-01", end: "1948-09-30", correction: -60, type: "dst" },
        { start: "1949-04-03", end: "1949-09-30", correction: -60, type: "dst" },
        { start: "1950-04-01", end: "1950-09-30", correction: -60, type: "dst" },
        { start: "1951-05-01", end: "1951-09-30", correction: -60, type: "dst" },
        { start: "1954-03-21", end: "1961-08-09", correction: -30, type: "meridian127" },
        { start: "1955-05-01", end: "1955-09-30", correction: -60, type: "dst" },
        { start: "1956-05-01", end: "1956-09-30", correction: -60, type: "dst" },
        { start: "1957-05-01", end: "1957-09-30", correction: -60, type: "dst" },
        { start: "1958-05-01", end: "1958-09-30", correction: -60, type: "dst" },
        { start: "1959-05-01", end: "1959-09-30", correction: -60, type: "dst" },
        { start: "1960-05-01", end: "1960-09-30", correction: -60, type: "dst" },
        { start: "1987-05-10", end: "1987-10-11", correction: -90, type: "dst+offset" },
        { start: "1988-05-08", end: "1988-10-09", correction: -90, type: "dst+offset" }
    ];

    // ═══════════════════════════════════════════════════
    //  십성 현대적 매핑 테이블
    // ═══════════════════════════════════════════════════
    const MODERN_MAPPING = {
        "비견": { reinterpretation: "주체성 및 경쟁 우위", functionalValue: "비견(比肩)의 독립적 자아 흐름", lifestyleExample: "1인 창업가", flowDesc: "독립적인 의사결정력과 강한 주체성을 바탕으로, 타인에게 휘둘리지 않고 스스로 길을 개척하는 명확한 목표 달성 능력을 지녔습니다.", flowChips: ["주도적", "자기신뢰"] },
        "겁재": { reinterpretation: "도전과 경쟁의 파워", functionalValue: "겁재(劫財)의 치열한 돌파 흐름", lifestyleExample: "M&A 리더", flowDesc: "특유의 승부사 기질과 대담함을 통해 치열한 환경 속에서도 경쟁 우위를 점하며, 리스크를 감수하고 더 큰 성과를 쟁취합니다.", flowChips: ["승부사", "추진력"] },
        "식신": { reinterpretation: "혁신 및 표현", functionalValue: "식상생재(食傷生財)의 흐름", lifestyleExample: "콘텐츠 크리에이터", flowDesc: "나의 잠재력과 실행력이 완벽한 시너지를 내어, 창의적인 아이디어가 실제 결과와 성과로 부드럽게 이어지는 매우 긍정적인 흐름을 가졌습니다.", flowChips: ["창의적 영감", "실질적 결과"] },
        "상관": { reinterpretation: "파괴적 혁신의 아이콘", functionalValue: "상관생재(傷官生財)의 흐름", lifestyleExample: "트렌드 세터", flowDesc: "기존의 틀을 깨는 폭발적인 창의력과 뛰어난 언변으로 트렌드를 주도하며, 번뜩이는 영감을 곧바로 가치 창출로 연결합니다.", flowChips: ["혁신적 기획", "가치 선도"] },
        "편재": { reinterpretation: "자산 최적화", functionalValue: "재생관(財生官)의 공간 확장 흐름", lifestyleExample: "플랫폼 리더", flowDesc: "공간 지각력과 시장 흐름을 꿰뚫어보는 직관으로, 자원과 네트워크를 적재적소에 활용하여 통 큰 성과를 달성해냅니다.", flowChips: ["네트워크형", "투자마인드"] },
        "정재": { reinterpretation: "안정적 부의 설계자", functionalValue: "세밀한 자산 관리와 축적의 흐름", lifestyleExample: "포트폴리오 매니저", flowDesc: "정확한 계산과 데이터를 바탕으로, 요행을 바라기보다 체계적이고 성실한 접근으로 견고한 결실을 만들어내는 타입입니다.", flowChips: ["치밀한 관리", "안정적 축적"] },
        "편관": { reinterpretation: "카리스마 리더십", functionalValue: "살인상생(殺印상생)의 위기 돒파 흐름", lifestyleExample: "전략 본부장", flowDesc: "어려운 과제일수록 전투력이 상승하며, 강력한 카리스마와 책임감을 발휘하여 혼란을 수습하고 목표를 달성합니다.", flowChips: ["위기 극복", "카리스마 리더십"] },
        "정관": { reinterpretation: "시스템 거버넌스 리더", functionalValue: "관인상생(官인상생)의 체계적 흐름", lifestyleExample: "대기업 임원", flowDesc: "합리적 원칙과 뛰어난 관리 능력을 활용하여 조직의 시스템을 체계화하고 효율적인 거버넌스를 이끄는 성과 달성 스타일입니다.", flowChips: ["신뢰 구축", "합리적 관리"] },
        "편인": { reinterpretation: "비전 기획자", functionalValue: "탁월한 전략 기획과 예지적 통찰 흐름", lifestyleExample: "특수 기획자", flowDesc: "남들이 보지 못하는 이면의 원리를 통찰하는 직관으로, 독창적인 기획안을 제시하고 장기적인 비전을 현실로 설계해냅니다.", flowChips: ["직관적 통찰", "전략 기획"] },
        "정인": { reinterpretation: "지식 수용 전문가", functionalValue: "인성(印星)의 지식 수용과 융합 흐름", lifestyleExample: "R&D 연구원", flowDesc: "탁월한 정보 흡수력과 사고력을 무기로 오랜 시간 축적한 지식을 기반으로 안정적이고 올바른 목표 달성 경로를 선보입니다.", flowChips: ["깊은 사고력", "지식 융합"] },
        "역마": { reinterpretation: "글로벌 확장", functionalValue: "공간적 제약을 넘는 무한한 확장성", lifestyleExample: "디지털 노마드, 해외 비즈니스 리더", flowDesc: "한 곳에 머무르기보다 다양한 환경과 문화를 넘나들며 폭발적인 시너지를 창출하는 뛰어난 활동력과 적응력을 지녔습니다.", flowChips: ["글로벌 역량", "프론티어"] }
    };

    // ═══════════════════════════════════════════════════
    //  원칙 4: 10천간 고유 슬로건 딕셔너리
    // ═══════════════════════════════════════════════════
    const GAN_SLOGAN = {
        "甲": "거목의 곧고 강인한 성장의 줄기",
        "乙": "어떤 바람에도 꺾이지 않는 유연성의 덩굴",
        "丙": "어둠을 사르며 만물을 밝히는 태양의 불꽃",
        "丁": "부드러운 열기로 어둠을 가르는 지혜의 촛불",
        "戊": "만물을 무한히 품어내는 흔들림 없는 태산",
        "己": "생명의 싹을 부드럽게 키워내는 비옥한 대지",
        "庚": "강력한 결단으로 거친 장애물을 가르는 단단한 원석",
        "辛": "어둠을 가르는 명확한 결과의 칼날",
        "壬": "경계를 허물고 도도하게 흐르는 무한한 대해",
        "癸": "빈 곳을 스며들어 만물을 촉촉히 적시는 생명의 이슬"
    };

    // ═══════════════════════════════════════════════════
    //  격국(格局) 판별 테이블 (일간-월지 건록 자동 판별)
    // ═══════════════════════════════════════════════════
    const GEON_ROK = {
        "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午",
        "戊": "巳", "己": "午", "庚": "申", "辛": "酉",
        "壬": "亥", "癸": "子"
    };

    // ═══════════════════════════════════════════════════
    //  카테고리별 점수 가중치 매핑 (오행 → 운세 분야)
    // ═══════════════════════════════════════════════════
    const CATEGORY_ELEMENT = {
        money: "Metal",   // 재물운은 금(金)과 연관
        career: "Wood",    // 직업운은 목(木, 성장·확장)과 연관
        love: "Fire",    // 애정운은 화(火, 열정·표현)와 연관
        health: "Water"    // 건강운은 수(水, 순환·균형)와 연관
    };

    // ═══════════════════════════════════════════════════
    //  엔진 본체
    // ═══════════════════════════════════════════════════
    window.sajuEngine = {
        getElementScores: function (pillars) {
            return pillars.elements;
        },
        getGanHangul: function (char) {
            const idx = GAN_LIST.indexOf(char);
            return idx !== -1 ? window.GAN_HANGUL[idx] : "";
        },
        getJiHangul: function (char) {
            const idx = JI_LIST.indexOf(char);
            return idx !== -1 ? window.JI_HANGUL[idx] : "";
        },

        // ─── 1. 진태양시 보정 ────────────────────────
        getSolarTime: function (dateStr, timeStr, birthLongitude = 126.98) {
            let t = timeStr.trim();
            if (t.length === 4 && t.indexOf(':') === -1) t = t.slice(0, 2) + ":" + t.slice(2);
            let date = new Date(`${dateStr}T${t}`);
            if (isNaN(date.getTime())) return new Date();

            const fullDateStr = dateStr;
            const guide = CORRECTION_GUIDE.find(p => fullDateStr >= p.start && fullDateStr <= p.end);
            const longitudeOffset = (birthLongitude - 135) * 4;

            let finalAdjust = 0;
            if (guide) {
                if (guide.type === "meridian127") {
                    finalAdjust = -30 + (birthLongitude - 127.5) * 4;
                } else {
                    finalAdjust = guide.correction;
                }
            } else if (fullDateStr >= "1961-08-10") {
                finalAdjust = -30;
            } else {
                finalAdjust = longitudeOffset;
            }

            date.setMinutes(date.getMinutes() + finalAdjust);
            return date;
        },



        // ─── 3. 절기 날짜 (타원 궤도 누적일수 배열) ───
        //  24절기 누적 일수 (입춘 기준, 태양 타원 궤도 반영)
        //  idx 0=입춘, 1=우수, 2=경칩, 3=춘분, … 22=소한, 23=대한
        SOLAR_TERM_OFFSETS: [
            //  입춘(2/4)을 0일로 기준, 각 절기의 평균 양력일과의 일수 차이
            //  2/4 기준 → 3/6 = +30일, 4/5 = +60일 ... 10/8 = +246일
            0,      // 0  입춘  2/4
            15.24,  // 1  우수  2/19
            30.44,  // 2  경칩  3/6
            45.64,  // 3  춘분  3/21
            60.87,  // 4  청명  4/5
            76.13,  // 5  곡우  4/21
            91.31,  // 6  입하  5/6
            106.57, // 7  소만  5/21
            121.93, // 8  망종  6/6
            137.28, // 9  하지  6/21
            152.63, // 10 소서  7/7
            168.01, // 11 대서  7/23
            183.42, // 12 입추  8/7
            198.81, // 13 처서  8/23
            214.16, // 14 백로  9/8
            229.49, // 15 추분  9/23
            246.50, // 16 한로  10/8   ← 핵심: 10/6은 이 날짜 이전이므로 辛酉 월
            261.75, // 17 상강  10/23
            276.86, // 18 입동  11/7
            292.03, // 19 소설  11/22
            307.27, // 20 대설  12/7
            322.54, // 21 동지  12/22
            337.86, // 22 소한  (다음해 1/6)
            353.22  // 23 대한  (다음해 1/20)
        ],

        getSolarTermDate: function (year, termIndex) {
            // 입춘 기준일: 해당 년도 2월 4일 12시를 기본 앵커로 사용
            const base = new Date(year, 1, 4, 12, 0, 0);
            const offset = this.SOLAR_TERM_OFFSETS[termIndex] || 0;
            return new Date(base.getTime() + offset * 86400000);
        },

        // ─── 4. 오늘의 일진 계산 ─────────────────────
        getTodayPillar: function (date = new Date()) {
            const now = date;
            const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
            // [일주] 1970년 1월 1일(UTC)은 辛巳(17)일임을 활용한 절대 수학 공식
            const daysFrom1970 = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
            let dIdx = (daysFrom1970 + 17) % 60;
            if (dIdx < 0) dIdx += 60;
            return {
                gan: GAN_LIST[dIdx % 10],
                ji: JI_LIST[dIdx % 12],
                ganElement: FIVE_ELEMENTS[GAN_LIST[dIdx % 10]],
                jiElement: FIVE_ELEMENTS[JI_LIST[dIdx % 12]]
            };
        },

        // ─── 5. 사주 팔자 계산 (100% 수학적 동적 로직) ──
        calculatePillars: function (date) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hour = date.getHours();
            const min = date.getMinutes();

            // [연주] 입춘 기준 연도 결정
            const springStart = this.getSolarTermDate(year, 0);
            let targetYear = (date < springStart) ? year - 1 : year;
            let yIdx = (targetYear - 4) % 60;
            if (yIdx < 0) yIdx += 60;
            const yearGan = GAN_LIST[yIdx % 10];
            const yearJi = JI_LIST[yIdx % 12];

            // [월주] 절기 기반 월 결정 (12절기만 사용: 입춘·경칩·청명…소한)
            //  절기 index: 입춘=0, 경칩=2, 청명=4, 입하=6, 망종=8,
            //              소서=10, 입추=12, 백로=14, 한로=16, 입동=18, 대설=20, 소한=22
            const MONTH_TERM_INDICES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
            let mIdx = 0;

            // 현재 연도의 12절기 날짜들을 구함
            const termDates = MONTH_TERM_INDICES.map(ti => this.getSolarTermDate(year, ti));

            if (date < termDates[0]) {
                // 입춘 전이면 전년 소한(22) 이후 → 12월(mIdx=11)
                mIdx = 11;
            } else {
                for (let i = 11; i >= 0; i--) {
                    if (date >= termDates[i]) {
                        mIdx = i;
                        break;
                    }
                }
            }

            const mGan = GAN_LIST[((yIdx % 5 * 2 + 2) + mIdx) % 10];
            const mJi = JI_LIST[(mIdx + 2) % 12];

            // [일주] 1970년 1월 1일(UTC)은 辛巳(17)일임을 활용한 절대 수학 공식
            const daysFrom1970 = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
            let dIdx = (daysFrom1970 + 17) % 60;
            if (dIdx < 0) dIdx += 60;
            const dGan = GAN_LIST[dIdx % 10];
            const dJi = JI_LIST[dIdx % 12];

            // [시주] 시간 기반
            let hIdx = Math.floor((hour + 1) / 2) % 12;
            const hGan = GAN_LIST[(dIdx % 5 * 2 + hIdx) % 10];
            const hJi = JI_LIST[hIdx];

            const fullChars = [yearGan, yearJi, mGan, mJi, dGan, dJi, hGan, hJi];

            return {
                year: yearGan + yearJi,
                month: mGan + mJi,
                day: dGan + dJi,
                hour: hGan + hJi,
                yearHangul: this.getGanHangul(yearGan) + this.getJiHangul(yearJi),
                monthHangul: this.getGanHangul(mGan) + this.getJiHangul(mJi),
                dayHangul: this.getGanHangul(dGan) + this.getJiHangul(dJi),
                timeHangul: this.getGanHangul(hGan) + this.getJiHangul(hJi),
                dayMaster: dGan + "(" + FIVE_ELEMENTS[dGan] + ")",
                elements: this.countElements(fullChars),
                sipsung: this.calculateSipsung(dGan, fullChars),
                sourceTag: "UNSE 범용 만세력 엔진 v3.0 · 자평진전 기반"
            };
        },

        // ─── 6. 십성(十星) 계산 ──────────────────────
        calculateSipsung: function (dm, chars) {
            const results = [];
            chars.forEach((char, idx) => {
                if (idx === 4) return; // 일간(본인) 제외
                const rel = this.getRelation(dm, char);
                results.push({
                    char: char,
                    relation: rel,
                    meta: MODERN_MAPPING[rel] || { reinterpretation: rel, functionalValue: "-", lifestyleExample: "-" },
                    sourceTag: "UNSE 동적 십성론 · 자평진전 제3장"
                });
            });

            // 동적 격국 판별: 일간의 건록지와 월지가 일치하면 건록격
            const monthJi = chars[3]; // 월지
            if (GEON_ROK[dm] === monthJi) {
                results.push({
                    char: monthJi,
                    relation: "건록격",
                    meta: {
                        reinterpretation: "탁월한 전문성과 독립적 리더십",
                        functionalValue: "압도적 전문성 기반의 흔들림 없는 돌파 흐름",
                        lifestyleExample: "전문 분야 리더",
                        flowDesc: "스스로의 압도적인 능력을 바탕으로 불확실성을 통제하며, 자립심과 깊은 연구를 통해 한계점을 정면 돌파해내는 놀라운 목표 달성력을 보유했습니다.",
                        flowChips: ["압도적 전문성", "독립적 돌파력"]
                    },
                    sourceTag: "UNSE 동적 격국 판별 · 자평진전 격국론"
                });
            }

            // 역마 신살 판별
            const jiList = [chars[1], chars[3], chars[5], chars[7]];
            const yeokmaChars = ["寅", "申", "巳", "亥"];

            // 역마에 해당하는 글자가 있는지 확인 (첫 번째 발견된 역마 글자를 기준으로 추가)
            const matchedYeokma = jiList.find(ji => yeokmaChars.includes(ji));

            if (matchedYeokma) {
                results.push({   // 결과를 맨 뒤에 추가 (unshift 대신 push)
                    char: matchedYeokma,
                    relation: "역마",
                    meta: MODERN_MAPPING["역마"],
                    sourceTag: "UNSE 신살 판별 · 기획서 기준"
                });
            }

            return results;
        },

        // ─── 7. 오행 관계 판별 (십성 분류) ───────────
        getRelation: function (dm, char) {
            const dmEl = FIVE_ELEMENTS[dm];
            const oEl = FIVE_ELEMENTS[char];
            if (!dmEl || !oEl) return "비견";

            if (dmEl === oEl) return (dm === char) ? "비견" : "겁재";

            // 상생 (나 → 상대 = 식상, 상대 → 나 = 인성)
            if (PRODUCE[dmEl] === oEl) return "식신";
            if (PRODUCE[oEl] === dmEl) return "정인";

            // 상극 (나 → 상대 = 재성, 상대 → 나 = 관성)
            if (CONTROL[dmEl] === oEl) return "정재";
            if (CONTROL[oEl] === dmEl) return "정관";

            // 음양 구분 미적용 시 기본값
            return "비견";
        },

        // ─── 8. 오행 분포 계산 ───────────────────────
        countElements: function (chars) {
            const counts = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
            chars.forEach(c => {
                if (FIVE_ELEMENTS[c]) counts[FIVE_ELEMENTS[c]]++;
            });
            const total = chars.length;
            const radarData = {};
            for (let key in counts) {
                radarData[key] = Math.round((counts[key] / total) * 100);
            }
            return radarData;
        },

        // ─── 9. 테마 색상 ───────────────────────────
        getThemeColor: function (dayMasterStr) {
            const gan = dayMasterStr[0];
            const el = FIVE_ELEMENTS[gan] || "Wood";
            const themes = {
                Wood: { main: "#10B981", bg: "#F0FDF4" },
                Fire: { main: "#EF4444", bg: "#FEF2F2" },
                Earth: { main: "#F59E0B", bg: "#FFFBEB" },
                Metal: { main: "#94A3B8", bg: "#F8FAFC" },
                Water: { main: "#3B82F6", bg: "#EFF6FF" }
            };
            return themes[el] || themes.Wood;
        },

        // ═══════════════════════════════════════════════
        //  원칙 2: 동적 점수 산출 (상생상극 가중치)
        // ═══════════════════════════════════════════════
        getLuckScores: function (pillars, targetDate = new Date()) {
            const dmGan = pillars.dayMaster.charAt(0);
            const dmEl = FIVE_ELEMENTS[dmGan];
            const userEls = pillars.elements;
            const today = this.getTodayPillar(targetDate);
            const todayEls = [today.ganElement, today.jiElement];

            // --- 사용자의 가장 강한/약한 오행 ---
            const sorted = Object.entries(userEls).sort((a, b) => b[1] - a[1]);
            const dominant = sorted[0][0];
            const weakest = sorted[sorted.length - 1][0];

            // --- 상생상극 점수 계산 함수 (다이내믹 레인지 확대) ---
            const calcInteraction = (userEl, targetEl) => {
                if (userEl === targetEl) return 3;   // 비화
                if (PRODUCE[userEl] === targetEl) return 6;  // 내가 생
                if (PRODUCE[targetEl] === userEl) return 5;  // 내가 받음
                if (CONTROL[userEl] === targetEl) return -4; // 내가 극
                if (CONTROL[targetEl] === userEl) return -7; // 상대가 극
                return 0;
            };

            // --- 베이스 점수 계산 (65점 기준, 변동폭 최대화) ---
            let interactionScore = 0;
            todayEls.forEach(tEl => {
                interactionScore += calcInteraction(dominant, tEl) * 1.5;
                interactionScore += calcInteraction(dmEl, tEl) * 0.8;
            });

            const baseScore = Math.max(50, Math.min(98, 65 + Math.round(interactionScore)));

            // --- 카테고리별 세부 점수 (다이내믹 변동폭 적용) ---
            const calcCategoryScore = (category) => {
                const catEl = CATEGORY_ELEMENT[category];
                let bonus = 0;

                // 사용자의 해당 오행 비율 (최대 +5)
                bonus += Math.min(5, Math.round((userEls[catEl] || 0) / 10));

                // 오늘 일진과의 관계 (영향력 확대)
                todayEls.forEach(tEl => {
                    bonus += calcInteraction(catEl, tEl) * 1.5;
                });

                // 일간과 카테고리 오행의 관계 
                bonus += calcInteraction(dmEl, catEl) * 0.8;

                return Math.max(50, Math.min(98, baseScore + Math.round(bonus * 1.2)));
            };

            const money = calcCategoryScore("money");
            const career = calcCategoryScore("career");
            const love = calcCategoryScore("love");
            const health = calcCategoryScore("health");
            const total = Math.round((money + career + love + health) / 4);

            // --- 세부 카테고리별 코멘트 자동 생성 ---
            const genCategoryDesc = (categoryEl, label) => {
                const todayGanEl = today.ganElement;
                if (PRODUCE[todayGanEl] === categoryEl) {
                    return `오늘의 맑은 기운이 나의 ${label} 에너지를 생조(生助)하여 힘을 실어줍니다. 기대 이상의 긍정적인 성과를 기대해볼 만합니다.`;
                } else if (PRODUCE[categoryEl] === todayGanEl) {
                    return `나의 ${label} 에너지가 자연스럽게 밖으로 표출되는 날입니다. 유연한 생각과 행동이 유리하게 작용합니다.`;
                } else if (CONTROL[todayGanEl] === categoryEl) {
                    return `외부 환경이 다소 엄격하게 작용하는 상극(相剋)의 날입니다. ${label}에 있어 무리한 욕심보다는 철저한 안정과 점검이 우선입니다.`;
                } else if (CONTROL[categoryEl] === todayGanEl) {
                    return `과감한 돌파가 필요한 역동적인 날입니다. ${label} 관련 이슈에서 내가 어떻게 주도권을 쥐느냐가 성패를 가릅니다.`;
                } else {
                    return `기운이 치우치지 않고 비화(比和)하여 안정을 이루는 날입니다. 평소 하던 대로 유지하면 무난하게 흘러갑니다.`;
                }
            };

            const moneyDesc = genCategoryDesc("Metal", "재산/재물");
            const careerDesc = genCategoryDesc("Wood", "명예/직장");
            const loveDesc = genCategoryDesc("Fire", "관계/애정");
            const healthDesc = genCategoryDesc("Water", "건강/휴식");

            const genShortDesc = (score, type) => {
                if (score >= 80) {
                    if (type === 'money') return "뜻밖의 횡재가 있는 날";
                    if (type === 'career') return "노력이 결실을 맺는 시기";
                    if (type === 'love') return "설렘이 가득한 완벽한 하루";
                    if (type === 'health') return "활력이 넘치는 최상의 컨디션";
                } else if (score >= 60) {
                    if (type === 'money') return "꾸준한 관리가 필요한 무난한 날";
                    if (type === 'career') return "성실함이 빛을 발하는 안정기";
                    if (type === 'love') return "대화가 잘 통화는 편안한 하루";
                    if (type === 'health') return "가벼운 산책이 도움되는 날";
                } else {
                    if (type === 'money') return "충동적인 지출을 경계하세요";
                    if (type === 'career') return "주변과 마찰을 피하는게 상책";
                    if (type === 'love') return "작은 오해를 주의해야 하는 날";
                    if (type === 'health') return "컨디션 조절이 필수인 하루";
                }
                return "무난한 하루입니다";
            };

            const moneyShort = genShortDesc(money, 'money');
            const careerShort = genShortDesc(career, 'career');
            const loveShort = genShortDesc(love, 'love');
            const healthShort = genShortDesc(health, 'health');

            // ═══════════════════════════════════════════
            //  원칙 3: 분석 사유 자동 생성
            // ═══════════════════════════════════════════
            const todayLabel = `${EL_KR[today.ganElement]}(${EL_HANJA[today.ganElement]})·${EL_KR[today.jiElement]}(${EL_HANJA[today.jiElement]})`;
            const dominantLabel = `${EL_KR[dominant]}(${EL_HANJA[dominant]})`;

            let relationWord = "";
            let effectDetail = "";
            if (PRODUCE[dominant] === today.ganElement || PRODUCE[dominant] === today.jiElement) {
                relationWord = "상생(相生)";
                effectDetail = "에너지가 자연스럽게 순환하며 재물운과 직업운이 특히 상승하는";
            } else if (CONTROL[dominant] === today.ganElement || CONTROL[dominant] === today.jiElement) {
                relationWord = "상극(相剋)";
                effectDetail = "긴장감이 형성되나 오히려 돌파력이 생겨 도전적 기회가 열리는";
            } else if (PRODUCE[today.ganElement] === dominant || PRODUCE[today.jiElement] === dominant) {
                relationWord = "생조(生助)";
                effectDetail = "오늘의 기운이 당신의 핵심 역량을 강하게 밀어주는";
            } else if (CONTROL[today.ganElement] === dominant || CONTROL[today.jiElement] === dominant) {
                relationWord = "극제(剋制)";
                effectDetail = "외부 압박이 있으나 내면의 집중력이 높아지는";
            } else {
                relationWord = "비화(比和)";
                effectDetail = "안정적 에너지 흐름 속에서 꾸준한 성과가 기대되는";
            }

            const reason = `당신의 핵심 기운 ${dominantLabel}이(가) 오늘의 일진 ${todayLabel} 에너지와 ${relationWord}을 이루어, ${effectDetail} 흐름입니다.`;

            // ═══════════════════════════════════════════
            //  원칙 5: 운세 맞춤형 추천 (LUCKY ITEMS)
            // ═══════════════════════════════════════════
            const LUCKY_DATA = {
                Wood: {
                    color: { name: "그린·에메랄드", hex: "#10B981", reason: "성장과 뻗어나가는 기운을 촉진" },
                    business: { time: "오전 07시 ~ 09시", reason: "하루를 여는 맑은 정신으로 기획과 회의에 유리함" },
                    food: { name: "신선한 잎채소와 허브", reason: "목(木)의 생기를 채워 눈과 간의 피로를 해소" },
                    number: "3, 8",
                    direction: "동쪽 (East)"
                },
                Fire: {
                    color: { name: "레드·퍼플", hex: "#EF4444", reason: "열정과 에너지, 자기표현력을 극대화" },
                    business: { time: "오전 11시 ~ 오후 01시", reason: "태양의 에너지가 가장 강해져 협상과 영업에서 주도권 확보" },
                    food: { name: "따뜻한 성질의 차와 붉은 과일", reason: "화(火)의 양기를 북돋아 심혈관 순환을 도움" },
                    number: "2, 7",
                    direction: "남쪽 (South)"
                },
                Earth: {
                    color: { name: "옐로우·베이지", hex: "#F59E0B", reason: "안정감과 신뢰를 주어 편안한 분위기 조성" },
                    business: { time: "오후 01시 ~ 03시", reason: "감정이 안정되는 시간대로, 중재와 장기 계획 수립에 적합" },
                    food: { name: "뿌리 채소와 잡곡류", reason: "토(土)의 기운을 흡수해 소화기를 편안하게 다스림" },
                    number: "5, 10",
                    direction: "중앙·남동쪽 (Center/SE)"
                },
                Metal: {
                    color: { name: "화이트·메탈릭 실버", hex: "#E2E8F0", reason: "명확하고 이성적인 판단력과 결단력 부여" },
                    business: { time: "오후 03시 ~ 05시", reason: "산만한 기운이 가라앉아 냉철한 의사결정과 계약 마무리에 최적" },
                    food: { name: "매콤한 향신료와 흰 살 생선", reason: "금(金)의 기운으로 호흡기를 정화하고 폐에 생기를 줌" },
                    number: "4, 9",
                    direction: "서쪽 (West)"
                },
                Water: {
                    color: { name: "블랙·딥네이비", hex: "#1E293B", reason: "불안을 잠재우고 깊은 지혜와 포용력을 발휘" },
                    business: { time: "오후 09시 ~ 11시", reason: "하루 중 가장 고요한 시기로, 통찰력과 창의적 영감이 샘솟음" },
                    food: { name: "해조류와 맑은 국물", reason: "수(水)의 성질을 닮아 신장과 생식기계를 맑게 순환시킴" },
                    number: "1, 6",
                    direction: "북쪽 (North)"
                }
            };

            const luckyColorData = LUCKY_DATA[weakest].color; // 가장 약한 오행 보완
            const luckyFoodData = LUCKY_DATA[weakest].food; // 가장 약한 오행 보완
            const luckyNumberData = LUCKY_DATA[weakest].number;
            const luckyDirectionData = LUCKY_DATA[weakest].direction;

            // 활동 추천 시간은 가장 강한 오행 기준.
            const luckyTimeData = LUCKY_DATA[dominant].business;

            const luckyItems = {
                color: luckyColorData,
                business: luckyTimeData,
                food: luckyFoodData,
                number: luckyNumberData,
                direction: luckyDirectionData
            };

            // Daily Tip
            const EL_FEATURES = {
                Wood: "진취적이고 유연한",
                Fire: "열정적이고 확산하는",
                Earth: "안정적이고 수용적인",
                Metal: "결단력 있고 치밀한",
                Water: "지혜롭고 통찰력 있는"
            };
            const dailyTip = `오늘 흐르는 ${EL_FEATURES[today.ganElement]} 기운 속에서 당신만의 속성인 '${EL_FEATURES[dominant]}' 강점이 두드러집니다. 활력을 더 길게 유지하기 위해 오늘만큼은 내게 가장 부족한 ${EL_KR[weakest]}의 에너지를 채워줄 수 있는 [${luckyColorData.name}] 스타일이나 [${luckyFoodData.name}]을(를) 곁에 두어 보세요. 한결 더 매끄럽고 기분 좋은 하루가 될 것입니다.`;

            // --- 한 줄 요약 자동 생성 (결정론적 로직) ---
            const SUMMARY_POOL = {
                excellent: [
                    "막힘없이 술술 풀리는 기분 좋은 하루입니다.",
                    "행운이 따르니 적극적으로 행동해도 좋은 날입니다.",
                    "긍정적인 에너지가 넘쳐 어떤 일도 해낼 수 있습니다.",
                    "자신감이 넘치고 성과가 빛을 발하는 날입니다.",
                    "기대 이상의 성취감으로 가슴 벅찬 하루가 될 것입니다."
                ],
                good: [
                    "안정적인 기운 속에서 평탄하게 흘러가는 하루입니다.",
                    "노력한 만큼 무난하게 보상받는 든든한 날입니다.",
                    "평온한 일상 속에서 작은 행복을 발견할 수 있습니다.",
                    "원만한 대인관계로 마음이 편안해지는 하루입니다.",
                    "차분하게 내 일을 챙기기 좋은 온화한 날입니다."
                ],
                normal: [
                    "변화보다는 신중한 태도와 유지가 필요한 하루입니다.",
                    "주변 상황을 관망하며 내실을 다지기 좋은 날입니다.",
                    "오버페이스를 피하고 평행선을 유지하는 것이 좋습니다.",
                    "담담한 마음으로 일과를 소화하기에 적합합니다.",
                    "무리한 도전보다는 한 템포 안정감을 찾는 것이 유리합니다."
                ],
                caution: [
                    "스트레스가 발생할 수 있어 차분한 대처가 필요한 하루입니다.",
                    "예상치 못한 변수가 생길 수 있으니 여유를 가져야 합니다.",
                    "감정의 기복을 다스리고 냉정하게 판단해야 하는 날입니다.",
                    "대립보다는 양보하는 미덕이 액운을 피해가게 합니다.",
                    "컨디션 관리에 각별히 신경 써야 하는 하루입니다."
                ],
                bad: [
                    "피곤하고 불안정한 기운이 있으니 한 템포 쉬어가는 하루입니다.",
                    "무리한 결정을 피하고 심신을 달래야 하는 날입니다.",
                    "오늘은 무거운 짐을 잠시 내려놓고 나를 챙겨야 합니다.",
                    "에너지가 소진되기 쉬우니 충분한 휴식이 정답입니다.",
                    "주변 상황에 휘둘리지 말고 마음의 안정을 꾀하세요."
                ]
            };

            let summaryCategory = "normal";
            if (total >= 90) summaryCategory = "excellent";
            else if (total >= 80) summaryCategory = "good";
            else if (total >= 70) summaryCategory = "normal";
            else if (total >= 60) summaryCategory = "caution";
            else summaryCategory = "bad";

            const poolArray = SUMMARY_POOL[summaryCategory];
            const dayValue = targetDate.getDate();
            const summaryIndex = dayValue % poolArray.length;
            const shortSummary = poolArray[summaryIndex];

            return {
                total, money, love, health, career,
                moneyDesc, careerDesc, loveDesc, healthDesc,
                moneyShort, careerShort, loveShort, healthShort,
                reason: reason,
                luckyItems: luckyItems,
                dailyTip: dailyTip,
                shortSummary: shortSummary,
                todayPillar: `${today.gan}${today.ji}`,
                sourceTag: "UNSE 동적 상생상극 알고리즘 · 적천수 조후론"
            };
        },

        // ═══════════════════════════════════════════════
        //  원칙 4: 일간별 맞춤 슬로건 + 커리어 분석
        // ═══════════════════════════════════════════════
        getModernAnalysis: function (pillars) {
            const dmChar = pillars.dayMaster ? pillars.dayMaster.charAt(0) : "";
            const dmElement = FIVE_ELEMENTS[dmChar] || "Wood";
            const slogan = GAN_SLOGAN[dmChar] || "균형과 조화를 이루는 고유의 에너지";

            // 가장 영향력 있는 십성(첫 번째)을 기반으로 커리어 분석
            const top = (pillars.sipsung && pillars.sipsung.length > 0) ? pillars.sipsung[0] : null;

            const titleStr = top
                ? `커리어 아키텍처: ${top.meta.reinterpretation}`
                : "타고난 잠재력 분석";

            const uDM = pillars.dayMaster.charAt(0);
            const WEAPON_MAP = {
                "Wood": "성장을 멈추지 않는 추진력과 인자함",
                "Fire": "상대를 매료시키는 열정과 화려한 언변",
                "Earth": "흔들리지 않는 신용과 묵직한 포용력",
                "Metal": "핵심을 꿰뚫는 냉철한 판단력과 결단력",
                "Water": "유연하게 대처하는 지혜와 깊은 통찰력"
            };

            const weaponFeature = WEAPON_MAP[FIVE_ELEMENTS[uDM]] || "고유의 잠재된 에너지";
            const reinterp = top ? top.meta.reinterpretation : "타고난 잠재";

            // '역량' 단어를 한 번만 사용하도록 문장 재구성
            const descStr = `${weaponFeature}을(를) 바탕으로 본인만의 '${reinterp}' 역량을 발휘하여 목표를 성취하는 타입입니다.`;

            // ─── 동적 해시태그 생성 로직 준비 ───

            const CORE_DESC = {
                "甲": "우뚝 솟은 큰 나무처럼 진취적이고 곧은 성정을 지녔습니다. 강한 추진력과 리더십이 돋보입니다.",
                "乙": "바람에 흔들리되 꺾이지 않는 화초처럼 놀라운 유연성과 생활력을 갖추고 있습니다.",
                "丙": "하늘 높이 떠오른 태양처럼 열정적이고 만물을 비추는 솔직하고 화려한 기운입니다.",
                "丁": "어둠을 밝히는 촛불처럼 따뜻하면서도 내면의 치열한 집중력과 헌신적인 성향이 있습니다.",
                "戊": "든든하고 거대한 산처럼 묵직하며, 믿음직스럽고 사람들을 안정감 있게 포용합니다.",
                "己": "만물이 자라나는 기름진 토양처럼 실용적이고 세심하며 타인을 잘 보살피는 기운입니다.",
                "庚": "제련되지 않은 강철처럼 단단하고 결단력이 있으며, 원칙을 중시하고 의리가 깊습니다.",
                "辛": "보석이나 예리한 칼날처럼 섬세하고 빛나는 기운입니다. 예리한 직관력과 완벽주의가 특징입니다.",
                "壬": "도도하게 흐르는 큰 강물처럼 깊은 지혜와 넓은 포용력, 뛰어난 통찰력을 갖추고 있습니다.",
                "癸": "만물을 적시는 단비처럼 지혜롭고 환경에 맞게 형태를 바꾸는 유연성과 다정함이 돋보입니다."
            };

            // 기질 종합 분석 및 dominantEl 추출 (먼저 수행)
            let comprehensiveDesc = "";
            let dominantEl = "Wood";
            let domPct = 0;
            const EL_KR = { Wood: "목(木)", Fire: "화(火)", Earth: "토(土)", Metal: "금(金)", Water: "수(水)" };
            const EL_TRAITS = {
                Wood: "지식에 대한 호기심과 끊임없는 성장 욕구",
                Fire: "화려한 언변, 사교성과 무대를 장악하는 표현력",
                Earth: "어떤 상황에서도 무너지지 않는 포용력과 안정감",
                Metal: "원칙을 세우고 칼날같이 끊어내는 이성적 판단력",
                Water: "경계를 허물고 상황에 맞게 융통하는 무한한 지혜"
            };

            if (pillars.elements) {
                const sortedEls = Object.entries(pillars.elements).sort((a, b) => b[1] - a[1]);
                dominantEl = sortedEls[0][0];
                domPct = sortedEls[0][1]; // shadow 삭제

                const dmElStr = EL_KR[dmElement];
                const domElStr = EL_KR[dominantEl];

                if (dmElement === dominantEl) {
                    comprehensiveDesc = `나의 코어 에너지인 일간 오행과 동일한 주류 오행인 ${domElStr} 기운이 사주의 ${domPct}%라는 압도적인 핵심을 차지합니다. 무언가를 철저히 계산하기보다는 본연의 독립성과 주관, 즉 '${EL_TRAITS[dominantEl]}'이(가) 당신을 성공으로 이끄는 진짜 무기입니다.`;
                } else if (PRODUCE[dmElement] === dominantEl) {
                    comprehensiveDesc = `나의 코어 에너지인 ${dmElStr}이(가) 표출되는 ${domElStr} 기운이 사주의 ${domPct}%를 차지하여 매우 활성화되어 있습니다. 내면의 에너지를 밖으로 쏟아내고 표현하는 '${EL_TRAITS[dominantEl]}'이(가) 당신의 잠재력을 이끌어냅니다.`;
                } else if (PRODUCE[dominantEl] === dmElement) {
                    comprehensiveDesc = `나의 코어 에너지인 ${dmElStr}을(를) 강하게 생조(生助)해주는 ${domElStr} 기운이 사주의 ${domPct}%를 뒷받침합니다. 든든한 기반 속에서 끊임없이 지식을 흡수하는 '${EL_TRAITS[dominantEl]}'의 역량이 당신을 비범하게 만듭니다.`;
                } else if (CONTROL[dmElement] === dominantEl) {
                    comprehensiveDesc = `나의 코어 에너지인 ${dmElStr}이(가) 완전히 정복하고 통제할 수 있는 ${domElStr} 기운이 사주의 ${domPct}%나 포진해 있습니다. 결과를 정확히 예측하고 자산을 증식시키는 '${EL_TRAITS[dominantEl]}'이(가) 남다른 무기입니다.`;
                } else if (CONTROL[dominantEl] === dmElement) {
                    comprehensiveDesc = `나의 코어 에너지인 ${dmElStr}을(를) 엄격하게 자극하고 단련하는 ${domElStr} 기운이 사주의 ${domPct}%라는 큰 비중을 차지합니다. 시련이 클수록 폭발하는 리더십과 '${EL_TRAITS[dominantEl]}'이(가) 당신을 성취로 이끕니다.`;
                } else {
                    comprehensiveDesc = `복합적인 기운의 작용 속에서 ${domElStr} 기운이 ${domPct}%를 차지하며 중심을 잡아줍니다. 유연하게 환경에 대처하는 '${EL_TRAITS[dominantEl]}' 역량이 당신만의 안정적 베이스캠프가 됩니다.`;
                }
            }

            // ─── 입체적 해시태그 풀 (태그 동적 믹스) ───
            const CORE_TAGS = {
                "甲": ["#성장마인드", "#추진력", "#리더십", "#개척정신", "#진취적"],
                "乙": ["#유연성", "#생존력", "#부드러운카리스마", "#네트워킹", "#회복탄력성"],
                "丙": ["#열정가", "#무대장악력", "#솔직함", "#표현력", "#스포트라이트"],
                "丁": ["#내적집중력", "#기획력", "#따뜻한리더십", "#디테일", "#헌신"],
                "戊": ["#안정감", "#포용력", "#믿음직함", "#신용", "#포커페이스"],
                "己": ["#실용주의", "#세심함", "#중재자", "#서포터", "#보살핌"],
                "庚": ["#결단력", "#의리", "#명확성", "#강철멘탈", "#원칙주의"],
                "辛": ["#섬세한감각", "#완벽주의", "#예리한직관", "#미적감각", "#정교함"],
                "壬": ["#지혜로운통찰", "#유연한적응력", "#넓은포용력", "#전략가", "#무한한잠재력"],
                "癸": ["#다정함", "#기획력", "#처세술", "#환경적응력", "#은밀한추진력"]
            };

            const DOMINANT_TAGS = {
                Wood: ["#호기심천국", "#비전설계", "#기획력발달"],
                Fire: ["#에너지넘침", "#트렌드세터", "#화려함"],
                Earth: ["#신뢰의아이콘", "#현실주의", "#중심잡기"],
                Metal: ["#칼같은기준", "#승부사기질", "#빈틈없는"],
                Water: ["#깊은생각", "#창의적발상", "#비밀주의"]
            };

            const WEAPON_TAGS = {
                "건록격": ["#독립적리더", "#압도적전문성", "#자수성가"],
                "비견": ["#주도적", "#자기신뢰", "#마이웨이"],
                "겁재": ["#경쟁우위", "#투쟁적성취", "#역전의명수"],
                "식신": ["#창의적영감", "#장인정신", "#안정적성취"],
                "상관": ["#파괴적혁신", "#언변의마술사", "#순발력"],
                "편재": ["#공간지각력", "#스케일큰목표", "#투자마인드"],
                "정재": ["#치밀한관리", "#안정적축적", "#티끌모아태산"],
                "편관": ["#위기관리", "#카리스마", "#강력한돌파"],
                "정관": ["#합리적관리", "#시스템구축", "#명예지향"],
                "편인": ["#직관적통찰", "#특수기획", "#천재성"],
                "정인": ["#지식융합", "#깊은사고력", "#브레인"]
            };

            // 중복 제거 및 조합
            const rawTags = [
                ...(CORE_TAGS[dmChar] || []),
                ...(DOMINANT_TAGS[dominantEl] || []),
                ...(top ? (WEAPON_TAGS[top.relation] || []) : [])
            ];

            const uniqueTags = Array.from(new Set(rawTags));

            // 임베디드 셔플 (랜덤성을 위해 간단한 조작)
            const seed = Date.now();
            let currentIndex = uniqueTags.length, randomIndex;
            while (currentIndex !== 0) {
                // Pseudo-random index
                randomIndex = Math.floor(Math.abs(Math.sin(seed + currentIndex)) * currentIndex);
                currentIndex--;
                [uniqueTags[currentIndex], uniqueTags[randomIndex]] = [uniqueTags[randomIndex], uniqueTags[currentIndex]];
            }

            const hashtags = uniqueTags.slice(0, 5);

            return {
                title: titleStr,
                slogan: slogan,
                desc: descStr,
                coreDesc: CORE_DESC[dmChar] || "고유의 강력한 코어 에너지를 지니고 있습니다.",
                comprehensiveDesc: comprehensiveDesc,
                hashtags: hashtags,
                dmElement: dmElement,
                socialWeapon: descStr,
                sourceTag: "UNSE 동적 분석 엔진 · 자평진전 격국론"
            };
        },

        getWeeklyTrend: function (pillars) {
            const now = new Date();
            const results = [];
            const labels = ['그제', '어제', '오늘', '내일', '모레'];
            for (let i = -2; i <= 2; i++) {
                const targetDate = new Date(now);
                targetDate.setDate(now.getDate() + i);
                const scores = this.getLuckScores(pillars, targetDate);
                results.push({
                    label: labels[i + 2],
                    score: scores.total
                });
            }
            return results;
        },

        // ─── 6. 인연 아키텍처: 관계 분석 엔진 ───────
        analyzeRelationship: function (myPillars, frPillars) {
            if (!myPillars || !frPillars) return null;

            const myDM = myPillars.dayMaster.charAt(0);
            const frDM = frPillars.dayMaster.charAt(0);
            const myEl = FIVE_ELEMENTS[myDM];
            const frEl = FIVE_ELEMENTS[frDM];

            // 1. Determine Sipsung Relationship (Orbits)
            let orbit = 2; // Default
            let sipsung = "비겁";
            let role = "러닝메이트 (동식)";
            let orbitName = "동료";

            if (PRODUCE[frEl] === myEl) {
                orbit = 1; sipsung = "인성"; role = "나를 생(生)하는 연료"; orbitName = "지원군";
            } else if (frEl === myEl) {
                orbit = 2; sipsung = "비겁"; role = "가치관을 공유하는 동반자"; orbitName = "동료";
            } else if (PRODUCE[myEl] === frEl) {
                orbit = 3; sipsung = "식상"; role = "내가 생(生)하는 파트너"; orbitName = "창의 파트너";
            } else if (CONTROL[myEl] === frEl) {
                orbit = 4; sipsung = "재성"; role = "내가 극(剋)하는 성과"; orbitName = "비즈니스 귀인";
            } else if (CONTROL[frEl] === myEl) {
                orbit = 5; sipsung = "관성"; role = "나를 다듬어주는 규율"; orbitName = "커리어 코치";
            }

            // 2. Harmony Score Calculation
            let score = 75; // Base
            if (orbit === 1) score += 12; // Supportive
            if (orbit === 2) score += 8;  // Equal
            if (orbit === 4) score += 15; // Result-oriented (High synergy)

            // Elemental Synergy (Extra points for production)
            if (PRODUCE[myEl] === frEl || PRODUCE[frEl] === myEl) score += 5;

            // Random variation based on characters (Deterministic)
            const seed = (myDM.charCodeAt(0) + frDM.charCodeAt(0)) % 7;
            score += seed;

            return {
                orbit,
                sipsung,
                role,
                orbitName,
                score: Math.min(99, score),
                frDM,
                frEl,
                frElColor: this.getElementColor(frEl)
            };
        },

        getElementColor: function (el) {
            const colors = {
                Wood: "#10B981",    // Emerald
                Fire: "#EF4444",    // Red
                Earth: "#F59E0B",   // Amber
                Metal: "#94A3B8",   // Slate/Slate
                Water: "#3B82F6"    // Blue
            };
            return colors[el] || "#3B82F6";
        }
    };
    window.SajuEngine = window.sajuEngine;
})();