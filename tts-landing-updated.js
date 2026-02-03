// =========================================
// TIKME TTS LANDING PAGE - JAVASCRIPT
// WITH BACKEND INTEGRATION
// =========================================

(function() {
    'use strict';

    // ============ CONFIG ============
    const API_BASE = '/.netlify/functions'; // Netlify Functions endpoint
    
    // ============ STATE ============
    const AppState = {
        sessionId: getOrCreateSessionId(),
        currentFilter: 'all',
        quizStep: 0,
        quizAnswers: [],
    };

    // ============ DOM ELEMENTS ============
    const DOM = {
        leadForm: document.getElementById('lead-form'),
        scrollTopBtn: document.getElementById('scroll-top'),
        industryFilters: document.querySelectorAll('.filter-btn'),
        faqItems: document.querySelectorAll('.faq-item'),
        calcIndustry: document.getElementById('calc-industry'),
        calcOT: document.getElementById('calc-ot'),
        calcYears: document.getElementById('calc-years'),
    };

    // ============ INITIALIZATION ============
    function init() {
        console.log('🚀 TTS Landing Page Loading...');
        
        setupEventListeners();
        initScrollEffects();
        initCalculator();
        initFAQ();
        initIndustryFilters();
        trackPageView();
        
        console.log('✅ Landing Page Ready');
    }

    // ============ SESSION MANAGEMENT ============
    function getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('tikme_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('tikme_session_id', sessionId);
        }
        return sessionId;
    }

    // ============ API CALLS ============
    async function submitLead(formData) {
        try {
            const response = await fetch(`${API_BASE}/submit-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    utm_source: getUrlParam('utm_source'),
                    utm_medium: getUrlParam('utm_medium'),
                    utm_campaign: getUrlParam('utm_campaign'),
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error);
            }

            return data;
        } catch (error) {
            console.error('Submit error:', error);
            throw error;
        }
    }

    async function saveQuizResults(answers, topIndustries) {
        try {
            const response = await fetch(`${API_BASE}/save-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: AppState.sessionId,
                    answers,
                    top_industries: topIndustries
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Quiz save error:', error);
        }
    }

    async function trackPageView() {
        try {
            const response = await fetch(`${API_BASE}/track-pageview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_url: window.location.href,
                    session_id: AppState.sessionId,
                    utm_source: getUrlParam('utm_source'),
                    utm_medium: getUrlParam('utm_medium'),
                    utm_campaign: getUrlParam('utm_campaign'),
                    referrer: document.referrer
                })
            });
        } catch (error) {
            console.error('Tracking error:', error);
        }
    }

    // ============ FORM HANDLING ============
    function setupEventListeners() {
        if (DOM.leadForm) {
            DOM.leadForm.addEventListener('submit', handleFormSubmit);
        }

        if (DOM.scrollTopBtn) {
            DOM.scrollTopBtn.addEventListener('click', scrollToTop);
        }

        window.addEventListener('scroll', handleScroll);

        if (DOM.calcIndustry) DOM.calcIndustry.addEventListener('change', calculateIncome);
        if (DOM.calcOT) DOM.calcOT.addEventListener('change', calculateIncome);
        if (DOM.calcYears) DOM.calcYears.addEventListener('change', calculateIncome);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Đang gửi...</span>';

        try {
            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                program: formData.get('program'),
                industry: formData.get('industry'),
            };

            // Validate
            if (!validatePhone(data.phone)) {
                throw new Error('Số điện thoại không hợp lệ!');
            }

            // Submit to backend
            const result = await submitLead(data);

            // Show success modal
            showSuccessModal(data, result);

            // Reset form
            e.target.reset();

            // Track conversion
            if (window.gtag) {
                gtag('event', 'lead_submitted', {
                    program: data.program,
                    industry: data.industry
                });
            }

        } catch (error) {
            showNotification('❌ ' + error.message, 'error');
        } finally {
            // Restore button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    function validatePhone(phone) {
        const phoneRegex = /^(0|\+84)[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    function showSuccessModal(data, result) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
                <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: var(--primary);">
                    Đăng ký thành công!
                </h2>
                <p style="font-size: 1.125rem; color: var(--gray-700); margin-bottom: 2rem;">
                    Cảm ơn <strong>${data.name}</strong>!<br>
                    Tư vấn viên sẽ gọi cho bạn trong <strong>30 phút</strong>.
                </p>
                <div style="background: var(--gray-50); padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 2rem;">
                    <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.5rem;">
                        SĐT: <strong>${data.phone}</strong>
                    </p>
                    <p style="font-size: 0.875rem; color: var(--gray-600);">
                        Chương trình: <strong>${getProgramName(data.program)}</strong>
                    </p>
                </div>
                <button onclick="this.closest('.modal-overlay').remove()" class="btn-primary-lg">
                    Đóng
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => modal.remove(), 10000);
    }

    // ============ QUIZ SYSTEM ============
    const quizQuestions = [
        {
            question: 'Bạn thích làm việc với con người hay máy móc?',
            options: [
                { text: 'Con người', scores: { kaigo: 10, hospitality: 8 }},
                { text: 'Máy móc', scores: { co_khi: 10, oto: 9, dien_tu: 8 }},
                { text: 'Cả hai', scores: { logistics: 7, xay_dung: 6 }},
            ]
        },
        {
            question: 'Môi trường làm việc nào bạn thích?',
            options: [
                { text: 'Trong nhà, điều hòa', scores: { kaigo: 8, dien_tu: 9 }},
                { text: 'Ngoài trời', scores: { xay_dung: 10, nong_nghiep: 9 }},
                { text: 'Văn phòng/xưởng', scores: { co_khi: 8, logistics: 7 }},
            ]
        },
        {
            question: 'Khả năng thể lực của bạn?',
            options: [
                { text: 'Rất tốt', scores: { xay_dung: 10, thuy_san: 9 }},
                { text: 'Trung bình', scores: { kaigo: 8, co_khi: 7 }},
                { text: 'Yếu', scores: { dien_tu: 9, det_may: 8 }},
            ]
        },
        {
            question: 'Kỹ năng giao tiếp?',
            options: [
                { text: 'Tự tin', scores: { kaigo: 10, hospitality: 9 }},
                { text: 'Bình thường', scores: { thuc_pham: 7, logistics: 6 }},
                { text: 'Không tự tin', scores: { co_khi: 8, dien_tu: 8 }},
            ]
        },
        {
            question: 'Mục tiêu khi đi Nhật?',
            options: [
                { text: 'Kiếm tiền', scores: { xay_dung: 9, thuy_san: 8 }},
                { text: 'Học tay nghề', scores: { kaigo: 9, oto: 8 }},
                { text: 'Định cư', scores: { kaigo: 10, tokutei: 10 }},
            ]
        },
    ];

    function openQuiz() {
        AppState.quizStep = 0;
        AppState.quizAnswers = [];
        renderQuiz();
        document.getElementById('quiz-modal').classList.remove('hidden');
    }

    function renderQuiz() {
        const container = document.getElementById('quiz-content');
        const currentQ = quizQuestions[AppState.quizStep];
        
        if (!currentQ) {
            showQuizResults();
            return;
        }
        
        const progress = Math.round((AppState.quizStep / quizQuestions.length) * 100);
        
        container.innerHTML = `
            <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Câu ${AppState.quizStep + 1}/${quizQuestions.length}</span>
                    <span class="text-sm font-semibold text-primary">${progress}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-primary h-2 rounded-full transition-all" style="width: ${progress}%"></div>
                </div>
            </div>
            
            <h3 class="text-xl font-bold mb-6">${currentQ.question}</h3>
            
            <div class="space-y-3">
                ${currentQ.options.map((option, index) => `
                    <button onclick="selectQuizAnswer(${index})" class="quiz-option">
                        ${option.text}
                    </button>
                `).join('')}
            </div>
        `;
    }

    function selectQuizAnswer(optionIndex) {
        const currentQ = quizQuestions[AppState.quizStep];
        AppState.quizAnswers.push(currentQ.options[optionIndex].scores);
        AppState.quizStep++;
        renderQuiz();
    }

    async function showQuizResults() {
        const totalScores = {};
        
        AppState.quizAnswers.forEach(scores => {
            Object.entries(scores).forEach(([industry, score]) => {
                totalScores[industry] = (totalScores[industry] || 0) + score;
            });
        });
        
        const sorted = Object.entries(totalScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        const maxScore = 50;
        const topIndustries = sorted.map(([industry, score]) => ({
            industry,
            score,
            percentage: Math.round((score / maxScore) * 100)
        }));

        // Save to backend
        await saveQuizResults(AppState.quizAnswers, topIndustries);

        const industryNames = {
            kaigo: '🏥 Kaigo',
            xay_dung: '🏗️ Xây dựng',
            co_khi: '⚙️ Cơ khí',
            thuy_san: '🐟 Thủy sản',
            thuc_pham: '🍱 Thực phẩm',
            nong_nghiep: '🌾 Nông nghiệp',
            oto: '🚗 Ô tô',
            dien_tu: '🏭 Điện tử',
            det_may: '🧵 Dệt may',
            logistics: '📦 Logistics',
            hospitality: '🏨 Hospitality',
        };
        
        const container = document.getElementById('quiz-content');
        container.innerHTML = `
            <div class="text-center mb-6">
                <div class="text-6xl mb-4">🎯</div>
                <h2 class="text-2xl font-bold mb-2">Kết quả của bạn!</h2>
                <p class="text-gray-600">Top 3 ngành nghề phù hợp</p>
            </div>
            
            <div class="space-y-4 mb-6">
                ${topIndustries.map((item, index) => `
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <span class="text-2xl font-bold text-primary">#${index + 1}</span>
                                <span class="font-semibold">${industryNames[item.industry]}</span>
                            </div>
                            <span class="text-lg font-bold text-accent">${item.percentage}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div class="bg-accent h-3 rounded-full transition-all duration-500" 
                                 style="width: ${item.percentage}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="flex gap-3">
                <button onclick="closeQuiz()" class="flex-1 btn-primary">Đóng</button>
                <button onclick="scrollToForm(); closeQuiz();" class="flex-1 btn-primary-lg">
                    Đăng ký tư vấn
                </button>
            </div>
        `;
    }

    // ============ CALCULATOR ============
    function initCalculator() {
        calculateIncome();
    }

    function calculateIncome() {
        const industryRange = DOM.calcIndustry.value.split('-');
        const baseAvg = (parseInt(industryRange[0]) + parseInt(industryRange[1])) / 2;
        const otHours = parseInt(DOM.calcOT.value);
        const otIncome = otHours * 0.3;
        const monthlyIncome = baseAvg + otIncome;
        const yearlyIncome = monthlyIncome * 12;
        const years = parseInt(DOM.calcYears.value);
        const totalSavings = yearlyIncome * 0.6 * years;
        
        document.getElementById('monthly-income').textContent = formatCurrency(monthlyIncome);
        document.getElementById('yearly-income').textContent = formatCurrency(yearlyIncome);
        document.getElementById('savings').textContent = formatCurrency(yearlyIncome * 0.6) + '/năm';
        document.getElementById('total-savings').textContent = '~' + formatCurrency(totalSavings);
        document.getElementById('total-years').textContent = years;
    }

    function formatCurrency(amount) {
        return Math.round(amount).toLocaleString('vi-VN') + ' VND';
    }

    // ============ SCROLL EFFECTS ============
    function handleScroll() {
        const scrollY = window.scrollY;
        if (scrollY > 500) {
            DOM.scrollTopBtn?.classList.remove('hidden');
        } else {
            DOM.scrollTopBtn?.classList.add('hidden');
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function scrollToForm() {
        document.getElementById('form')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }

    function initScrollEffects() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s, transform 0.6s';
            observer.observe(section);
        });
    }

    // ============ INDUSTRY FILTER ============
    function initIndustryFilters() {
        DOM.industryFilters.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;
                DOM.industryFilters.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterIndustries(filter);
            });
        });
    }

    function filterIndustries(filter) {
        document.querySelectorAll('.industry-card').forEach(card => {
            const categories = card.dataset.category?.split(' ') || [];
            if (filter === 'all' || categories.includes(filter)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // ============ FAQ ============
    function initFAQ() {
        DOM.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                DOM.faqItems.forEach(i => i.classList.remove('active'));
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }

    // ============ UTILITIES ============
    function getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function getProgramName(id) {
        const programs = {
            'tts-1': 'TTS 1 năm',
            'tts-3': 'TTS 3 năm',
            'tokutei': 'Tokutei Ginou',
        };
        return programs[id] || id;
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 100px; right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--accent)' : 'var(--secondary)'};
            color: white; border-radius: var(--radius-md);
            box-shadow: var(--shadow-xl); z-index: 9999;
            font-weight: 600;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    function closeQuiz() {
        document.getElementById('quiz-modal').classList.add('hidden');
    }

    // ============ GLOBAL FUNCTIONS ============
    window.scrollToForm = scrollToForm;
    window.scrollToTop = scrollToTop;
    window.openQuiz = openQuiz;
    window.closeQuiz = closeQuiz;
    window.selectQuizAnswer = selectQuizAnswer;

    // ============ START ============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// Quiz option styles
const style = document.createElement('style');
style.textContent = `
    .quiz-option {
        width: 100%; padding: 1rem 1.5rem;
        text-align: left; background: white;
        border: 2px solid var(--gray-300);
        border-radius: var(--radius-md);
        cursor: pointer; transition: all 0.2s;
    }
    .quiz-option:hover {
        border-color: var(--primary);
        background: var(--gray-50);
        transform: translateX(4px);
    }
`;
document.head.appendChild(style);
