// ========== 测算算法 ==========
const PARAMS = {
    conservative: { dr: 0.03, dp: 99, df: 0.08, pr: 0.008, pp: 399, pf: 0.15 },
    growth:       { dr: 0.06, dp: 129, df: 0.10, pr: 0.015, pp: 599, pf: 0.18 },
    mature:       { dr: 0.10, dp: 159, df: 0.12, pr: 0.03,  pp: 799, pf: 0.20 }
};

function calcGMV(members, p) {
    const dGMV = members * p.dr * p.dp;
    const pGMV = members * p.pr * p.pp;
    return { gmv: dGMV + pGMV, profit: dGMV * p.df + pGMV * p.pf };
}

function getLevel(m) {
    if (m >= 3000) return '连锁放大型';
    if (m >= 1000) return '高潜型';
    if (m >= 500) return '成长型';
    return '起步型';
}

function getModel(m, s) {
    if (s >= 5 && m >= 100000) return '模式三：帮您造品牌';
    if (m >= 3000 || s >= 5) return '模式二：帮您卖出去';
    if (m >= 1000) return '模式一/模式二';
    return '模式一：帮您备好货';
}

function fmt(n) {
    return n >= 10000 ? (n / 10000).toFixed(1) + '万' : Math.round(n).toLocaleString();
}

function calculateResult() {
    const m = parseInt(document.getElementById('memberCount').value) || 0;
    const s = parseInt(document.getElementById('storeCount').value) || 1;
    if (m <= 0) { alert('请输入活跃会员数'); return; }

    const c = calcGMV(m, PARAMS.conservative);
    const g = calcGMV(m, PARAMS.growth);
    const mt = calcGMV(m, PARAMS.mature);

    document.getElementById('calcPlaceholder').style.display = 'none';
    document.getElementById('calcResult').style.display = 'block';

    document.getElementById('resultBadge').textContent = getLevel(m);
    document.getElementById('resGmv').textContent = '约 ' + fmt(mt.gmv);
    document.getElementById('resProfit').textContent = '****';
    document.getElementById('resProfit').classList.add('blurred-data');
    document.getElementById('resModel').textContent = getModel(m, s);

    const max = mt.gmv;
    document.getElementById('barVal1').textContent = fmt(c.gmv);
    document.getElementById('barVal2').textContent = fmt(g.gmv);
    document.getElementById('barVal3').textContent = fmt(mt.gmv);

    // 曲线绘制动画
    setTimeout(() => {
        const line = document.getElementById('curveLine');
        const fill = document.getElementById('curveFillPath');
        const dot1 = document.getElementById('dot1');
        const dot2 = document.getElementById('dot2');
        const dot3 = document.getElementById('dot3');
        if (line) {
            line.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)';
            line.setAttribute('stroke-dashoffset', '0');
        }
        if (fill) {
            fill.style.transition = 'opacity 1s ease 0.8s';
            fill.setAttribute('opacity', '1');
        }
        if (dot1) { dot1.style.transition = 'r 0.3s ease 0.3s'; dot1.setAttribute('r', '5'); }
        if (dot2) { dot2.style.transition = 'r 0.3s ease 0.9s'; dot2.setAttribute('r', '5'); }
        if (dot3) { dot3.style.transition = 'r 0.3s ease 1.4s'; dot3.setAttribute('r', '6'); }
    }, 200);

    // 年度变现潜力 - 先打码
    const annualTotal = mt.profit * 12;
    document.getElementById('resAnnualProfit').textContent = '****';
    document.getElementById('resAnnualProfit').classList.add('blurred-data');
    document.getElementById('annualBreakdown').style.display = 'none';

    // 存储真实数据供解锁时使用
    window._calcData = { profit: mt.profit, annualTotal, annualActive: annualTotal, annualLost: 0, hasLost: false };
}

// ========== 打字动效 ==========
function typeText(el, text, speed) {
    el.textContent = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    setTimeout(type, 400); // 延迟一下再开始打字，让用户注意到
}

// ========== Modal ==========
function openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(e) { if (e.target === document.getElementById('modalOverlay')) closeModalDirect(); }
function closeModalDirect() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function openModalFull() {
    document.getElementById('modalFullOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModalFull(e) { if (e.target === document.getElementById('modalFullOverlay')) closeModalFullDirect(); }
function closeModalFullDirect() {
    document.getElementById('modalFullOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function submitModalFullForm(e) {
    e.preventDefault();
    closeModalFullDirect();
    showToast();
    e.target.reset();
    // 滚动到测算结果
    setTimeout(() => {
        document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
        if (document.getElementById('calcResult').style.display === 'none') {
            calculateResult();
        }
        setTimeout(() => unlockCalcDataWithAnimation(), 600);
    }, 300);
}

// ========== Forms ==========
function submitModalForm(e) {
    e.preventDefault();
    closeModalDirect();
    showToast();
    e.target.reset();
    // 滚动到测算结果
    setTimeout(() => {
        document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
        // 等滚动完再解锁数据，带动效
        setTimeout(() => unlockCalcDataWithAnimation(), 600);
    }, 300);
}

function submitForm(e) {
    e.preventDefault();
    showToast();
    e.target.reset();
    // 滚动到测算结果
    setTimeout(() => {
        document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
        if (document.getElementById('calcResult').style.display === 'none') {
            calculateResult();
        }
        setTimeout(() => unlockCalcDataWithAnimation(), 600);
    }, 300);
}

function unlockCalcData() {
    if (!window._calcData) return;
    const data = window._calcData;
    const profitEl = document.getElementById('resProfit');
    const annualEl = document.getElementById('resAnnualProfit');
    if (profitEl) {
        profitEl.textContent = '约 ' + fmt(data.profit);
        profitEl.classList.remove('blurred-data');
    }
    if (annualEl) {
        annualEl.classList.remove('blurred-data');
        typeText(annualEl, '约 ' + fmt(data.annualTotal), 60);
    }
    if (data.hasLost) {
        const activeEl = document.getElementById('annualActive');
        const lostEl = document.getElementById('annualLost');
        if (activeEl) { activeEl.textContent = fmt(data.annualActive); activeEl.classList.remove('blurred-data'); }
        if (lostEl) { lostEl.textContent = fmt(data.annualLost); lostEl.classList.remove('blurred-data'); }
    }
}

function unlockCalcDataWithAnimation() {
    if (!window._calcData) return;
    const data = window._calcData;
    const profitEl = document.getElementById('resProfit');
    const annualEl = document.getElementById('resAnnualProfit');

    // 月分润 - 数字滚动动效
    if (profitEl) {
        profitEl.classList.remove('blurred-data');
        profitEl.style.transition = 'filter 0.5s ease';
        animateValue(profitEl, 0, data.profit, 1500);
    }

    // 年度变现 - 延迟后数字滚动
    setTimeout(() => {
        if (annualEl) {
            annualEl.classList.remove('blurred-data');
            annualEl.style.transition = 'filter 0.5s ease';
            animateValue(annualEl, 0, data.annualTotal, 2000);
        }
        if (data.hasLost) {
            const activeEl = document.getElementById('annualActive');
            const lostEl = document.getElementById('annualLost');
            if (activeEl) { activeEl.classList.remove('blurred-data'); activeEl.textContent = fmt(data.annualActive); }
            if (lostEl) { lostEl.classList.remove('blurred-data'); lostEl.textContent = fmt(data.annualLost); }
        }
    }, 800);

    // 隐藏解锁按钮和引导文案
    const ctaSection = document.querySelector('.result-cta-section .btn-glow');
    const guideText = document.querySelector('.result-guide-text');
    if (ctaSection) ctaSection.style.display = 'none';
    if (guideText) guideText.textContent = '顾问老师将在30分钟内为您定制专属落地方案';
}

function animateValue(el, start, end, duration) {
    const startTime = performance.now();
    function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * ease);
        el.textContent = '约 ' + fmt(current);
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.style.transform = 'scale(1.05)';
            setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
        }
    }
    requestAnimationFrame(tick);
}
function showToast() {
    const t = document.getElementById('toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 4000);
}

function scrollToCalculator() {
    document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
}

// ========== 滚动动画 ==========
const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.pain-card, .sol-card, .model-card, .tn-item, .g-card, .guarantee-card, .sh-card, .sp-case').forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = `all 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 0.08}s`;
        obs.observe(el);
    });
});

// 添加visible样式
const style = document.createElement('style');
style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(style);

// ESC
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModalDirect(); closeModalFullDirect(); } });

// 数字动画
function animateNumbers() {
    const gmvEl = document.getElementById('animGmv');
    const ordEl = document.getElementById('animOrders');
    if (!gmvEl) return;
    const gmvTarget = 86400, ordTarget = 324;
    const duration = 2000;
    const start = performance.now();
    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        gmvEl.textContent = Math.round(gmvTarget * ease).toLocaleString();
        ordEl.textContent = Math.round(ordTarget * ease);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
setTimeout(animateNumbers, 500);

// 背书屏数字滚动动效
function animateCountUp(el, target, duration) {
    const start = performance.now();
    const formatNum = (n) => n >= 1000 ? Math.round(n).toLocaleString() : Math.round(n).toString();
    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        // easeOutExpo for dramatic effect
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.round(target * ease);
        el.textContent = formatNum(current);
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.classList.add('counted');
            setTimeout(() => el.classList.remove('counted'), 300);
        }
    }
    requestAnimationFrame(tick);
}

// 监听背书屏数字进入视口
const trustObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const nums = entry.target.querySelectorAll('.tn-num[data-target]');
            nums.forEach((el, i) => {
                const target = parseInt(el.getAttribute('data-target'));
                setTimeout(() => animateCountUp(el, target, 2000), i * 200);
            });
            trustObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

document.addEventListener('DOMContentLoaded', () => {
    const trustNumbers = document.querySelector('.trust-numbers');
    if (trustNumbers) trustObserver.observe(trustNumbers);

    // 社会证明数字动效
    const spSection = document.querySelector('.social-proof-strip');
    if (spSection) {
        const spObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 顶部大数字动画
                    const spNum = entry.target.querySelector('.sp-number');
                    if (spNum) {
                        animateCountUp(spNum, 860, 1800);
                        // 动画完成后加上 +
                        setTimeout(() => { spNum.textContent = '860+'; }, 1900);
                    }
                    // 案例卡片里的数字动画
                    const spVals = entry.target.querySelectorAll('.sp-val');
                    spVals.forEach((el, i) => {
                        const text = el.textContent;
                        const numMatch = text.match(/[\d.]+/);
                        if (numMatch) {
                            const target = parseFloat(numMatch[0]);
                            const suffix = text.replace(numMatch[0], '');
                            el.textContent = '0' + suffix;
                            setTimeout(() => {
                                const start = performance.now();
                                const duration = 1500;
                                function tick(now) {
                                    const progress = Math.min((now - start) / duration, 1);
                                    const ease = 1 - Math.pow(1 - progress, 3);
                                    const current = (target * ease).toFixed(target % 1 === 0 ? 0 : 1);
                                    el.textContent = current + suffix;
                                    if (progress < 1) requestAnimationFrame(tick);
                                }
                                requestAnimationFrame(tick);
                            }, i * 150);
                        }
                    });
                    spObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        spObserver.observe(spSection);
    }
});
