/**
 * UNSE (운세) - UI Controller & Interactions
 */

let currentChart = null;
let trendChartInstance = null;

// 데이터 관리 변수
let userSajuData = JSON.parse(localStorage.getItem('unse_user_saju') || 'null');
let friendList = JSON.parse(localStorage.getItem('unse_friends') || '[]');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initCityDatalist();
    lucide.createIcons();
    setupEventListeners();
    replaceBrandName(); // 화면 초기화 시 Bluwings를 UNSE로 변경
    setupAmuletKeywords();
    renderFriendList();
});

function startAsGuest() {
    // [추가] 브라우저 전체화면 요청 (사용자 클릭 시점에만 작동)
    const doc = window.document;
    const docEl = doc.documentElement;
    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;

    if (requestFullScreen) {
        requestFullScreen.call(docEl).catch(err => {
            console.log("전체화면 요청이 거부되었습니다.");
        });
    }

    resetGenderSelection();
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
        welcome.style.display = 'none';
    }
    const modal = document.getElementById('guest-login-modal');
    if (modal) {
        // 모드 및 텍스트 리셋
        modal.querySelector('h3').innerText = "정보 입력";
        const submitBtnSpan = modal.querySelector('button[type="submit"] span');
        if (submitBtnSpan) submitBtnSpan.innerText = "분석 시작하기";
        modal.removeAttribute('data-mode');

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function replaceBrandName() {
    document.title = document.title.replace(/Bluwings/g, 'UNSE');
    // 안전한 텍스트 노드 치환 (이벤트 리스너 파괴 방지)
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
        if (node.nodeValue.includes('Bluwings')) {
            node.nodeValue = node.nodeValue.replace(/Bluwings/g, 'UNSE');
        }
    }
}

function initCityDatalist() {
    const datalist = document.getElementById('korea-cities-data');
    if (datalist && window.koreaCities) {
        window.koreaCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.name;
            datalist.appendChild(option);
        });
    }
}

function setupEventListeners() {
    const birthDateInput = document.querySelector('#birth-date');
    const correctionAlert = document.querySelector('#correction-alert');
    const correctionMsg = document.querySelector('#correction-msg');

    if (birthDateInput) {
        // 연도 4자리 초과 입력 방지 (YYYY-MM-DD 형식 유지)
        birthDateInput.addEventListener('input', (e) => {
            if (e.target.value.length > 10) {
                e.target.value = e.target.value.slice(0, 10);
            }
        });

        birthDateInput.addEventListener('change', (e) => {
            const val = e.target.value;
            if (!val) return;
            const yearStr = val.split('-')[0];
            const year = parseInt(yearStr);

            // 연도 4자리 초과 시 강제 보정 (HTML max 속성 백업)
            if (yearStr.length > 4) {
                const corrected = yearStr.slice(0, 4) + val.slice(yearStr.length);
                e.target.value = corrected;
                return;
            }

            let msg = "";
            if (year >= 1908 && year <= 1911) msg = "1908-11년 표준시 보정 (-30분)이 적용되었습니다.";
            else if (year >= 1954 && year <= 1961) msg = "1954-61년 한국 표준시 보정 (-30분)이 적용되었습니다.";
            else if (year === 1987 || year === 1988) msg = "1987-88년 썸머타임 및 경도 보정 (-1시간 30분)이 적용되었습니다.";

            if (msg && correctionMsg && correctionAlert) {
                correctionMsg.innerText = msg;
                correctionAlert.classList.remove('hidden');
            } else if (correctionAlert) {
                correctionAlert.classList.add('hidden');
            }
        });
    }

    const locationSearch = document.querySelector('#location-search');
    const longitudeFeedback = document.querySelector('#longitude-feedback');
    const customLongitudeInput = document.querySelector('#custom-longitude');

    if (locationSearch) {
        locationSearch.addEventListener('input', (e) => {
            const val = e.target.value;
            const city = window.koreaCities?.find(c => c.name === val);
            if (city && customLongitudeInput) {
                customLongitudeInput.value = city.lon;
                longitudeFeedback?.classList.remove('hidden');
            } else {
                longitudeFeedback?.classList.add('hidden');
            }
        });
    }

    const form = document.querySelector('#saju-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSajuAnalysis();
        });
    }

    const modal = document.querySelector('#talisman-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeTalismanModal();
        });
    }

    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const textarea = document.querySelector('#user-concern');
            if (textarea) textarea.value = `올해 ${tag.innerText.replace('#', '')}이 궁금합니다.`;
        });
    });

    const downloadBtn = document.getElementById('download-talisman');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const canvas = document.getElementById('talisman-canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = `UNSE_Talisman_${new Date().getTime()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        });
    }

    // Tab switching logic
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetId = link.getAttribute('data-target');
            if (targetId) window.switchTab(targetId);
        });
    });
}

window.switchTab = function (tabId) {
    const screens = document.querySelectorAll('.screen');
    const navLinks = document.querySelectorAll('.nav-link');

    screens.forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(tabId);
    if (targetScreen) targetScreen.classList.add('active');

    navLinks.forEach(n => {
        n.classList.remove('active');
        const icon = n.querySelector('.material-symbols-outlined');
        if (icon) icon.classList.remove('fill-icon');
    });

    const activeLink = document.querySelector(`.nav-link[data-target="${tabId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        const activeIcon = activeLink.querySelector('.material-symbols-outlined');
        if (activeIcon) activeIcon.classList.add('fill-icon');
    }

    if (tabId === 'tab-network') renderFriendList();

    window.scrollTo({ top: 0, behavior: 'instant' });
};

function handleSajuAnalysis() {
    try {
        const guestModal = document.getElementById('guest-login-modal');
        if (guestModal) {
            guestModal.classList.add('hidden');
            guestModal.classList.remove('flex');
        }

        const nameInput = document.querySelector('#user-name');
        const dateInput = document.querySelector('#birth-date');
        const timeInput = document.querySelector('#birth-time');
        const lonInput = document.querySelector('#custom-longitude');
        const gender = document.getElementById('user-gender').value;

        if (!gender) {
            alert("성별을 선택해주세요.");
            return;
        }

        if (!dateInput.value || !timeInput.value) {
            alert("생년월일과 태어난 정보를 모두 입력해주세요.");
            return;
        }

        let dateStr = dateInput.value;
        const yearStr = dateStr.split('-')[0];
        if (yearStr.length > 4) {
            alert("연도는 4자리까지만 입력 가능합니다.");
            return;
        }

        const name = nameInput.value || "방문자";
        const timeStr = timeInput.value;
        const customLon = parseFloat(lonInput?.value) || 126.97;

        // 양력/음력 변환 로직 추가
        const calendarType = document.querySelector('input[name="calendar-type"]:checked')?.value || 'solar';
        if (calendarType !== 'solar') {
            const [y, m, d] = dateStr.split('-').map(Number);
            const isLeap = calendarType === 'leap';
            const solarInfo = solarLunar.lunar2solar(y, m, d, isLeap);
            dateStr = `${solarInfo.cYear}-${String(solarInfo.cMonth).padStart(2, '0')}-${String(solarInfo.cDay).padStart(2, '0')}`;
        }

        const engine = window.sajuEngine;
        if (!engine || typeof engine.getSolarTime !== 'function') {
            console.error("SajuEngine not loaded correctly.");
            return;
        }

        // 시간 모름 처리
        let correctedDate;
        if (timeStr === 'unknown') {
            // 시간이 모름인 경우 해당 날짜의 정오(12:00)를 기준으로 분석하되 엔진에서 시간 무시 로직 적용 권장
            correctedDate = engine.getSolarTime(dateStr, "12:00", customLon);
        } else {
            correctedDate = engine.getSolarTime(dateStr, timeStr, customLon);
        }
        const pillars = engine.calculatePillars(correctedDate);

        // 인연 추가 모드인 경우
        if (guestModal.getAttribute('data-mode') === 'add-friend') {
            const timeUnknown = timeStr === 'unknown';
            const newFriend = {
                name: name,
                gender: gender,
                birthDate: dateStr,
                birthTime: timeStr,
                timeUnknown: timeUnknown,
                pillars: pillars,
                addedAt: new Date().toISOString()
            };
            friendList.push(newFriend);
            localStorage.setItem('unse_friends', JSON.stringify(friendList));
            renderFriendList();

            guestModal.classList.add('hidden');
            guestModal.classList.remove('flex');
            return;
        }

        window.lastPillars = pillars;

        // 사용자 정보 저장
        userSajuData = {
            name: name,
            gender: gender,
            birthDate: dateStr,
            birthTime: timeStr,
            pillars: pillars
        };
        localStorage.setItem('unse_user_saju', JSON.stringify(userSajuData));

        // Switch to Saju tab
        window.switchTab('tab-saju');

        const theme = engine.getThemeColor(pillars.dayMaster);
        const dmHanja = pillars.dayMaster.split('(')[0];
        const dmHangul = window.GAN_HANGUL[window.GAN_LIST.indexOf(dmHanja)];
        const dmElement = pillars.dayMaster.split('(')[1].replace(')', '');

        const profileName = document.querySelector('#profile-name');
        const profileBirth = document.querySelector('#profile-birth');
        const dmBadge = document.querySelector('#profile-element-badge');
        const coreEnergyTitle = document.querySelector('#core-energy-title');

        if (profileName) profileName.innerText = `${name}`;
        const year = dateStr.split('-')[0];
        const displayTime = timeStr === 'unknown' ? '시간 모름' : `진태양시 ${timeStr}`;
        if (profileBirth) profileBirth.innerText = `${year}년생 · ${displayTime}`;
        if (dmBadge) {
            dmBadge.innerText = dmElement.toUpperCase();
            dmBadge.style.background = theme.main;
        }

        const elHnMap = { Wood: '목', Fire: '화', Earth: '토', Metal: '금', Water: '수' };
        if (coreEnergyTitle) coreEnergyTitle.innerText = `나의 코어 에너지: ${dmHanja} (${dmHangul}${elHnMap[dmElement] || dmElement})`;

        updatePillarCircles(pillars);
        updateElementBars(pillars.elements);

        const scores = engine.getLuckScores(pillars);
        updateScoresUI(scores);
        updateModernTraitUI(pillars);
        updateGoalStyle(pillars.sipsung);

        generateDailySuggestions(scores.dailyTip);
        updateLuckyItems(scores.luckyItems);
        updateGuideHeader(name);

        const trendData = engine.getWeeklyTrend(pillars);
        updateTrendChart(trendData);

        replaceBrandName();

        lucide.createIcons();
        window.scrollTo(0, 0);
    } catch (err) {
        console.error("Analysis Error:", err);
        alert("분석 도중 오류가 발생했습니다. 입력을 확인해주세요.");
    }
}

function openScoreDetail() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById('screen-score-detail').classList.add('active');

    const nameEl = document.querySelector('#user-name');
    const userName = nameEl?.value || '방문자';
    const titleEl = document.getElementById('detail-top-title');
    const dateEl = document.getElementById('detail-top-date');
    if (titleEl) titleEl.innerText = `${userName}님의 오늘 운세`;

    if (window.lastPillars && dateEl) {
        dateEl.innerText = `${window.lastPillars.year}년 ${window.lastPillars.month}월 ${window.lastPillars.day}일`;
    } else if (dateEl) {
        const t = new Date();
        dateEl.innerText = `${t.getFullYear()}년 ${t.getMonth() + 1}월 ${t.getDate()}일`;
    }

    window.scrollTo(0, 0);
}

function closeScoreDetail() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById('tab-guide').classList.add('active');
    window.scrollTo(0, 0);
}

function updateScoresUI(scores) {
    const total = document.getElementById('guide-total-score');
    if (total) total.innerText = scores.total;

    const shortSummaryEl = document.getElementById('guide-short-summary');
    if (shortSummaryEl && scores.shortSummary) {
        shortSummaryEl.innerText = scores.shortSummary;
    }

    const moneyScore = document.getElementById('score-money');
    const moneyBar = document.getElementById('bar-money');
    if (moneyScore) moneyScore.innerText = scores.money;
    if (moneyBar) moneyBar.style.width = scores.money + '%';

    const careerScore = document.getElementById('score-career');
    const careerBar = document.getElementById('bar-career');
    if (careerScore) careerScore.innerText = scores.career;
    if (careerBar) careerBar.style.width = scores.career + '%';

    const healthScore = document.getElementById('score-health');
    const healthBar = document.getElementById('bar-health');
    if (healthScore) healthScore.innerText = scores.health;
    if (healthBar) healthBar.style.width = scores.health + '%';

    const loveScore = document.getElementById('score-love');
    const loveBar = document.getElementById('bar-love');
    if (loveScore) loveScore.innerText = scores.love;
    if (loveBar) loveBar.style.width = scores.love + '%';

    // Update 2x2 grid summaries
    const sMoneySum = document.getElementById('score-money-summary');
    const sMoneyShort = document.getElementById('short-money');
    if (sMoneySum) sMoneySum.innerText = scores.money;
    if (sMoneyShort) sMoneyShort.innerText = scores.moneyShort || '-';

    const sCareerSum = document.getElementById('score-career-summary');
    const sCareerShort = document.getElementById('short-career');
    if (sCareerSum) sCareerSum.innerText = scores.career;
    if (sCareerShort) sCareerShort.innerText = scores.careerShort || '-';

    const sLoveSum = document.getElementById('score-love-summary');
    const sLoveShort = document.getElementById('short-love');
    if (sLoveSum) sLoveSum.innerText = scores.love;
    if (sLoveShort) sLoveShort.innerText = scores.loveShort || '-';

    const sHealthSum = document.getElementById('score-health-summary');
    const sHealthShort = document.getElementById('short-health');
    if (sHealthSum) sHealthSum.innerText = scores.health;
    if (sHealthShort) sHealthShort.innerText = scores.healthShort || '-';

    // Descriptions
    const moneyDesc = document.getElementById('desc-money');
    if (moneyDesc && scores.moneyDesc) moneyDesc.innerText = scores.moneyDesc;

    const careerDesc = document.getElementById('desc-career');
    if (careerDesc && scores.careerDesc) careerDesc.innerText = scores.careerDesc;

    const healthDesc = document.getElementById('desc-health');
    if (healthDesc && scores.healthDesc) healthDesc.innerText = scores.healthDesc;

    const loveDesc = document.getElementById('desc-love');
    if (loveDesc && scores.loveDesc) loveDesc.innerText = scores.loveDesc;
}

function updateModernTraitUI(pillars) {
    const info = window.sajuEngine.getModernAnalysis(pillars);
    const nameEl = document.querySelector('#user-name');
    const userName = nameEl?.value || '방문자';

    const dmHanja = pillars.dayMaster.split('(')[0];
    const dmHangul = window.GAN_HANGUL[window.GAN_LIST.indexOf(dmHanja)];
    const dmElement = pillars.dayMaster.split('(')[1].replace(')', '');
    const elLabelMap = { Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水' };

    const coreTitle = document.getElementById('core-title');
    const coreDesc = document.getElementById('core-desc');
    const weaponTitle = document.getElementById('weapon-title');
    const weaponDesc = document.getElementById('weapon-desc');

    if (coreTitle) coreTitle.innerText = `나의 코어 에너지: ${dmHanja}(${dmHangul})`;
    if (coreDesc) coreDesc.innerText = info.coreDesc;

    const top = (pillars.sipsung && pillars.sipsung.length > 0) ? pillars.sipsung[0] : null;
    if (top) {
        if (weaponTitle) weaponTitle.innerText = `나의 사회적 무기: ${top.relation}(${top.char})`;
    }

    if (weaponDesc && info.socialWeapon) {
        // 단어 중복 방지 및 엔진의 초개인화 문구 반영
        weaponDesc.innerText = info.socialWeapon.replace(/역량 역량/g, "역량").trim();
    }

    const traitProfileName = document.getElementById('trait-profile-name');
    const traitProfileDesc = document.getElementById('trait-profile-desc');

    if (traitProfileName) traitProfileName.innerText = `${userName}님`;
    if (traitProfileDesc) traitProfileDesc.innerText = `보석처럼 빛나는 ${dmHangul}(${dmHanja}${elLabelMap[dmElement]}) 기질`;

    const traitSlogan = document.getElementById('trait-slogan');
    const traitSummary = document.getElementById('trait-summary');
    if (traitSlogan) traitSlogan.innerText = info.slogan || '-';
    // 기질 분석 탭 요약 중복 방지: info.desc 대신 info.comprehensiveDesc 사용
    if (traitSummary) traitSummary.innerHTML = info.comprehensiveDesc || '-';

    const traitCoreHanja = document.getElementById('trait-core-hanja');
    const traitCoreDesc = document.getElementById('trait-core-desc');
    const traitComprehensive = document.getElementById('trait-comprehensive');

    if (traitCoreHanja) traitCoreHanja.innerText = dmHanja;
    if (traitCoreDesc) traitCoreDesc.innerHTML = `나의 코어 에너지인 <span class="font-bold text-primary">${dmHanja}(${dmHangul})</span>은(는) ${info.coreDesc}`;
    if (traitComprehensive) traitComprehensive.innerText = info.comprehensiveDesc || '-';

    const traitKeywords = document.getElementById('trait-keywords');
    if (traitKeywords && info.hashtags) {
        traitKeywords.innerHTML = '';
        info.hashtags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium';
            span.innerText = tag;
            traitKeywords.appendChild(span);
        });
    }

    const avatarImgs = document.querySelectorAll('#profile-avatar, #guide-profile-img');
    if (avatarImgs.length > 0 && info.dmElement) {
        const avatarMap = {
            Wood: 'wood_avatar.png',
            Fire: 'fire_avatar.png',
            Earth: 'earth_avatar.png',
            Metal: 'metal_avatar.png',
            Water: 'water_avatar.png'
        };

        // 기본 이미지 설정 (파일이 없을 경우 대비)
        const defaultAvatar = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix';
        const src = avatarMap[info.dmElement] || defaultAvatar;

        avatarImgs.forEach(img => {
            img.src = src;
            // 이미지 로드 실패 시 기본 아바타로 교체하는 핸들러 추가
            img.onerror = () => { img.src = defaultAvatar; };
        });
    }
}

function updateGoalStyle(sipsungArr) {
    if (!sipsungArr || sipsungArr.length === 0) return;
    const strongest = sipsungArr[0];

    const traitFuncTitle = document.getElementById('trait-functional-title');
    const traitFuncDesc = document.getElementById('trait-functional-desc');
    const chipValue1 = document.getElementById('flow-chip-value-1');
    const chipValue2 = document.getElementById('flow-chip-value-2');

    if (traitFuncTitle) traitFuncTitle.innerText = strongest.meta.functionalValue || strongest.relation;
    if (traitFuncDesc) traitFuncDesc.innerText = strongest.meta.flowDesc || '-';
    if (chipValue1 && strongest.meta.flowChips) chipValue1.innerText = strongest.meta.flowChips[0];
    if (chipValue2 && strongest.meta.flowChips) chipValue2.innerText = strongest.meta.flowChips[1];
}

function updateGuideHeader(userName) {
    const title = document.getElementById('guide-title');
    const dateDesc = document.getElementById('guide-date');
    const subDesc = document.getElementById('guide-sub-desc');

    if (title) title.innerHTML = `${userName}님 <span class="text-sm font-normal text-slate-500 ml-1">오늘의 기운</span>`;

    let iljin = "";
    if (window.lastPillars) {
        iljin = `${window.lastPillars.year}년 ${window.lastPillars.month}월 ${window.lastPillars.day}일`;
    } else {
        const today = new Date();
        iljin = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    }

    if (dateDesc) dateDesc.innerText = iljin;

    const scores = window.lastPillars ? window.sajuEngine?.getLuckScores(window.lastPillars) : null;
    if (subDesc) {
        subDesc.innerText = scores?.shortSummary || "상서로운 기운이 가득한 날입니다";
    }
}

function updatePillarCircles(pillars) {
    const chars = [
        { type: 'year', gan: pillars.year[0], ji: pillars.year[1] },
        { type: 'month', gan: pillars.month[0], ji: pillars.month[1] },
        { type: 'day', gan: pillars.day[0], ji: pillars.day[1] },
        { type: 'hour', gan: pillars.hour[0], ji: pillars.hour[1] }
    ];

    const colorMap = {
        wood: 'text-[#4ade80]',
        fire: 'text-[#f87171]',
        earth: 'text-[#fbbf24]',
        metal: 'text-[#94a3b8]',
        water: 'text-[#60a5fa]'
    };

    chars.forEach(c => {
        const ganHanja = document.getElementById(`${c.type}-gan-hanja`);
        const ganHangul = document.getElementById(`${c.type}-gan-hangul`);
        const jiHanja = document.getElementById(`${c.type}-ji-hanja`);
        const jiHangul = document.getElementById(`${c.type}-ji-hangul`);

        if (ganHanja) {
            ganHanja.innerText = c.gan;
            const el = window.FIVE_ELEMENTS[c.gan]?.toLowerCase() || 'wood';
            ganHanja.className = `text-[32px] font-bold ${colorMap[el]}`;
        }
        if (ganHangul) {
            ganHangul.innerText = getPreciseReading(c.gan);
            const el = window.FIVE_ELEMENTS[c.gan]?.toLowerCase() || 'wood';
            ganHangul.className = `text-xs font-medium mb-1.5 ${colorMap[el]}`;
        }

        if (jiHanja) {
            jiHanja.innerText = c.ji;
            const el = window.FIVE_ELEMENTS[c.ji]?.toLowerCase() || 'wood';
            jiHanja.className = `text-[32px] font-bold ${colorMap[el]}`;
        }
        if (jiHangul) {
            jiHangul.innerText = getPreciseReading(c.ji);
            const el = window.FIVE_ELEMENTS[c.ji]?.toLowerCase() || 'wood';
            jiHangul.className = `text-xs font-medium mb-1.5 ${colorMap[el]}`;
        }
    });
}

function getPreciseReading(char) {
    const ganIdx = window.GAN_LIST.indexOf(char);
    const jiIdx = window.JI_LIST.indexOf(char);
    const elMap = { Wood: "목", Fire: "화", Earth: "토", Metal: "금", Water: "수" };
    if (ganIdx !== -1) return window.GAN_HANGUL[ganIdx] + elMap[window.FIVE_ELEMENTS[char]];
    if (jiIdx !== -1) return window.JI_HANGUL[jiIdx] + elMap[window.FIVE_ELEMENTS[char]];
    return char;
}

function updateElementBars(elements) {
    const elOrder = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
    const elId = { Wood: 'wood', Fire: 'fire', Earth: 'earth', Metal: 'metal', Water: 'water' };
    const elLabels = { Wood: '木', Fire: '火', Earth: '土', Metal: '金', Water: '水' };
    const elHn = { Wood: '목', Fire: '화', Earth: '토', Metal: '금', Water: '수' };

    elOrder.forEach(key => {
        const val = elements[key] || 0;
        const id = elId[key];
        const fill = document.getElementById(`bar-${id}`);
        const pct = document.getElementById(`pct-${id}`);
        if (fill) fill.style.width = val + '%';
        if (pct) pct.innerText = val + '%';

        const statusBadge = document.getElementById(`status-${id}`);
        if (statusBadge) {
            const baseClass = "ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-wide";
            if (val < 20) {
                statusBadge.innerText = "부족";
                statusBadge.className = `${baseClass} bg-slate-700`;
            } else if (val >= 20 && val <= 40) {
                statusBadge.innerText = "적정";
                statusBadge.className = `${baseClass} bg-blue-500`;
            } else {
                statusBadge.innerText = "과다";
                statusBadge.className = `${baseClass} bg-rose-500`;
            }
        }

        const barTrack = fill ? fill.parentElement : null;
        if (barTrack) {
            if (val >= 40) {
                barTrack.className = 'h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner';
            } else {
                barTrack.className = 'h-2 w-full bg-slate-200 rounded-full overflow-hidden';
            }
        }
    });

    const sorted = Object.entries(elements).sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0][0];
    const weak = sorted[sorted.length - 1][0];
    const display = document.getElementById('dominant-element-card-text');

    if (display) {
        display.innerText = `${elHn[dominant]}(${elLabels[dominant]}) ${elements[dominant]}%`;
    }

    const colorText = document.getElementById('lucky-color-text');
    const colorMap = {
        Wood: '그린, 에메랄드',
        Fire: '레드, 퍼플',
        Earth: '옐로우, 베이지',
        Metal: '화이트, 실버',
        Water: '블랙, 네이비'
    };
    if (colorText) colorText.innerText = colorMap[dominant] || '화이트, 실버';

    const sName = document.getElementById('strong-element-name');
    const wName = document.getElementById('weak-element-name');
    if (sName) sName.innerText = `${elHn[dominant]} (핵심 역량)`;
    if (wName) wName.innerText = `${elHn[weak]} (부족한 에너지)`;
}

function generateDailySuggestions(dailyTip) {
    const target = document.getElementById('guide-daily-tip');
    if (!target) return;
    target.innerText = dailyTip || '-';
}

function updateLuckyItems(luckyItems) {
    if (!luckyItems) return;

    const color = document.getElementById('guide-lucky-color');
    const chip = document.getElementById('guide-lucky-chip');

    if (color) color.innerText = luckyItems.color.name;
    if (chip) chip.style.backgroundColor = luckyItems.color.hex;

    const time = document.getElementById('guide-lucky-time');
    if (time) time.innerText = luckyItems.business.time;

    const food = document.getElementById('guide-lucky-food');
    if (food) food.innerText = luckyItems.food.name;

    const numberContainer = document.getElementById('guide-lucky-number');
    if (numberContainer) {
        numberContainer.innerHTML = '';
        if (luckyItems.number) {
            const numbers = luckyItems.number.split(',').map(n => n.trim());
            numbers.forEach(num => {
                const span = document.createElement('span');
                span.className = 'w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-bold text-purple-600 shadow-sm';
                span.innerText = num;
                numberContainer.appendChild(span);
            });
        }
    }

    const direction = document.getElementById('guide-lucky-direction');
    if (direction) direction.innerText = luckyItems.direction;
}

function updateRadarChart(elements) {
    const ctx = document.getElementById('elementChart')?.getContext('2d');
    if (!ctx) return;
    const data = {
        labels: ['목(木)', '화(火)', '토(土)', '금(金)', '수(水)'],
        datasets: [{
            label: '에너지 분포 (%)',
            data: [elements.Wood, elements.Fire, elements.Earth, elements.Metal, elements.Water],
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3B82F6',
            pointBackgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#94A3B8', '#3B82F6'],
            borderWidth: 2
        }]
    };
    if (currentChart) currentChart.destroy();
    currentChart = new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            scales: { r: { suggestedMin: 0, suggestedMax: 50, ticks: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function updateTrendChart(trendData) {
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (!ctx) return;

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.map(d => d.label),
            datasets: [{
                data: trendData.map(d => d.score),
                borderColor: '#256af4',
                backgroundColor: 'rgba(37, 106, 244, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointBackgroundColor: (context) => context.dataIndex === 2 ? '#256af4' : '#ffffff',
                pointBorderColor: '#256af4',
                pointBorderWidth: 2,
                pointRadius: (context) => context.dataIndex === 2 ? 6 : 4,
                pointHoverRadius: 8
            }]
        },
        options: {
            scales: {
                y: { min: 40, max: 100, display: false },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#64748b', font: { size: 12, weight: 'bold' } }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { displayColors: false, callbacks: { label: (ctx) => ctx.raw + '점' } }
            },
            maintainAspectRatio: false
        }
    });
}

// Time Picker Interactive Logic
let selectedAmPm = 'AM';
let selectedHour12 = 12;
let selectedMinute = 0;
let pickerMode = 'hour';
let isDragging = false;

function openTimePicker() {
    pickerMode = 'hour';
    renderClockFace();
    updateDigitalDisplay();
    setupClockEvents();
    document.getElementById('time-picker-modal').style.display = 'flex';
}

function setupClockEvents() {
    const face = document.getElementById('clock-face');
    if (!face || face.dataset.eventsSet) return;

    const handleMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const rect = face.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        let angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        if (pickerMode === 'hour') {
            let h = Math.round(angle / 30);
            if (h === 0) h = 12;
            selectedHour12 = h;
            rotateHand(h, 12);
        } else {
            let m = Math.round(angle / 6);
            if (m >= 60) m = 0;
            selectedMinute = m;
            rotateHand(m, 60);
        }
        updateDigitalDisplay();
    };

    face.addEventListener('mousedown', (e) => { isDragging = true; handleMove(e); });
    face.addEventListener('touchstart', (e) => { isDragging = true; handleMove(e); }, { passive: false });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', () => {
        if (isDragging && pickerMode === 'hour') setTimeout(() => switchPickerMode('minute'), 200);
        isDragging = false;
    });
    window.addEventListener('touchend', () => {
        if (isDragging && pickerMode === 'hour') setTimeout(() => switchPickerMode('minute'), 200);
        isDragging = false;
    });
    face.dataset.eventsSet = "true";
}

function switchPickerMode(mode) {
    pickerMode = mode;
    document.querySelectorAll('.time-box').forEach(b => b.classList.remove('active'));
    document.getElementById(mode + '-box').classList.add('active');
    renderClockFace();
}

function selectAmPm(val) {
    selectedAmPm = val;
    const amBtn = document.getElementById('am-btn');
    const pmBtn = document.getElementById('pm-btn');

    const baseClass = "border-none w-12 h-9 rounded-lg font-bold text-xs transition-colors ";
    const activeClass = "bg-slate-900 text-white";
    const inactiveClass = "bg-slate-100 text-slate-500";

    if (val === 'AM') {
        if (amBtn) amBtn.className = baseClass + activeClass;
        if (pmBtn) pmBtn.className = baseClass + inactiveClass;
    } else {
        if (amBtn) amBtn.className = baseClass + inactiveClass;
        if (pmBtn) pmBtn.className = baseClass + activeClass;
    }
}

function renderClockFace() {
    const face = document.getElementById('clock-face');
    if (!face) return;
    face.querySelectorAll('.clock-number').forEach(n => n.remove());

    if (pickerMode === 'hour') {
        for (let h = 1; h <= 12; h++) createClockNumber(h, h, 12, 115);
        rotateHand(selectedHour12, 12);
    } else {
        for (let m = 0; m < 60; m += 5) createClockNumber(m, m, 60, 115);
        rotateHand(selectedMinute, 60);
    }
}

function createClockNumber(val, step, total, radius) {
    const face = document.getElementById('clock-face');
    const angle = (step / total) * 360 - 90;
    const rad = angle * (Math.PI / 180);
    const x = 130 + radius * Math.cos(rad);
    const y = 130 + radius * Math.sin(rad);

    const div = document.createElement('div');
    div.className = 'clock-number';
    div.style.left = (x - 18) + 'px';
    div.style.top = (y - 18) + 'px';
    div.innerText = pickerMode === 'minute' ? val.toString().padStart(2, '0') : val;
    div.onclick = (e) => { e.stopPropagation(); handleClockClick(val); };
    face.appendChild(div);
}

function rotateHand(val, total) {
    const hand = document.getElementById('clock-hand');
    if (!hand) return;
    const angle = (val / total) * 360;
    hand.style.transform = `translateX(-50%) rotate(${angle}deg)`;
}

function handleClockClick(val) {
    if (pickerMode === 'hour') {
        selectedHour12 = val; rotateHand(val, 12); updateDigitalDisplay();
        setTimeout(() => switchPickerMode('minute'), 300);
    } else {
        selectedMinute = val; rotateHand(val, 60); updateDigitalDisplay();
    }
}

function updateDigitalDisplay() {
    document.getElementById('hour-box').innerText = selectedHour12.toString().padStart(2, '0');
    document.getElementById('minute-box').innerText = selectedMinute.toString().padStart(2, '0');
}

function closeTimePicker() {
    document.getElementById('time-picker-modal').style.display = 'none';
}

function applyTime() {
    const display = document.getElementById('display-time');
    const hiddenInput = document.getElementById('birth-time');

    let h24 = selectedHour12;
    if (selectedAmPm === 'PM' && h24 < 12) h24 += 12;
    if (selectedAmPm === 'AM' && h24 === 12) h24 = 0;

    const hStr = h24.toString().padStart(2, '0');
    const mStr = selectedMinute.toString().padStart(2, '0');
    const ampmLabel = selectedAmPm === 'AM' ? '오전' : '오후';

    display.innerText = `${ampmLabel} ${selectedHour12.toString().padStart(2, '0')}:${mStr}`;
    hiddenInput.value = `${hStr}:${mStr}`;
    closeTimePicker();
}

function openTalismanModal() { document.getElementById('talisman-modal').style.display = 'flex'; }
function closeTalismanModal() { document.getElementById('talisman-modal').style.display = 'none'; }

// =====================================
// Premium Amulet — Data-Driven Matching Engine
// =====================================
const AMULET_DATA = window.AMULET_DATA || [];

let activeAmuletItem = null;
let selectedAmuletKeyword = null;

const KEYWORD_SCORE_MAP = {
    money: 'money',
    business: 'career',
    job: 'career',
    love_new: 'love',
    love_reunion: 'love',
    family: 'love',
    health: 'health',
    study: 'career',
    protect: 'health',
    wish: 'total'
};

const AMULET_DISPLAY_NAMES = {
    money: '재물운',
    business: '사업운',
    job: '취업운',
    love_new: '애정운',
    love_reunion: '인연운',
    family: '가정운',
    health: '건강운',
    study: '학업운',
    protect: '액막이운',
    wish: '소원운'
};

// ─── 🚨 핵심 수정: 무적 인라인 스타일(Inline Styles) 적용 ───
function setupAmuletKeywords() {
    const chips = document.querySelectorAll('.amulet-keyword-chip');
    const generateBtn = document.getElementById('amulet-generate-btn');
    const saveBtn = document.getElementById('amulet-save-btn');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            // 1. 모든 칩 초기화 (강제 부여된 인라인 스타일 싹 지우기)
            chips.forEach(c => {
                c.style.cssText = ""; // 인라인 스타일 완전 초기화
                const icon = c.querySelector('.check-icon');
                if (icon) {
                    icon.classList.add('hidden');
                    icon.style.cssText = "";
                }
            });

            // 2. 현재 클릭된 칩 강제 활성화 (Tailwind 에러, Hover 잔상 모두 무시하는 절대 규칙)
            chip.style.setProperty('background-color', '#256af4', 'important');
            chip.style.setProperty('border-color', '#256af4', 'important');
            chip.style.setProperty('color', '#ffffff', 'important');
            chip.style.setProperty('font-weight', '700', 'important');
            chip.style.setProperty('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 'important');

            const icon = chip.querySelector('.check-icon');
            if (icon) {
                icon.classList.remove('hidden');
                icon.style.setProperty('color', '#ffffff', 'important');
            }

            selectedAmuletKeyword = chip.getAttribute('data-keyword');

            // 3. 버튼 활성화
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.classList.remove('opacity-50', 'pointer-events-none');
                generateBtn.classList.add('opacity-100');
            }
        });
    });

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            if (!selectedAmuletKeyword) return;
            generatePremiumAmulet(selectedAmuletKeyword);
        });
    }


}

// =====================================
// 초개인화 필터링 알고리즘
// =====================================
function generatePremiumAmulet(keyword) {
    const scores = (window.lastPillars && window.sajuEngine)
        ? window.sajuEngine.getLuckScores(window.lastPillars)
        : null;

    const scoreKey = KEYWORD_SCORE_MAP[keyword] || 'total';
    const targetScore = scores ? scores[scoreKey] : null;

    let currentCondition;
    if (targetScore === null || targetScore === undefined) {
        currentCondition = 'all';
    } else if (targetScore < 70) {
        currentCondition = 'low';
    } else {
        currentCondition = 'high';
    }

    let candidates = AMULET_DATA.filter(item =>
        item.matchKeywords && item.matchKeywords.includes(keyword) &&
        (item.scoreCondition === currentCondition || item.scoreCondition === 'all')
    );

    if (candidates.length === 0) {
        candidates = AMULET_DATA.filter(item =>
            item.matchKeywords && item.matchKeywords.includes(keyword)
        );
    }

    if (candidates.length === 0) {
        candidates = AMULET_DATA;
    }

    const amuletItem = candidates[Math.floor(Math.random() * candidates.length)];
    activeAmuletItem = amuletItem;

    // ── 6. 상태 기반 동적 코멘트 생성 ──
    const userName = document.getElementById('user-name')?.value || '방문자';
    const fortuneName = AMULET_DISPLAY_NAMES[keyword] || '행운';
    let dayMasterText = '';
    if (window.lastPillars && window.lastPillars.dayMaster) {
        const dmHanja = window.lastPillars.dayMaster.split('(')[0];
        const dmHangul = window.GAN_HANGUL?.[window.GAN_LIST?.indexOf(dmHanja)] || '';
        const dmElement = window.lastPillars.dayMaster.split('(')[1]?.replace(')', '') || '';
        const elHnMap = { Wood: '목', Fire: '화', Earth: '토', Metal: '금', Water: '수' };
        dayMasterText = `${dmHanja}(${dmHangul}${elHnMap[dmElement] || dmElement})`;
    }
    // 점수 조건에 따른 프리미엄 코멘트 분기 (자연스러운 문장형)
    let customText;
    if (amuletItem.scoreCondition === 'low') {
        if (dayMasterText) {
            customText = `${userName}님의 ${dayMasterText} 기운을 단단하게 보호하여\n다가오는 액운을 막아내고\n간절한 ${fortuneName}을 굳건히 지켜냅니다.`;
        } else {
            customText = `${userName}님께 다가오는 액운을 막아내고\n간절한 ${fortuneName}을 굳건히 지켜냅니다.`;
        }
    } else {
        if (dayMasterText) {
            customText = `${userName}님의 ${dayMasterText} 기운과 강하게 공명하여\n상서로운 흐름을 타고\n바라시는 ${fortuneName}의 큰 성취를 돕습니다.`;
        } else {
            customText = `${userName}님을 향한 상서로운 흐름을 타고\n바라시는 ${fortuneName}의 큰 성취를 돕습니다.`;
        }
    }

    openAmuletModal();
    drawCompositeAmulet(amuletItem, customText);
}

function openAmuletModal() {
    const modal = document.getElementById('amulet-detail-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
    });
    document.body.style.overflow = 'hidden';
}

function closeAmuletModal() {
    const modal = document.getElementById('amulet-detail-modal');
    if (!modal) return;
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
}

function drawCompositeAmulet(amuletItem, customText) {
    const canvas = document.getElementById('amulet-composite-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = 1080;
    canvas.height = 1920;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#080e1a');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    const glow = ctx.createRadialGradient(540, 750, 30, 540, 750, 600);
    glow.addColorStop(0, 'rgba(212, 175, 55, 0.15)');
    glow.addColorStop(0.5, 'rgba(212, 175, 55, 0.05)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 980, 1820);

    const img = new Image();

    img.onload = function () {
        ctx.save();
        ctx.shadowColor = 'rgba(212, 175, 55, 0.35)';
        ctx.shadowBlur = 80;
        ctx.drawImage(img, 140, 300, 800, 1200);
        ctx.restore();
        drawTextOverlay(ctx, amuletItem, customText);
    };

    img.onerror = function () {
        console.error('부적 이미지 로드 실패:', amuletItem.imgGold);
        ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
        ctx.beginPath();
        ctx.arc(540, 800, 300, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#D4AF37';
        ctx.font = 'bold 100px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(amuletItem.title, 540, 800);
        ctx.textBaseline = 'alphabetic';

        drawTextOverlay(ctx, amuletItem, customText);
    };

    img.src = amuletItem.imgGold;
}

function drawTextOverlay(ctx, amuletItem, customText) {
    ctx.textAlign = 'center';

    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 90px sans-serif';
    ctx.fillText(amuletItem.title, 540, 200);

    ctx.fillStyle = 'rgba(252, 211, 77, 0.5)';
    ctx.font = '36px sans-serif';
    ctx.fillText(amuletItem.shortDesc || '', 540, 270);

    // ── 하단: 유저 맞춤 코멘트 (흰색) ──
    // 구분선 (위로 이동)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 1530); // 1580에서 1530으로 변경
    ctx.lineTo(880, 1530); // 1580에서 1530으로 변경
    ctx.stroke();

    // 맞춤 코멘트 (위로 이동)
    ctx.fillStyle = '#ffffff';
    ctx.font = '45px sans-serif';

    const lines = customText.split('\n');
    const lineHeight = 65;
    const startY = 1600; // 1650에서 1600으로 변경 (위로 50px 올림)

    lines.forEach((line, i) => {
        ctx.fillText(line, 540, startY + (i * lineHeight));
    });

    // ── 최하단: 브랜드 워터마크 (아래로 이동) ──
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '35px sans-serif';
    ctx.fillText('UNSE - Premium Fortune Tech', 540, 1870); // 1820에서 1870으로
}

// =====================================
// Download Composite Amulet (가장 완벽한 동기화 방식)
// =====================================
window.downloadCompositeAmulet = function () {
    const canvas = document.getElementById('amulet-composite-canvas');
    if (!canvas) return;
    try {
        // 1. 파일명 동적 생성 (예: 박진호_임관부.jpg)
        const userName = document.getElementById('user-name')?.value || '방문자';
        const amuletName = typeof activeAmuletItem !== 'undefined' && activeAmuletItem ? activeAmuletItem.title : '맞춤부적';
        const fileName = `${userName}_${amuletName}.jpg`;
        // 2. 클릭 찰나의 순간을 놓치지 않기 위해 동기(Sync) 방식으로 데이터 추출
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        // 3. 추출한 데이터를 브라우저 내부에서 즉시 물리적 파일(Blob)로 조립
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        // 4. 완성된 파일의 가상 주소 생성
        const objectUrl = URL.createObjectURL(blob);
        // 5. 강제 다운로드 (클릭 이벤트 스택 안에서 즉시 실행되어 무조건 허용됨)
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = objectUrl;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();

        // 6. 찌꺼기 정리
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
        }, 300);
    } catch (error) {
        console.error('다운로드 오류:', error);
        alert('이미지 저장에 실패했습니다. 다른 브라우저를 이용해주세요.');
    }
};

// 성별 선택 로직
window.selectGender = function (gender) {
    document.getElementById('user-gender').value = gender;
    const maleBtn = document.getElementById('gender-male');
    const femaleBtn = document.getElementById('gender-female');

    // 스타일 초기화 후 선택된 것만 강조
    [maleBtn, femaleBtn].forEach(btn => {
        btn.classList.remove('border-primary', 'bg-primary/5', 'text-primary');
        btn.classList.add('border-slate-100', 'bg-slate-50', 'text-slate-500');
    });

    const selectedBtn = gender === 'male' ? maleBtn : femaleBtn;
    selectedBtn.classList.remove('border-slate-100', 'bg-slate-50', 'text-slate-500');
    selectedBtn.classList.add('border-primary', 'bg-primary/5', 'text-primary');
};

// 시간 모름 토글
window.toggleTimeUnknown = function (checkbox) {
    const displayTime = document.getElementById('display-time');
    if (checkbox.checked) {
        displayTime.style.opacity = '0.4';
        displayTime.style.pointerEvents = 'none';
        document.getElementById('birth-time').value = 'unknown';
        displayTime.innerText = '시간 모름 적용됨';
    } else {
        displayTime.style.opacity = '1';
        displayTime.style.pointerEvents = 'auto';
        document.getElementById('birth-time').value = '';
        displayTime.innerHTML = '시간 선택 <span class="material-symbols-outlined text-[20px]">schedule</span>';
    }
};

// 장소 모름 토글
window.toggleLocationUnknown = function (checkbox) {
    const container = document.getElementById('location-input-container');
    const searchInput = document.getElementById('location-search');
    const feedback = document.getElementById('longitude-feedback');

    if (checkbox.checked) {
        container.style.opacity = '0.4';
        searchInput.disabled = true;
        searchInput.value = '전국 공통 (표준시 적용)';
        document.getElementById('custom-longitude').value = '127.5'; // 한국 표준 경도
        if (feedback) feedback.classList.add('hidden');
    } else {
        container.style.opacity = '1';
        searchInput.disabled = false;
        searchInput.value = '';
        document.getElementById('custom-longitude').value = '126.97';
    }
};

// 인연 추가 모달 열기
window.openAddFriendModal = function () {
    resetGenderSelection();
    const modal = document.getElementById('guest-login-modal');
    if (!modal) return;

    modal.querySelector('h3').innerText = "인연 추가";
    const pTag = modal.querySelector('p');
    if (pTag) pTag.innerText = "궁합을 분석할 지인의 정보를 입력하세요.";

    const submitBtnSpan = modal.querySelector('button[type="submit"] span');
    if (submitBtnSpan) submitBtnSpan.innerText = "인연 등록 및 분석";

    modal.setAttribute('data-mode', 'add-friend');

    const form = document.getElementById('saju-form');
    if (form) form.reset();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

// 시너지 점수 계산 정밀화 (동일 점수 방지)
function calculateSynergyScore(userPillars, friendPillars) {
    if (!userPillars || !friendPillars) return 0;

    const uEls = userPillars.elements;
    const fEls = friendPillars.elements;

    // 1. 부족한 오행 보완 점수 (가중치 1.8배)
    let needed = Object.keys(uEls).reduce((a, b) => uEls[a] < uEls[b] ? a : b);
    let synergy = (fEls[needed] || 0) * 1.8;

    // 2. 일간 합/충 (고유 점수)
    let base = 35;
    const uDM = userPillars.dayMaster.charAt(0);
    const fDM = friendPillars.dayMaster.charAt(0);
    const combos = { "甲": "己", "己": "甲", "乙": "庚", "庚": "乙", "丙": "辛", "辛": "丙", "丁": "壬", "壬": "丁", "戊": "癸", "癸": "戊" };
    if (combos[uDM] === fDM) base += 30;

    // 3. 고유 시드값을 더해 점수 겹침 방지 (해당 인물의 사주 글자 활용)
    const seed = (friendPillars.year.charCodeAt(0) + (friendPillars.day ? friendPillars.day.charCodeAt(0) : 0)) % 15;

    return Math.min(99, Math.round(synergy + base + seed));
}

// 오행 배지 렌더링 포함 리스트 출력
window.renderFriendList = function () {
    const container = document.getElementById('friend-list-container');
    const neededText = document.getElementById('my-needed-energy-text');
    if (!container) return;

    if (!userSajuData) {
        if (neededText) neededText.innerHTML = "먼저 사주를 입력해주세요.";
        return;
    }

    // 나의 부족한 기운 표시
    const myScores = userSajuData.pillars.elements;
    let minEl = Object.keys(myScores).reduce((a, b) => myScores[a] < myScores[b] ? a : b);
    const elNames = { Wood: '목(木)', Fire: '화(火)', Earth: '토(土)', Metal: '금(金)', Water: '수(水)' };
    if (neededText) {
        neededText.innerHTML = `${userSajuData.name}님께 가장 필요한 기운은<br><span class="text-primary-light">${elNames[minEl]}</span>의 에너지입니다.`;
    }

    if (friendList.length === 0) {
        container.innerHTML = `
            <div class="py-16 text-center">
                <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-inner">
                    <span class="material-symbols-outlined text-slate-200 text-[40px]">group_add</span>
                </div>
                <p class="text-slate-400 text-sm font-medium leading-relaxed">아직 등록된 인연이 없습니다.<br>친구, 가족, 동료를 추가해보세요.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = friendList.map((friend, index) => {
        const score = calculateSynergyScore(userSajuData.pillars, friend.pillars);
        const elements = friend.pillars.elements;
        const dominantKey = Object.keys(elements).reduce((a, b) => elements[a] > elements[b] ? a : b);

        const elHnMap = { Wood: '목', Fire: '화', Earth: '토', Metal: '금', Water: '수' };
        const colorMap = {
            Wood: 'bg-[#4ade80]', Fire: 'bg-[#f87171]', Earth: 'bg-[#fbbf24]',
            Metal: 'bg-[#94a3b8]', Water: 'bg-[#60a5fa]'
        };

        return `
            <div class="bg-white border border-slate-100 rounded-[22px] p-5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <span class="material-symbols-outlined text-slate-300">${friend.gender === 'male' ? 'male' : 'female'}</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-slate-800 text-[16px]">${friend.name}</h4>
                            <span class="${colorMap[dominantKey]} text-white text-[12px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                                ${elHnMap[dominantKey]}
                            </span>
                        </div>
                        <p class="text-[11px] text-slate-400 font-medium mt-1">에너지 시너지 분석 완료</p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-[24px] font-black text-slate-900">${score}<span class="text-[10px] ml-0.5 text-slate-400">점</span></div>
                    <div class="mt-1 px-2 py-0.5 bg-primary/5 rounded-full text-primary text-[9px] font-black uppercase tracking-tighter">Harmony</div>
                </div>
            </div>
        `;
    }).join('');
};
// 성별 및 날짜 유형 초기화 함수
function resetGenderSelection() {
    const genderInput = document.getElementById('user-gender');
    if (genderInput) genderInput.value = '';

    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.remove('border-primary', 'bg-primary/5', 'text-primary');
        btn.classList.add('border-slate-100', 'bg-slate-50', 'text-slate-500');
    });
    // 양력 라디오 버튼 초기화
    const solarRadio = document.querySelector('input[name="calendar-type"][value="solar"]');
    if (solarRadio) solarRadio.checked = true;
}
window.resetGenderSelection = resetGenderSelection;
