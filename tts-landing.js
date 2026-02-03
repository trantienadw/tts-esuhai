// =========================================
// TIKME TTS LANDING PAGE - JAVASCRIPT
// All interactive features and functionality
// =========================================

(function() {
    'use strict';

    // ============ STATE MANAGEMENT ============
    const AppState = {
        currentFilter: 'all',
        quizStep: 0,
        quizAnswers: [],
        scrollY: 0,
    };

    // ============ DOM ELEMENTS ============
    const DOM = {
        leadForm: document.getElementById('lead-form'),
        scrollTopBtn: document.getElementById('scroll-top'),
        industryFilters: document.querySelectorAll('.filter-btn'),
        industryCards: document.querySelectorAll('.industry-card'),
        faqItems: document.querySelectorAll('.faq-item'),
        calcIndustry: document.getElementById('calc-industry'),
        calcOT: document.getElementById('calc-ot'),
        calcYears: document.getElementById('calc-years'),
        quizModal: document.getElementById('quiz-modal'),
        industryModal: document.getElementById('industry-modal'),
    };

    // ============ INITIALIZATION ============
    function init() {
        console.log('🚀 TTS Landing Page Loading...');
        
        setupEventListeners();
        initScrollEffects();
        initCalculator();
        initFAQ();
        initIndustryFilters();
        
        console.log('✅ Landing Page Ready');
    }

    // ============ EVENT LISTENERS ============
    function setupEventListeners() {
        // Form submission
        if (DOM.leadForm) {
            DOM.leadForm.addEventListener('submit', handleFormSubmit);
        }

        // Scroll to top
        if (DOM.scrollTopBtn) {
            DOM.scrollTopBtn.addEventListener('click', scrollToTop);
        }

        // Window scroll
        window.addEventListener('scroll', handleScroll);

        // Calculator inputs
        if (DOM.calcIndustry) DOM.calcIndustry.addEventListener('change', calculateIncome);
        if (DOM.calcOT) DOM.calcOT.addEventListener('change', calculateIncome);
        if (DOM.calcYears) DOM.calcYears.addEventListener('change', calculateIncome);
    }

    // ============ FORM HANDLING ============
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            program: formData.get('program'),
            industry: formData.get('industry'),
            timestamp: new Date().toISOString(),
        };

        // Validate
        if (!validatePhone(data.phone)) {
            showNotification('❌ Số điện thoại không hợp lệ!', 'error');
            return;
        }

        // Save to localStorage
        saveLeadData(data);

        // Track event
        trackEvent('lead_submitted', data);

        // Show success
        showSuccessModal(data);

        // Reset form
        e.target.reset();
    }

    function validatePhone(phone) {
        const phoneRegex = /^(0|\+84)[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    function saveLeadData(data) {
        const leads = JSON.parse(localStorage.getItem('tikme_leads') || '[]');
        leads.push(data);
        localStorage.setItem('tikme_leads', JSON.stringify(leads));
        localStorage.setItem('tikme_user', JSON.stringify(data));
    }

    function showSuccessModal(data) {
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
                        Số điện thoại: <strong>${data.phone}</strong>
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
        
        // Auto remove after 10 seconds
        setTimeout(() => modal.remove(), 10000);
    }

    function getProgramName(programId) {
        const programs = {
            'tts-1': 'TTS 1 năm',
            'tts-3': 'TTS 3 năm',
            'tokutei': 'Tokutei Ginou',
            'chua-quyet-dinh': 'Chưa quyết định',
        };
        return programs[programId] || programId;
    }

    // ============ SCROLL EFFECTS ============
    function handleScroll() {
        AppState.scrollY = window.scrollY;
        
        // Show/hide scroll to top button
        if (AppState.scrollY > 500) {
            DOM.scrollTopBtn?.classList.remove('hidden');
        } else {
            DOM.scrollTopBtn?.classList.add('hidden');
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function scrollToForm() {
        const form = document.getElementById('form');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function initScrollEffects() {
        // Intersection Observer for fade-in animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe all sections
        document.querySelectorAll('section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });
    }

    // ============ SALARY CALCULATOR ============
    function calculateIncome() {
        const industryRange = DOM.calcIndustry.value.split('-');
        const baseMin = parseInt(industryRange[0]);
        const baseMax = parseInt(industryRange[1]);
        const baseAvg = (baseMin + baseMax) / 2;
        
        const otHours = parseInt(DOM.calcOT.value);
        const otIncome = otHours * 0.3; // Rough estimate: 300k VND/hour
        
        const monthlyIncome = baseAvg + otIncome;
        const yearlyIncome = monthlyIncome * 12;
        
        const years = parseInt(DOM.calcYears.value);
        const savingsRate = 0.6; // 60%
        const yearlySavings = yearlyIncome * savingsRate;
        const totalSavings = yearlySavings * years;
        
        // Update UI
        document.getElementById('monthly-income').textContent = formatCurrency(monthlyIncome);
        document.getElementById('yearly-income').textContent = formatCurrency(yearlyIncome);
        document.getElementById('savings').textContent = formatCurrency(yearlySavings) + '/năm';
        document.getElementById('total-savings').textContent = '~' + formatCurrency(totalSavings);
        document.getElementById('total-years').textContent = years;
    }

    function initCalculator() {
        // Initial calculation
        calculateIncome();
    }

    function formatCurrency(amount) {
        return Math.round(amount).toLocaleString('vi-VN') + ' VND';
    }

    // ============ INDUSTRY FILTER ============
    function initIndustryFilters() {
        DOM.industryFilters.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;
                
                // Update active state
                DOM.industryFilters.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Filter industries
                filterIndustries(filter);
                
                AppState.currentFilter = filter;
            });
        });
    }

    function filterIndustries(filter) {
        DOM.industryCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s ease';
            } else {
                const categories = card.dataset.category.split(' ');
                if (categories.includes(filter)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.5s ease';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    }

    // ============ FAQ ACCORDION ============
    function initFAQ() {
        DOM.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // Close all
                DOM.faqItems.forEach(i => i.classList.remove('active'));
                
                // Toggle current
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }

    // ============ QUIZ SYSTEM ============
    const quizQuestions = [
        {
            question: 'Bạn thích làm việc với con người hay máy móc?',
            options: [
                { text: 'Con người (chăm sóc, giao tiếp)', scores: { kaigo: 10, hospitality: 8, thuc_pham: 5 }},
                { text: 'Máy móc (kỹ thuật, lắp ráp)', scores: { co_khi: 10, oto: 9, dien_tu: 8 }},
                { text: 'Cả hai đều được', scores: { logistics: 7, xay_dung: 6 }},
            ]
        },
        {
            question: 'Bạn thích môi trường làm việc nào?',
            options: [
                { text: 'Trong nhà, điều hòa', scores: { kaigo: 8, dien_tu: 9, thuc_pham: 7 }},
                { text: 'Ngoài trời, năng động', scores: { xay_dung: 10, nong_nghiep: 9, thuy_san: 8 }},
                { text: 'Văn phòng/xưởng', scores: { co_khi: 8, oto: 8, logistics: 7 }},
            ]
        },
        {
            question: 'Khả năng thể lực của bạn?',
            options: [
                { text: 'Rất tốt, sức khỏe dẻo dai', scores: { xay_dung: 10, thuy_san: 9, nong_nghiep: 8 }},
                { text: 'Trung bình, bình thường', scores: { kaigo: 8, co_khi: 7, thuc_pham: 7 }},
                { text: 'Yếu hơn, cần việc nhẹ', scores: { dien_tu: 9, det_may: 8, hospitality: 7 }},
            ]
        },
        {
            question: 'Kỹ năng giao tiếp tiếng Nhật?',
            options: [
                { text: 'Tự tin, thích nói chuyện', scores: { kaigo: 10, hospitality: 9 }},
                { text: 'Bình thường, học được', scores: { thuc_pham: 7, logistics: 6 }},
                { text: 'Không tự tin lắm', scores: { co_khi: 8, dien_tu: 8, xay_dung: 7 }},
            ]
        },
        {
            question: 'Mục tiêu của bạn khi đi Nhật?',
            options: [
                { text: 'Kiếm tiền, gửi về gia đình', scores: { xay_dung: 9, thuy_san: 8, co_khi: 8 }},
                { text: 'Học tay nghề, phát triển', scores: { kaigo: 9, oto: 8, dien_tu: 8 }},
                { text: 'Định cư lâu dài', scores: { kaigo: 10, tokutei: 10 }},
            ]
        },
    ];

    function openQuiz() {
        AppState.quizStep = 0;
        AppState.quizAnswers = [];
        renderQuiz();
        DOM.quizModal.classList.remove('hidden');
        trackEvent('quiz_opened');
    }

    function closeQuiz() {
        DOM.quizModal.classList.add('hidden');
    }

    function renderQuiz() {
        const container = document.getElementById('quiz-content');
        const currentQ = quizQuestions[AppState.quizStep];
        
        if (!currentQ) {
            showQuizResults();
            return;
        }
        
        container.innerHTML = `
            <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Câu ${AppState.quizStep + 1}/${quizQuestions.length}</span>
                    <span class="text-sm font-semibold text-primary">${Math.round((AppState.quizStep / quizQuestions.length) * 100)}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${(AppState.quizStep / quizQuestions.length) * 100}%"></div>
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
        const selectedOption = currentQ.options[optionIndex];
        
        AppState.quizAnswers.push(selectedOption.scores);
        AppState.quizStep++;
        
        renderQuiz();
    }

    function showQuizResults() {
        // Calculate total scores
        const totalScores = {};
        
        AppState.quizAnswers.forEach(scores => {
            Object.entries(scores).forEach(([industry, score]) => {
                totalScores[industry] = (totalScores[industry] || 0) + score;
            });
        });
        
        // Sort and get top 3
        const sorted = Object.entries(totalScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        const industryNames = {
            kaigo: '🏥 Kaigo (Điều dưỡng)',
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
            go_noi_that: '🎨 Gỗ/Nội thất',
        };
        
        const container = document.getElementById('quiz-content');
        container.innerHTML = `
            <div class="text-center mb-6">
                <div class="text-6xl mb-4">🎯</div>
                <h2 class="text-2xl font-bold mb-2">Kết quả của bạn!</h2>
                <p class="text-gray-600">Top 3 ngành nghề phù hợp nhất</p>
            </div>
            
            <div class="space-y-4 mb-6">
                ${sorted.map((item, index) => {
                    const [industry, score] = item;
                    const maxScore = 50; // 5 questions * 10 max points
                    const percentage = Math.round((score / maxScore) * 100);
                    
                    return `
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-2xl font-bold text-primary">#${index + 1}</span>
                                    <span class="font-semibold">${industryNames[industry]}</span>
                                </div>
                                <span class="text-lg font-bold text-accent">${percentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-3">
                                <div class="bg-accent h-3 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <p class="text-center text-sm text-gray-600 mb-6">
                Dựa trên câu trả lời của bạn, 3 ngành trên phù hợp nhất với tính cách và mục tiêu của bạn.
            </p>
            
            <div class="flex gap-3">
                <button onclick="closeQuiz()" class="flex-1 btn-primary">
                    Đóng
                </button>
                <button onclick="scrollToForm(); closeQuiz();" class="flex-1 btn-primary-lg">
                    Đăng ký tư vấn ngay
                </button>
            </div>
        `;
        
        // Track completion
        trackEvent('quiz_completed', { top_industry: sorted[0][0] });
    }

    // ============ INDUSTRY DETAIL MODAL ============
    const industryDetails = {
        kaigo: {
            name: 'Kaigo (Điều dưỡng người già)',
            icon: '🏥',
            salary: '35-55 triệu/tháng',
            rating: 5,
            description: 'Chăm sóc người cao tuổi tại các viện dưỡng lão, bệnh viện, hoặc tại nhà. Công việc bao gồm hỗ trợ sinh hoạt, vệ sinh, ăn uống và động viên tinh thần.',
            requirements: [
                'Không cần kinh nghiệm',
                'Yêu thích chăm sóc người khác',
                'Kiên nhẫn, tỉ mỉ, yêu thương',
                'Sức khỏe tốt',
            ],
            benefits: [
                'Lương cao nhất trong TTS',
                'Dễ chuyển sang Tokutei (5 năm)',
                'Dễ định cư lâu dài',
                'Được đào tạo bài bản',
                'Phù hợp cả nam và nữ',
            ],
            timeline: '6-9 tháng học → Phỏng vấn → Bay Nhật',
        },
        // Add more industries as needed
    };

    function showIndustryDetail(industryId) {
        const detail = industryDetails[industryId];
        if (!detail) {
            showNotification('Thông tin chi tiết đang cập nhật', 'info');
            return;
        }
        
        const container = document.getElementById('industry-detail-content');
        container.innerHTML = `
            <div class="text-center mb-6">
                <div class="text-6xl mb-4">${detail.icon}</div>
                <h2 class="text-2xl font-bold mb-2">${detail.name}</h2>
                <div class="text-2xl font-bold text-accent mb-2">${detail.salary}</div>
                <div class="text-yellow-400">${'⭐'.repeat(detail.rating)}</div>
            </div>
            
            <div class="space-y-6">
                <div>
                    <h3 class="font-bold text-lg mb-2">📝 Mô tả công việc:</h3>
                    <p class="text-gray-700">${detail.description}</p>
                </div>
                
                <div>
                    <h3 class="font-bold text-lg mb-2">✅ Yêu cầu:</h3>
                    <ul class="space-y-1">
                        ${detail.requirements.map(req => `<li class="text-gray-700">• ${req}</li>`).join('')}
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-bold text-lg mb-2">🎁 Lợi ích:</h3>
                    <ul class="space-y-1">
                        ${detail.benefits.map(benefit => `<li class="text-gray-700">✓ ${benefit}</li>`).join('')}
                    </ul>
                </div>
                
                <div>
                    <h3 class="font-bold text-lg mb-2">⏱️ Lộ trình:</h3>
                    <p class="text-gray-700">${detail.timeline}</p>
                </div>
            </div>
            
            <div class="mt-8">
                <button onclick="selectProgramAndScroll('${industryId}')" class="btn-primary-lg w-full">
                    Đăng ký tư vấn ngành này
                </button>
            </div>
        `;
        
        DOM.industryModal.classList.remove('hidden');
    }

    function closeIndustryModal() {
        DOM.industryModal.classList.add('hidden');
    }

    function selectProgramAndScroll(industryId) {
        // Set industry in form
        const industrySelect = document.querySelector('select[name="industry"]');
        if (industrySelect) {
            industrySelect.value = industryId.replace('_', '-');
        }
        
        closeIndustryModal();
        scrollToForm();
    }

    // ============ CHAT FUNCTIONALITY ============
    function openChat() {
        showNotification('💬 Chat đang được kích hoạt...', 'info');
        // In production, this would open a real chat widget
        setTimeout(() => {
            alert('Tính năng chat sẽ sớm được tích hợp. Vui lòng gọi hotline: 090-6666-222');
        }, 500);
        
        trackEvent('chat_opened');
    }

    // ============ PROGRAM SELECTION ============
    function selectProgram(programId) {
        // Set program in form
        const programSelect = document.querySelector('select[name="program"]');
        if (programSelect) {
            programSelect.value = programId;
        }
        
        // Scroll to form
        scrollToForm();
        
        // Track
        trackEvent('program_selected', { program: programId });
    }

    // ============ NOTIFICATIONS ============
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--accent)' : type === 'error' ? 'var(--secondary)' : 'var(--primary)'};
            color: white;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-xl);
            z-index: 9999;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ============ ANALYTICS TRACKING ============
    function trackEvent(eventName, params = {}) {
        // Google Analytics
        if (window.gtag) {
            gtag('event', eventName, params);
        }
        
        // Facebook Pixel
        if (window.fbq) {
            fbq('track', eventName, params);
        }
        
        console.log('📊 Event tracked:', eventName, params);
    }

    // ============ UTILITY FUNCTIONS ============
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============ GLOBAL FUNCTIONS ============
    // Make functions available globally for onclick handlers
    window.scrollToForm = scrollToForm;
    window.scrollToTop = scrollToTop;
    window.selectProgram = selectProgram;
    window.openQuiz = openQuiz;
    window.closeQuiz = closeQuiz;
    window.selectQuizAnswer = selectQuizAnswer;
    window.showIndustryDetail = showIndustryDetail;
    window.closeIndustryModal = closeIndustryModal;
    window.selectProgramAndScroll = selectProgramAndScroll;
    window.openChat = openChat;

    // ============ START APPLICATION ============
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// ============ CSS ANIMATIONS (INLINE) ============
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(100%);
        }
    }

    .quiz-option {
        width: 100%;
        padding: 1rem 1.5rem;
        text-align: left;
        background: white;
        border: 2px solid var(--gray-300);
        border-radius: var(--radius-md);
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .quiz-option:hover {
        border-color: var(--primary);
        background: var(--gray-50);
        transform: translateX(4px);
    }
`;
document.head.appendChild(style);
