/**
 * UNSE (운세) - UI Controller & Interactions
 */

let currentChart = null;
let trendChartInstance = null;

// 데이터 관리 변수
let userSajuData = JSON.parse(localStorage.getItem('unse_user_saju') || 'null');
let friendList = JSON.parse(localStorage.getItem('unse_friends') || '[]');
let currentLuckScores = null;

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
    // 전체 화면 관련 코드(requestFullscreen) 삭제

    resetGenderSelection();
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
        welcome.style.display = 'none';
    }

    // 원래 ID로 복구
    const modal = document.getElementById('guest-login-modal');
    if (modal) {
        // 모드 및 텍스트 리셋
        modal.querySelector('h3').innerText = "정보 입력";
        const pTag = modal.querySelector('p');
        if (pTag) pTag.innerText = "정확한 분석을 위해 상세히 입력해주세요.";

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
        // 연도 4자리 초과 입력 철저 방지 (브라우저 특성 대응)
        birthDateInput.addEventListener('input', (e) => {
            const val = e.target.value; // YYYY-MM-DD
            if (!val) return;

            const parts = val.split('-');
            if (parts[0] && parts[0].length > 4) {
                // 연도가 4자리를 넘으면 강제로 자르고 재조합
                const correctedYear = parts[0].slice(0, 4);
                e.target.value = correctedYear + (parts[1] ? '-' + parts[1] : '') + (parts[2] ? '-' + parts[2] : '');
            }
        });

        birthDateInput.addEventListener('change', (e) => {
            const val = e.target.value;
            if (!val) return;
            const yearStr = val.split('-')[0];
            const year = parseInt(yearStr);

            // 최종 제출 전 한 번 더 검증
            if (yearStr.length > 4) {
                e.target.value = yearStr.slice(0, 4) + val.slice(yearStr.length);
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
        n.classList.remove('active', 'text-primary');
        n.classList.add('text-slate-400', 'dark:text-slate-500');
        const icon = n.querySelector('.material-symbols-outlined');
        if (icon) icon.classList.remove('fill-1');
        const text = n.querySelector('.nav-text');
        if (text) {
            text.classList.remove('font-bold');
            text.classList.add('font-medium');
        }
    });

    const activeLink = document.querySelector(`.nav-link[data-target="${tabId}"]`);
    if (activeLink) {
        activeLink.classList.add('active', 'text-primary');
        activeLink.classList.remove('text-slate-400', 'dark:text-slate-500');
        const activeIcon = activeLink.querySelector('.material-symbols-outlined');
        if (activeIcon) activeIcon.classList.add('fill-1');
        const activeText = activeLink.querySelector('.nav-text');
        if (activeText) {
            activeText.classList.remove('font-medium');
            activeText.classList.add('font-bold');
        }
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

        // 양력/음력 변환 로직 보강
        const calendarType = document.querySelector('input[name="calendar-type"]:checked')?.value || 'solar';
        if (calendarType !== 'solar') {
            let sl = window.solarLunar || window.solarlunar;
            if (sl && sl.default) sl = sl.default; // CDN 모듈 대응

            if (!sl || typeof sl.lunar2solar !== 'function') {
                console.error("Lunar conversion library (solarLunar) is missing or invalid.");
                alert("음력 변환 시스템이 로드되지 않았습니다. 페이지를 새로고침 해주세요.");
                return;
            }

            const [y, m, d] = dateStr.split('-').map(Number);
            const isLeap = calendarType === 'leap';

            try {
                const solarInfo = sl.lunar2solar(y, m, d, isLeap);
                if (!solarInfo || !solarInfo.cYear) {
                    throw new Error("Invalid conversion result");
                }
                dateStr = `${solarInfo.cYear}-${String(solarInfo.cMonth).padStart(2, '0')}-${String(solarInfo.cDay).padStart(2, '0')}`;
                console.log(`Lunar (${calendarType}) converted to Solar: ${dateStr}`);
            } catch (err) {
                console.error("Lunar conversion error:", err);
                if (isLeap) {
                    alert("해당 월에는 윤달이 없습니다. 음력(평달)으로 선택하거나 날짜를 확인해주세요.");
                } else {
                    alert("음력 변환 중 오류가 발생했습니다. 정확한 음력 날짜인지 확인해주세요.");
                }
                return;
            }
        }

        const engine = window.sajuEngine;
        if (!engine || typeof engine.getSolarTime !== 'function') {
            console.error("SajuEngine not loaded correctly.");
            alert("시스템 초기화 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.");
            return;
        }

        // 시간 모름 처리
        let correctedDate;
        if (timeStr === 'unknown' || !timeStr) {
            correctedDate = engine.getSolarTime(dateStr, "12:00", customLon);
        } else {
            correctedDate = engine.getSolarTime(dateStr, timeStr, customLon);
        }

        const pillars = engine.calculatePillars(correctedDate);
        if (!pillars) {
            throw new Error("Pillars calculation failed");
        }

        // 인연 추가/수정 모드인 경우
        const mode = guestModal.getAttribute('data-mode');
        if (mode === 'add-friend' || mode === 'edit-friend') {
            const timeUnknown = timeStr === 'unknown' || !timeStr;
            const friendData = {
                name: name,
                gender: gender,
                birthDate: dateStr,
                birthTime: timeStr || "12:00",
                timeUnknown: timeUnknown,
                isLunar: calendarType !== 'solar',
                pillars: pillars,
                addedAt: mode === 'edit-friend' ? friendList[parseInt(guestModal.getAttribute('data-edit-index'))].addedAt : new Date().toISOString()
            };

            if (mode === 'edit-friend') {
                const editIdx = parseInt(guestModal.getAttribute('data-edit-index'));
                friendList[editIdx] = friendData;
            } else {
                friendList.push(friendData);
            }

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
            birthTime: timeStr || "12:00",
            pillars: pillars
        };
        localStorage.setItem('unse_user_saju', JSON.stringify(userSajuData));

        // Switch to Saju tab
        window.switchTab('tab-saju');

        const theme = engine.getThemeColor(pillars.dayMaster);
        const dmHanja = pillars.dayMaster.split('(')[0];
        const dmHangul = window.GAN_HANGUL[window.GAN_LIST.indexOf(dmHanja)];
        const dmElement = pillars.dayMaster.split('(')[1].replace(')', '');

        const profileName = document.querySelector('#display-user-name');
        const profileBirth = document.querySelector('#display-birth-info');
        const dmBadge = document.querySelector('#display-dm-badge'); // 수정된 ID 사용

        if (profileName) profileName.innerText = `${name}`;
        const year = dateStr.split('-')[0];
        const displayTime = (timeStr === 'unknown' || !timeStr) ? '시간 모름' : `진태양시 ${timeStr}`;
        if (profileBirth) profileBirth.innerText = `${year}년생 · ${displayTime}`;

        // dmBadge는 updateModernTraitUI에서도 처리하지만 여기서도 배경색 등 초기화 가능

        const scores = engine.getLuckScores(pillars);
        renderLuckScores(scores);

        const modernInfo = window.sajuEngine.getModernAnalysis(pillars);
        updateModernTraitUI(modernInfo);

        if (typeof updateGoalStyle === 'function') updateGoalStyle(pillars.sipsung);

        generateDailySuggestions(scores);
        updateLuckyItems(scores.luckyItems);
        currentLuckScores = scores;
        updateGuideHeader(name);

        const trendData = engine.getWeeklyTrend(pillars);
        updateTrendChart(trendData);

        replaceBrandName();
        lucide.createIcons();
        window.scrollTo(0, 0);
    } catch (err) {
        console.error("Analysis Error Details:", err);
        alert(`분석 도중 오류가 발생했습니다. (${err.message})`);
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

window.openSmartSuggestionsModal = function () {
    const modal = document.getElementById('smart-suggestions-modal');
    const content = modal.querySelector('div');
    if (!modal || !currentLuckScores) return;

    // 데이터 채우기
    const tipEl = document.getElementById('modal-daily-tip');
    if (tipEl) tipEl.innerText = currentLuckScores.dailyTip || "활기찬 하루 보내세요!";

    const detailContainer = document.getElementById('modal-luck-details');
    if (detailContainer) {
        const categories = [
            { key: 'money', label: '재물운', emoji: '💰', desc: currentLuckScores.moneyDesc, color: 'text-amber-500' },
            { key: 'career', label: '직업운', emoji: '💼', desc: currentLuckScores.careerDesc, color: 'text-blue-500' },
            { key: 'health', label: '건강운', emoji: '💚', desc: currentLuckScores.healthDesc, color: 'text-emerald-500' },
            { key: 'love', label: '애정운', emoji: '💘', desc: currentLuckScores.loveDesc, color: 'text-rose-500' }
        ];

        detailContainer.innerHTML = categories.map(cat => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${cat.emoji}</span>
                        <span class="text-sm font-bold text-slate-800 dark:text-slate-100">${cat.label}</span>
                    </div>
                    <span class="text-sm font-black ${cat.color}">${currentLuckScores[cat.key]}점</span>
                </div>
                <p class="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed break-keep">
                    ${cat.desc}
                </p>
            </div>
        `).join('');
    }

    const numEl = document.getElementById('modal-luck-number');
    const dirEl = document.getElementById('modal-luck-direction');
    if (numEl) numEl.innerText = currentLuckScores.luckyItems?.number || "--";
    if (dirEl) dirEl.innerText = currentLuckScores.luckyItems?.direction || "--";

    // 모달 표시
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('translate-y-full');
    }, 10);
};

window.closeSmartSuggestionsModal = function () {
    const modal = document.getElementById('smart-suggestions-modal');
    const content = modal.querySelector('div');
    if (!modal) return;

    content.classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
};

function renderLuckScores(scores) {
    if (!scores) return;

    // 1. 메인 총점 및 총평
    const totalScoreEl = document.getElementById('luck-total-score');
    const summaryTextEl = document.getElementById('luck-summary-text');
    const totalTrendEl = document.getElementById('luck-total-trend');

    if (totalScoreEl) totalScoreEl.innerText = `${scores.total}점`;
    // shortSummary가 있으면 그것을, 없으면 일반 summary를 사용
    if (summaryTextEl) summaryTextEl.innerText = scores.shortSummary || scores.summary || "분석 완료";

    // 트렌드 (어제 대비 % 계산)
    if (totalTrendEl && userSajuData) {
        const trendData = window.SajuEngine ? window.SajuEngine.getWeeklyTrend(userSajuData.pillars) : [];
        if (trendData.length >= 3) {
            const diff = trendData[2].score - trendData[1].score;
            const sign = diff >= 0 ? "arrow_upward" : "arrow_downward";
            const color = diff >= 0 ? "text-emerald-500" : "text-rose-500";
            totalTrendEl.className = `${color} text-sm font-bold flex items-center`;
            totalTrendEl.innerHTML = `<span class="material-symbols-outlined text-sm">${sign}</span>${Math.abs(diff)}%`;
        }
    }

    // 2. 상세 지표 매핑 (바 + 텍스트)
    const indicators = [
        { key: 'money', scoreId: 'luck-money-score', barId: 'luck-money-bar' },
        { key: 'career', scoreId: 'luck-work-score', barId: 'luck-work-bar' },
        { key: 'health', scoreId: 'luck-health-score', barId: 'luck-health-bar' },
        { key: 'love', scoreId: 'luck-love-score', barId: 'luck-love-bar' }
    ];

    indicators.forEach(item => {
        const val = scores[item.key] || 0;
        const sEl = document.getElementById(item.scoreId);
        const bEl = document.getElementById(item.barId);
        if (sEl) sEl.innerText = `${val}%`;
        if (bEl) bEl.style.width = `${val}%`;
    });
}

function updateModernTraitUI(info) {
    if (!userSajuData || !info) return;

    // 이름 및 배지 매핑
    const nameEl = document.getElementById('display-user-name');
    if (nameEl) nameEl.innerText = userSajuData.name;

    const dmBadgeEl = document.getElementById('display-dm-badge');
    if (dmBadgeEl) dmBadgeEl.innerText = info.title;

    const birthInfoEl = document.getElementById('display-birth-info');
    if (birthInfoEl) {
        birthInfoEl.innerText = `${userSajuData.birthDate} · ${userSajuData.gender === 'male' ? '남성' : '여성'}`;
    }

    const pillarsTextEl = document.getElementById('display-pillars-text');
    if (pillarsTextEl) {
        pillarsTextEl.innerText = `${userSajuData.pillars.yearHangul}년 ${userSajuData.pillars.monthHangul}월 ${userSajuData.pillars.dayHangul}일 ${userSajuData.pillars.timeHangul}시`;
    }

    // 슬로건 줄바꿈 처리
    const sloganContainer = document.getElementById('display-user-slogan');
    if (sloganContainer && info.slogan) {
        const rawSlogan = info.slogan;
        if (rawSlogan.includes(':')) {
            const parts = rawSlogan.split(':');
            sloganContainer.innerHTML = `${parts[0].trim()}:<br>${parts[1].trim()}`;
        } else {
            sloganContainer.innerText = rawSlogan;
        }
    }

    const summaryEl = document.getElementById('saju-comprehensive-summary');
    if (summaryEl) {
        summaryEl.innerHTML = `<span class="font-bold text-primary">총평:</span> ${info.comprehensiveDesc}`;
    }

    // 나머지 데이터 렌더링 호출
    renderSajuGrid(userSajuData.pillars);
    renderElementBalance(userSajuData.pillars);

    const avatarImg = document.getElementById('profile-avatar');
    if (avatarImg && info.dmElement) {
        const avatarMap = { Wood: 'wood_avatar.png', Fire: 'fire_avatar.png', Earth: 'earth_avatar.png', Metal: 'metal_avatar.png', Water: 'water_avatar.png' };
        const defaultAvatar = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix';
        avatarImg.src = avatarMap[info.dmElement] || defaultAvatar;
        avatarImg.onerror = () => { avatarImg.src = defaultAvatar; };
    }
}

function renderSajuGrid(pillars) {
    const container = document.getElementById('saju-grid-container');
    if (!container) return;

    const titles = ["시주", "일주", "월주", "연주"];
    const heaven = [pillars.hour.charAt(0), pillars.day.charAt(0), pillars.month.charAt(0), pillars.year.charAt(0)];
    const earth = [pillars.hour.charAt(1), pillars.day.charAt(1), pillars.month.charAt(1), pillars.year.charAt(1)];

    const getElementColorClass = (char) => {
        const el = window.FIVE_ELEMENTS[char];
        if (el === 'Fire') return 'text-[#f87171]';
        if (el === 'Water') return 'text-[#60a5fa]';
        if (el === 'Wood') return 'text-[#4ade80]';
        if (el === 'Earth') return 'text-[#fbbf24]';
        return 'text-[#94a3b8]';
    };

    const getElementKr = (char) => {
        const el = window.FIVE_ELEMENTS[char];
        const map = { Wood: '목', Fire: '화', Earth: '토', Metal: '금', Water: '수' };
        return map[el] || "";
    };

    let html = titles.map((t, i) => `
        <div class="text-center text-[13px] font-bold ${i === 1 ? 'text-primary underline decoration-2 underline-offset-8' : 'text-slate-400'} py-2">
            ${t}
        </div>
    `).join('');

    // 천간 4개
    heaven.forEach((char, i) => {
        const colorClass = getElementColorClass(char);
        html += `
            <div class="aspect-square bg-white border ${i === 1 ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-slate-100 shadow-sm'} rounded-[24px] flex flex-col items-center justify-center transition-transform active:scale-95">
                <span class="${colorClass} font-black text-[26px] leading-none mb-1">${char}</span>
                <span class="text-[11px] font-bold ${i === 1 ? 'text-primary' : 'text-slate-300'}">${window.SajuEngine.getGanHangul(char)}${getElementKr(char)}</span>
            </div>`;
    });

    // 지지 4개
    earth.forEach((char, i) => {
        const colorClass = getElementColorClass(char);
        html += `
            <div class="aspect-square bg-white border ${i === 1 ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-slate-100 shadow-sm'} rounded-[24px] flex flex-col items-center justify-center transition-transform active:scale-95">
                <span class="${colorClass} font-black text-[26px] leading-none mb-1">${char}</span>
                <span class="text-[11px] font-bold ${i === 1 ? 'text-primary' : 'text-slate-300'}">${window.SajuEngine.getJiHangul(char)}${getElementKr(char)}</span>
            </div>`;
    });

    container.innerHTML = html;
}

function renderElementBalance(pillars) {
    const scores = window.SajuEngine.getElementScores(pillars);
    const container = document.getElementById('element-balance-list');
    if (!container) return;

    const elConfig = [
        { key: 'Wood', name: '목(木)', icon: 'park', color: 'bg-[#4ade80]', text: 'text-[#166534]' },
        { key: 'Fire', name: '화(火)', icon: 'local_fire_department', color: 'bg-[#f87171]', text: 'text-[#991b1b]' },
        { key: 'Earth', name: '토(土)', icon: 'terrain', color: 'bg-[#fbbf24]', text: 'text-[#854d0e]' },
        { key: 'Metal', name: '금(金)', icon: 'circle', color: 'bg-[#94a3b8]', text: 'text-[#475569]' },
        { key: 'Water', name: '수(水)', icon: 'water_drop', color: 'bg-[#60a5fa]', text: 'text-[#1e40af]' }
    ];

    container.innerHTML = elConfig.map(el => {
        const score = scores[el.key] || 0;
        const count = Math.round(score / 12.5);
        let status = "적정";
        let statusClass = "bg-primary/5 text-primary border-primary/20";
        if (count === 0) { status = "고립"; statusClass = "bg-purple-50 text-purple-600 border-purple-100"; }
        else if (count <= 1) { status = "부족"; statusClass = "bg-slate-100 text-slate-500 border-slate-200"; }
        else if (count >= 4) { status = "과다"; statusClass = "bg-red-50 text-red-600 border-red-100"; }

        return `
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2.5">
                        <span class="material-symbols-outlined text-[20px] ${el.text}">${el.icon}</span>
                        <span class="text-[15px] font-black ${el.text}">${el.name}</span>
                    </div>
                    <span class="text-[11px] font-bold ${statusClass} px-2 py-0.5 rounded-full border">
                        ${status} (${count})
                    </span>
                </div>
                <div class="w-full bg-slate-100 h-[7px] rounded-full overflow-hidden">
                    <div class="${el.color} h-full rounded-full transition-all duration-1000" style="width: ${Math.max(4, score)}%"></div>
                </div>
            </div>`;
    }).join('');
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

function generateDailySuggestions(scores) {
    const container = document.getElementById('smart-suggestions-container');
    if (!container || !scores) return;

    // 점수에 따른 맞춤 제안 생성
    const suggestions = [];

    if (scores.money >= 80) {
        suggestions.push({
            title: "재테크 관련 정보를 수집해보세요",
            desc: "금전운이 좋아 새로운 투자처를 찾기에 적합합니다.",
            icon: "trending_up",
            color: "bg-slate-200"
        });
    }

    if (scores.career >= 80) {
        suggestions.push({
            title: "중요한 미팅은 오후에 배치하세요",
            desc: "오늘 커리어 운의 흐름이 오후에 가장 강력합니다.",
            icon: "lightbulb",
            color: "bg-primary text-white"
        });
    } else {
        suggestions.push({
            title: "서류 정리에 집중하기 좋은 날입니다",
            desc: "새로운 도전보다는 기존 업무를 마무리하는 것이 길합니다.",
            icon: "edit_document",
            color: "bg-slate-200"
        });
    }

    if (scores.love >= 80) {
        suggestions.push({
            title: "먼저 연락을 건네보세요",
            desc: "인복과 애정운이 상승하여 따뜻한 반응을 얻을 수 있습니다.",
            icon: "favorite",
            color: "bg-rose-100"
        });
    }

    container.innerHTML = suggestions.slice(0, 2).map((s, idx) => `
        <div class="flex items-center gap-4 p-4 ${idx === 0 ? 'bg-primary/5 border-primary/10' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'} rounded-xl border">
            <div class="size-10 shrink-0 ${s.color} rounded-full flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">${s.icon}</span>
            </div>
            <div class="flex-1">
                <p class="text-sm font-bold text-slate-900 dark:text-slate-100">${s.title}</p>
                <p class="text-[11px] text-slate-500 mt-1">${s.desc}</p>
            </div>
        </div>
    `).join('');
}

function updateLuckyItems(luckyItems) {
    if (!luckyItems) return;

    const colorEl = document.getElementById('luck-color-value');
    const timeEl = document.getElementById('luck-time-value');
    const foodEl = document.getElementById('luck-food-value');

    if (colorEl) colorEl.innerText = luckyItems.color.name;
    if (timeEl) {
        const timeStr = luckyItems.business.time || "--:--";
        if (timeStr.includes('시')) {
            const match = timeStr.match(/(\d+)시/);
            if (match) {
                let hour = parseInt(match[1]);
                if (timeStr.includes('오후') && hour < 12) hour += 12;
                if (timeStr.includes('오전') && hour === 12) hour = 0;
                timeEl.innerText = `${hour.toString().padStart(2, '0')}:00`;
            } else {
                timeEl.innerText = timeStr;
            }
        } else {
            timeEl.innerText = timeStr;
        }
    }
    if (foodEl) foodEl.innerText = luckyItems.food.name;
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
    const svgFill = document.getElementById('trend-svg-fill');
    const svgLine = document.getElementById('trend-svg-line');
    const pointsGroup = document.getElementById('trend-svg-points');
    if (!svgFill || !svgLine) return;

    // ViewBox width: 400, height: 120
    const mapY = (score) => 100 - (score / 100 * 80); // 0~100 scores -> 100~20 Y values
    const xPositions = [0, 100, 200, 300, 400];
    const points = trendData.map((d, i) => ({ x: xPositions[i], y: mapY(d.score) }));

    // Cubic Bezier Path 생성
    let pathD = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cp1x = p0.x + 50;
        const cp2x = p1.x - 50;
        pathD += ` C ${cp1x},${p0.y} ${cp2x},${p1.y} ${p1.x},${p1.y}`;
    }

    svgLine.setAttribute('d', pathD);
    svgFill.setAttribute('d', `${pathD} V 120 H 0 Z`);

    // 데이터 포인트 드로잉
    if (pointsGroup) {
        pointsGroup.innerHTML = '';
        points.forEach((p, i) => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.style.transition = "all 0.5s ease-in-out";
            if (i === 2) { // 오늘
                circle.setAttribute('r', '7');
                circle.setAttribute('fill', '#256af4');
            } else {
                circle.setAttribute('r', '4');
                circle.setAttribute('fill', 'white');
                circle.setAttribute('stroke', '#256af4');
                circle.setAttribute('stroke-width', '1.5');
            }
            pointsGroup.appendChild(circle);
        });
    }
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

// 시너지 갤럭시 상태 관리
let currentGalaxyFilter = 'all';

window.setGalaxyFilter = function (filter) {
    currentGalaxyFilter = filter;

    // UI 업데이트
    document.querySelectorAll('.galaxy-filter-chip').forEach(chip => {
        chip.classList.remove('active', 'text-white', 'bg-primary/20', 'border-primary/30');
        chip.classList.add('text-white/40', 'bg-white/10', 'border-white/5');

        if (chip.getAttribute('data-filter') === filter) {
            chip.classList.add('active', 'text-white', 'bg-primary/20', 'border-primary/30');
            chip.classList.remove('text-white/40', 'bg-white/10', 'border-white/5');
        }
    });

    renderFriendList(); // 다시 그리기 유도
};

window.openOrbitGlossary = function () {
    const modal = document.getElementById('orbit-glossary-modal');
    const content = modal?.querySelector('.relative');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content?.classList.remove('translate-y-full');
    }, 10);
};

window.closeOrbitGlossary = function () {
    const modal = document.getElementById('orbit-glossary-modal');
    const content = modal?.querySelector('.relative');

    content?.classList.add('translate-y-full');
    setTimeout(() => {
        modal?.classList.remove('flex');
        modal?.classList.add('hidden');
    }, 500);
};

// 시너지 갤럭시 시각화 엔진 (Ultra Premium v2.0)
window.renderSynergyGalaxy = function (friends) {
    const canvas = document.getElementById('galaxy-canvas');
    const sunEl = document.getElementById('user-sun');
    if (!canvas || !userSajuData) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const time = Date.now() * 0.001;

    // [Zone 2.2] Score-based Gravity Rings (Intuition: Distance = Score Tier)
    const tiers = [
        { score: 90, r: 65, label: 'Soulmate' },
        { score: 80, r: 125, label: 'Synergy' },
        { score: 70, r: 185, label: 'Network' }
    ];

    const userDM = userSajuData.pillars.dayMaster.charAt(0);
    const userEl = FIVE_ELEMENTS[userDM];
    const userColor = SajuEngine.getElementColor(userEl);

    if (sunEl) {
        // 1. 맥동 수치 계산 (별들과 싱크를 맞추기 위해 time 변수 활용)
        const sunPulse = Math.sin(time * 2) * 10; // ±10px 범위로 숨쉼
        const sunBrightness = 0.6 + Math.sin(time * 2) * 0.2; // 밝기 자동 조절

        // 2. Metal(금) 오행 보정: 너무 탁하지 않게 화이트를 섞음
        let glowColor = userColor;
        if (userDM === '庚' || userDM === '辛') glowColor = '#E2E8F0';

        sunEl.style.backgroundColor = userColor;
        // 3. 3중 중첩 그림자로 태양 광원 효과 극대화
        sunEl.style.boxShadow = `
            0 0 ${20 + sunPulse}px #FFFFFFCC,             /* 중심부: 화이트 광원 */
            0 0 ${40 + sunPulse * 2}px ${glowColor}AA,    /* 중간부: 오행 고유광 */
            0 0 ${80 + sunPulse * 4}px ${glowColor}44     /* 외곽부: 은은한 잔상 */
        `;

        const sunDMText = document.getElementById('user-sun-dm');
        if (sunDMText) {
            sunDMText.innerText = userDM;
            sunDMText.style.opacity = sunBrightness; // 글자도 같이 맥동
        }
    }

    ctx.clearRect(0, 0, rect.width, rect.height);

    // 2. [Permanent Sector Guides] 5대 섹터 가이드 (12시 기준 72도 분할)
    const sectorLabels = ["지원군(인성)", "동료(비겁)", "창의(식상)", "성과(재성)", "성장(관성)"];
    for (let i = 0; i < 5; i++) {
        const angle = (-90 + (i * 72)) * (Math.PI / 180); // 12시부터 시작

        // 섹터 구분 점선 (항상 보임)
        ctx.beginPath();
        ctx.setLineDash([3, 6]);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + 220 * Math.cos(angle), centerY + 220 * Math.sin(angle));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'; // 시인성 확보
        ctx.stroke();

        // 섹터 이름 라벨 배치 (부채꼴 중앙 궤도 바깥)
        const midAngle = (-54 + (i * 72)) * (Math.PI / 180);
        const labelRadius = centerX * 0.82; // 210 대신 안전한 안쪽 반지름 설정
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sectorLabels[i], centerX + labelRadius * Math.cos(midAngle), centerY + labelRadius * Math.sin(midAngle));
    }
    ctx.setLineDash([]);

    // 3. [Atmospheric Sector Glow] 필터 활성화 시 하이라이트
    const activeSectors = [];
    if (currentGalaxyFilter === 'boost') activeSectors.push(0, 2); // 지원군, 창의
    if (currentGalaxyFilter === 'challenge') activeSectors.push(3, 4); // 성과, 성장

    activeSectors.forEach(sIdx => {
        const start = (-90 + (sIdx * 72)) * (Math.PI / 180);
        const end = start + (72 * (Math.PI / 180));
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, 200, start, end); // 강조 반경
        ctx.closePath();

        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 200);
        grad.addColorStop(0, 'transparent');
        const glowColor = currentGalaxyFilter === 'boost' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)';
        grad.addColorStop(1, glowColor);
        ctx.fillStyle = grad;
        ctx.fill();
    });

    // 4. [Gravity Tiers] 동심원 및 곡선 라벨 (시인성 강화)
    tiers.forEach(tier => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, tier.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; // 라인 더 선명하게
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(45 * Math.PI / 180);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // 글자 더 선명하게
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tier.label, 0, -tier.r - 5);
        ctx.restore();
    });    // Draw Friends with Density Awareness
    friends.forEach((f, idx) => {
        const analysis = SajuEngine.analyzeRelationship(userSajuData.pillars, f.pillars);
        if (!analysis) return;

        // Filter Logic & Mode Activity
        let displayAlpha = 1.0;
        let isModeActive = true;

        if (currentGalaxyFilter === 'boost' && !(analysis.orbit === 1 || analysis.orbit === 3)) {
            displayAlpha = 0.15;
            isModeActive = false;
        }
        if (currentGalaxyFilter === 'challenge' && !(analysis.orbit === 4 || analysis.orbit === 5)) {
            displayAlpha = 0.15;
            isModeActive = false;
        }

        // [Radial Architecture] Sector Mapping (Standardized 72 deg blocks)
        // S1: -90 to -18, S2: -18 to 54, S3: 54 to 126, S4: 126 to 198, S5: 198 to 270
        const startDeg = -90 + (analysis.orbit - 1) * 72;
        const endDeg = startDeg + 72;
        const midAngle = (startDeg + endDeg) / 2;
        const spread = 45; // Degrees to spread stars within sector

        // Wobble oscillation for organic feel
        const wobble = Math.sin(time + idx) * (spread / 4);
        const targetAngle = (midAngle + wobble) * (Math.PI / 180);

        // Distance = Gravity (Score-based radius)
        // 100pt -> 60px (Sun center), 60pt -> 180px (Galaxy edge)
        const radius = 60 + (100 - analysis.score) * 3;

        const x = centerX + radius * Math.cos(targetAngle);
        const y = centerY + radius * Math.sin(targetAngle);

        // Massive Scaling for High Scores
        const massFactor = Math.pow(analysis.score / 100, 2);
        const starSize = 3 + (massFactor * 6); // Up to 9px
        const glowRadius = 15 + (massFactor * 25); // Up to 40px glow

        // Pulse effect for high scores
        const pulse = (analysis.score > 90) ? Math.sin(time * 4) * 2 : 0;

        // Specialized Mode Effects
        if (currentGalaxyFilter === 'boost' && isModeActive) { // Boost: Energy Flows
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.quadraticCurveTo(
                centerX + radius / 2 * Math.cos(targetAngle - 0.2),
                centerY + radius / 2 * Math.sin(targetAngle - 0.2),
                x, y
            );
            ctx.strokeStyle = `${analysis.frElColor}44`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Glow (Enhanced for active modes)
        const glowMult = isModeActive ? 1.5 : 1.0;
        const activeGlow = glowRadius * glowMult;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, activeGlow);
        gradient.addColorStop(0, analysis.frElColor);
        if (currentGalaxyFilter === 'challenge' && isModeActive) {
            gradient.addColorStop(0.3, '#fbbf24'); // Gold spark for Challenge mode
        }
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.globalAlpha = (0.5 + Math.sin(time * 3 + idx) * 0.2) * displayAlpha;
        ctx.beginPath();
        ctx.arc(x, y, activeGlow + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Core star (Brighter and larger for high scores)
        ctx.globalAlpha = displayAlpha;
        ctx.fillStyle = '#ffffff';
        if (analysis.score > 90) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = (currentGalaxyFilter === 'challenge' && isModeActive) ? '#fbbf24' : '#ffffff';
        }
        ctx.beginPath();
        ctx.arc(x, y, starSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label (High contrast)
        if (displayAlpha > 0.5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(f.name, x, y + 25);

            // Score Badge inside Galaxy
            ctx.fillStyle = (currentGalaxyFilter === 'challenge' && isModeActive) ? '#fbbf24' : analysis.frElColor;
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(`${analysis.score}pt`, x, y - 15);
        }
    });

    const sectorInfo = [
        { title: "지원군 (인성)", desc: "나를 돕는 기운입니다. 든든한 멘토와 지원군이 여기에 위치합니다." },
        { title: "동료 (비겁)", desc: "나와 같은 기운입니다. 함께 달리는 친구와 동료들이 위치합니다." },
        { title: "창의 (식상)", desc: "내가 생(生)하는 기운입니다. 나의 재능을 발현시키는 인연들입니다." },
        { title: "성과 (재성)", desc: "내가 다스리는 기운입니다. 실질적인 성취와 수익을 돕는 파트너입니다." },
        { title: "성장 (관성)", desc: "나를 극(剋)하는 기운입니다. 나의 가치를 높이고 규율을 잡아주는 리더입니다." }
    ];

    canvas.onclick = function (e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - (rect.width / 2);
        const y = e.clientY - rect.top - (rect.height / 2);

        // 1. 각도 판별 (12시 방향 기준 72도씩)
        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;
        const sIdx = Math.floor(angle / 72) % 5;

        // 2. 해당 섹터 인원수 실시간 계산
        const count = friends.filter(f => {
            const analysis = SajuEngine.analyzeRelationship(userSajuData.pillars, f.pillars);
            return (analysis.orbit - 1) === sIdx;
        }).length;

        // 3. UI 업데이트 및 표시
        const tooltip = document.getElementById('sector-tooltip');
        if (!tooltip) return;

        document.getElementById('tooltip-title').innerText = sectorInfo[sIdx].title;
        document.getElementById('tooltip-desc').innerText = sectorInfo[sIdx].desc;
        document.getElementById('tooltip-count').innerText = `${count}명`;

        // 위치 조정 (터치 지점 상단에 오도록 하되, 화면 밖으로 나가지 않게 조절)
        let left = e.clientX - rect.left - (tooltip.offsetWidth / 2);
        let top = e.clientY - rect.top - tooltip.offsetHeight - 15;

        // 좌우 경계 체크 (Safe-Area Awareness)
        if (left < 10) left = 10;
        if (left + tooltip.offsetWidth > rect.width - 10) left = rect.width - tooltip.offsetWidth - 10;

        // 상단 경계 체크 (너무 위면 터치 지점 아래로 표시)
        if (top < 10) {
            top = e.clientY - rect.top + 20;
            // 말꼬리 위치 조정 (생략 가능하지만 옵션으로 처리)
            const arrow = tooltip.querySelector('div:last-child');
            if (arrow) arrow.style.display = 'none'; // 아래로 나올 땐 화살표 숨김
        } else {
            const arrow = tooltip.querySelector('div:last-child');
            if (arrow) arrow.style.display = 'block';
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;

        tooltip.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        tooltip.classList.add('opacity-100', 'scale-100');

        // 터치/클릭 시 즉시 숨기기 (사용자 요청)
        tooltip.onclick = () => {
            tooltip.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            tooltip.classList.remove('opacity-100', 'scale-100');
            if (window.tooltipTimer) clearTimeout(window.tooltipTimer);
        };

        // 4초 후 자동 숨김
        if (window.tooltipTimer) clearTimeout(window.tooltipTimer);
        window.tooltipTimer = setTimeout(() => {
            tooltip.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
            tooltip.classList.remove('opacity-100', 'scale-100');
        }, 4000);
    };

    if (document.getElementById('tab-network').classList.contains('active')) {
        requestAnimationFrame(() => renderSynergyGalaxy(friends));
    }
}

// 오행 배지 렌더링 포함 리스트 출력 (Galaxy Version)
window.renderFriendList = function () {
    const container = document.getElementById('friend-list-container');
    const insightTitle = document.getElementById('synergy-insight-title');
    const insightDesc = document.getElementById('synergy-insight-desc');

    if (!container) return;

    if (!userSajuData) {
        if (insightTitle) insightTitle.innerText = "먼저 사주를 입력해주세요.";
        return;
    }

    // AI Insight Logic
    const myElements = userSajuData.pillars.elements;
    const weakestEl = Object.keys(myElements).reduce((a, b) => myElements[a] < myElements[b] ? a : b);
    const elNames = { Wood: '목(木)', Fire: '화(火)', Earth: '토(土)', Metal: '금(金)', Water: '수(水)' };

    const missingLinkFriends = friendList.filter(f => {
        const fElements = f.pillars.elements;
        const fStrongest = Object.keys(fElements).reduce((a, b) => fElements[a] > fElements[b] ? a : b);
        return fStrongest === weakestEl;
    });

    if (insightTitle) {
        if (missingLinkFriends.length > 0) {
            insightTitle.innerText = `${userSajuData.name}님의 부족한 ${elNames[weakestEl]} 기운을 채워줄 귀인이 있습니다.`;
            insightDesc.innerText = `${missingLinkFriends[0].name}님과 소통하면 시너지 효과가 극대화됩니다.`;
        } else {
            insightTitle.innerText = `${userSajuData.name}님의 시너지 갤럭시가 확장 중입니다.`;
            insightDesc.innerText = `현재 가장 필요한 기운은 ${elNames[weakestEl]}입니다. 이 기운을 가진 분들을 초대해보세요.`;
        }
    }

    if (friendList.length === 0) {
        container.innerHTML = `
            <div class="py-10 text-center">
                <p class="text-white/20 text-sm">등록된 인연이 없습니다.</p>
            </div>
        `;
        renderSynergyGalaxy([]);
        return;
    }

    // Render Galaxy
    renderSynergyGalaxy(friendList);

    // Render Smart List
    container.innerHTML = friendList.map((friend, index) => {
        const analysis = SajuEngine.analyzeRelationship(userSajuData.pillars, friend.pillars);
        if (!analysis) return '';

        return `
            <div onclick="openSynergyReport(${index})" class="bg-white/5 backdrop-blur-md border border-white/5 rounded-[24px] p-5 flex items-center justify-between active:scale-[0.98] transition-all">
                <div class="flex items-center gap-4">
                    <div class="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <span class="material-symbols-outlined text-white/30">${friend.gender === 'male' ? 'face' : 'face_3'}</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-white text-[16px]">${friend.name}</h4>
                            <span class="text-white/80 text-[10px] bg-white/10 px-2 py-0.5 rounded-lg border border-white/20 font-bold">Orbit ${analysis.orbit}</span>
                        </div>
                        <div class="flex items-center gap-1.5 mt-1">
                            <span class="size-2 rounded-full" style="background-color: ${analysis.frElColor}"></span>
                            <p class="text-[11px] text-white/70 font-bold tracking-tight">${analysis.sipsung} · ${analysis.orbitName}</p>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-[24px] font-black text-white leading-none">${analysis.score}<span class="text-[10px] ml-0.5 text-white/50">점</span></div>
                    <div class="mt-2 px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/20 shadow-lg">SYNERGY</div>
                </div>
            </div>
        `;
    }).join('');
};

window.openSynergyReport = function (index) {
    const friend = friendList[index];
    if (!friend || !userSajuData) return;

    const analysis = SajuEngine.analyzeRelationship(userSajuData.pillars, friend.pillars);
    const modal = document.getElementById('synergy-report-modal');
    const content = modal?.querySelector('.relative');

    if (!analysis || !modal) return;

    // Fill Data
    document.getElementById('report-orbit-label').innerText = `Orbit ${analysis.orbit}`;
    document.getElementById('report-title').innerText = `${userSajuData.name} & ${friend.name}`;
    document.getElementById('report-score').innerHTML = `${analysis.score}<span class="text-xs ml-0.5 text-white/30">점</span>`;
    document.getElementById('report-role-name').innerText = `${analysis.orbitName} (${analysis.sipsung})`;

    // Custom Description
    const elKr = { Wood: '목(木)', Fire: '화(火)', Earth: '토(토)', Metal: '금(金)', Water: '수(水)' };
    const myElements = userSajuData.pillars.elements;
    const weakestEl = Object.keys(myElements).reduce((a, b) => myElements[a] < myElements[b] ? a : b);
    const frElements = friend.pillars.elements;
    const frStrongest = Object.keys(frElements).reduce((a, b) => frElements[a] > frElements[b] ? a : b);

    let desc = `${friend.name}님은 ${userSajuData.name}님에게 부족한 '${elKr[weakestEl]}' 기운을 보완해주는 탁월한 ${analysis.orbitName}입니다. `;
    if (frStrongest === weakestEl) {
        desc += `특히 ${friend.name}님의 강력한 ${elKr[frStrongest]} 에너지는 사용자님의 운명적 결함을 완벽하게 메워주는 'Missing Link' 역할을 합니다.`;
    } else {
        desc += `서로의 가치관을 존중하며 함께할 때 더 큰 시너지를 발휘할 수 있는 관계입니다.`;
    }

    document.getElementById('report-desc').innerText = desc;
    document.getElementById('report-energy-type').innerText = `${elKr[FIVE_ELEMENTS[userSajuData.pillars.dayMaster.charAt(0)]]} ↔ ${elKr[analysis.frEl]}`;
    document.getElementById('report-tag').innerText = analysis.orbit === 4 ? "비즈니스 기회" : analysis.orbit === 1 ? "정서적 안정" : "함께 성장";

    // Setup Edit / Delete Listeners
    const editBtn = document.getElementById('report-edit-btn');
    const deleteBtn = document.getElementById('report-delete-btn');

    if (editBtn) editBtn.onclick = () => editFriend(index);
    if (deleteBtn) deleteBtn.onclick = () => deleteFriend(index);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content?.classList.remove('translate-y-full');
    }, 10);
}

window.deleteFriend = function (index) {
    if (!confirm("이 인연을 정말로 삭제하시겠습니까?")) return;

    friendList.splice(index, 1);
    localStorage.setItem('unse_friends', JSON.stringify(friendList));
    renderFriendList();
    closeSynergyReport();
}

window.editFriend = function (index) {
    const friend = friendList[index];
    if (!friend) return;

    closeSynergyReport();
    openAddFriendModal(); // Reset and Open

    const modal = document.getElementById('guest-login-modal');
    modal.setAttribute('data-mode', 'edit-friend');
    modal.setAttribute('data-edit-index', index);
    modal.querySelector('h3').innerText = "인연 정보 수정";
    modal.querySelector('button[type="submit"] span').innerText = "수정 완료 및 재분석";

    // Fill Existing Info
    document.querySelector('#user-name').value = friend.name;
    document.querySelector('#birth-date').value = friend.birthDate;
    document.querySelector('#birth-time').value = friend.birthTime || "12:00";
    document.getElementById('user-gender').value = friend.gender;

    // Set Visual Selecteds for UI consistency
    document.querySelectorAll('.gender-btn').forEach(btn => {
        // Remove 'selected' from all first
        btn.classList.remove('border-primary', 'bg-primary/5', 'text-primary');
        btn.classList.add('border-slate-100', 'bg-slate-50', 'text-slate-500');

        if (btn.dataset.gender === friend.gender) {
            btn.classList.add('border-primary', 'bg-primary/5', 'text-primary');
            btn.classList.remove('border-slate-100', 'bg-slate-50', 'text-slate-500');
        }
    });

    // Set calendar type
    const calendarType = friend.isLunar ? 'lunar' : 'solar';
    document.querySelector(`input[name="calendar-type"][value="${calendarType}"]`).checked = true;
}

window.closeSynergyReport = function () {
    const modal = document.getElementById('synergy-report-modal');
    const content = modal?.querySelector('.relative');
    if (!modal || !content) return;

    content.classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 400);
}

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
