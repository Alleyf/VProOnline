// 页面交互功能扩展
// 为VProOnline添加完整的页面交互功能

// 初始化所有页面交互功能
function initializeAllInteractions() {
    initializeFAQ();
    initializeCounters(); 
    initializeSmoothScroll();
    initializeMobileMenu();
    initializeModals();
    initializeFormatHover();
    initializeSocialLinks();
    initializePricingButtons();
    initializeScrollEffects();
    initializeFooterLinks();
}

// 初始化FAQ功能
function initializeFAQ() {
    const faqToggles = document.querySelectorAll('.faq-toggle');
    
    faqToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const chevron = this.querySelector('.fa-chevron-down');
            
            // 关闭其他所有FAQ项
            faqToggles.forEach(otherToggle => {
                if (otherToggle !== this) {
                    const otherContent = otherToggle.nextElementSibling;
                    const otherChevron = otherToggle.querySelector('.fa-chevron-down');
                    
                    otherContent.classList.add('hidden');
                    otherChevron.style.transform = 'rotate(0deg)';
                }
            });
            
            // 切换当前FAQ项
            content.classList.toggle('hidden');
            
            if (content.classList.contains('hidden')) {
                chevron.style.transform = 'rotate(0deg)';
            } else {
                chevron.style.transform = 'rotate(180deg)';
            }
        });
    });
}

// 初始化数字计数器动画
function initializeCounters() {
    const counters = [
        { element: '#counter-users', target: 10000, suffix: '+' },
        { element: '#counter-videos', target: 50000, suffix: '+' },
        { element: '#counter-formats', target: 20, suffix: '+' },
        { element: '#counter-countries', target: 50, suffix: '+' }
    ];
    
    // 创建交叉观察器
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = counters.find(c => entry.target.matches(c.element));
                if (counter && !entry.target.dataset.animated) {
                    animateCounter(entry.target, counter.target, counter.suffix);
                    entry.target.dataset.animated = 'true';
                }
            }
        });
    }, observerOptions);
    
    // 观察所有计数器元素
    counters.forEach(counter => {
        const element = document.querySelector(counter.element);
        if (element) {
            observer.observe(element);
        }
    });
}

// 计数器动画函数
function animateCounter(element, target, suffix = '') {
    let current = 0;
    const increment = target / 50; // 50步完成动画
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString() + suffix;
    }, 30);
}

// 初始化平滑滚动
function initializeSmoothScroll() {
    // 处理所有内部链接
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navbarHeight = document.querySelector('#navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // 关闭移动端菜单
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });
}

// 初始化移动端菜单
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // 切换按钮图标
            const icon = this.querySelector('i');
            if (mobileMenu.classList.contains('hidden')) {
                icon.className = 'fa fa-bars text-xl';
            } else {
                icon.className = 'fa fa-times text-xl';
            }
        });
        
        // 点击外部关闭菜单
        document.addEventListener('click', function(e) {
            if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
                const icon = mobileMenuBtn.querySelector('i');
                icon.className = 'fa fa-bars text-xl';
            }
        });
    }
}

// 初始化模态框系统
function initializeModals() {
    // 使用更精确的选择器来避免冲突
    
    // 登录按钮 - 检查文本内容
    document.querySelectorAll('button, a').forEach(element => {
        if (element.textContent.trim() === '登录') {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                showLoginModal();
            });
        }
    });
    
    // 免费试用/注册按钮
    document.querySelectorAll('button, a').forEach(element => {
        const text = element.textContent.trim();
        if (text.includes('免费试用') || text.includes('免费注册') || text.includes('免费开始使用')) {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                showSignupModal();
            });
        }
    });
    
    // 演示按钮 - 跳转到演示页面
    document.querySelectorAll('button, a').forEach(element => {
        const text = element.textContent.trim();
        if (text.includes('观看演示') || text.includes('观看教程')) {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                // 跳转到演示页面
                window.location.href = '/demo.html';
            });
        }
    });
}

// 显示登录模态框
function showLoginModal() {
    const modal = createModal('login-modal', '登录账户', `
        <form class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">邮箱地址</label>
                <input type="email" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入邮箱地址">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
                <input type="password" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入密码">
            </div>
            <div class="flex items-center justify-between">
                <label class="flex items-center">
                    <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary">
                    <span class="ml-2 text-sm text-gray-600">记住我</span>
                </label>
                <a href="#" class="text-sm text-primary hover:text-primary/80">忘记密码？</a>
            </div>
            <button type="submit" class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">登录</button>
            <p class="text-center text-sm text-gray-600">还没有账户？ <a href="#" class="text-primary hover:text-primary/80" onclick="showSignupModal(); closeModal('login-modal');">立即注册</a></p>
        </form>
    `);
    
    // 处理表单提交
    const form = modal.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('登录功能正在开发中...', 'info');
        closeModal('login-modal');
    });
}

// 显示注册模态框
function showSignupModal() {
    const modal = createModal('signup-modal', '免费注册', `
        <form class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                <input type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入您的姓名">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">邮箱地址</label>
                <input type="email" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入邮箱地址">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
                <input type="password" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入密码(至少8位)">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
                <input type="password" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请再次输入密码">
            </div>
            <div class="flex items-start">
                <input type="checkbox" class="mt-1 rounded border-gray-300 text-primary focus:ring-primary" required>
                <span class="ml-2 text-sm text-gray-600">我同意 <a href="#" class="text-primary hover:text-primary/80">服务条款</a> 和 <a href="#" class="text-primary hover:text-primary/80">隐私政策</a></span>
            </div>
            <button type="submit" class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">免费注册</button>
            <p class="text-center text-sm text-gray-600">已有账户？ <a href="#" class="text-primary hover:text-primary/80" onclick="showLoginModal(); closeModal('signup-modal');">立即登录</a></p>
        </form>
    `);
    
    // 处理表单提交
    const form = modal.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('注册功能正在开发中...', 'info');
        closeModal('signup-modal');
    });
}



// 创建模态框
function createModal(id, title, content) {
    // 先删除已存在的模态框
    const existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black/50';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div class="flex justify-between items-center p-6 border-b">
                <h3 class="text-lg font-semibold">${title}</h3>
                <button class="text-gray-500 hover:text-gray-700" onclick="closeModal('${id}')">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <div class="p-6">
                ${content}
            </div>
        </div>
    `;
    
    // 点击外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(id);
        }
    });
    
    document.body.appendChild(modal);
    return modal;
}

// 关闭模态框
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.remove();
    }
}

// 初始化格式悬停效果
function initializeFormatHover() {
    const formatElements = document.querySelectorAll('.text-gray-400:has(.fa-file-video-o)');
    
    formatElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.transition = 'transform 0.2s ease';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        element.addEventListener('click', function() {
            const format = this.querySelector('span').textContent;
            showNotification(`${format} 格式处理功能即将上线`, 'info');
        });
    });
}

// 初始化社交媒体链接
function initializeSocialLinks() {
    const socialLinks = document.querySelectorAll('a[href="#"]:has(.fa-facebook), a[href="#"]:has(.fa-twitter), a[href="#"]:has(.fa-instagram), a[href="#"]:has(.fa-youtube-play)');
    
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const icon = this.querySelector('i');
            let platform = '社交媒体';
            
            if (icon.classList.contains('fa-facebook')) platform = 'Facebook';
            else if (icon.classList.contains('fa-twitter')) platform = 'Twitter';
            else if (icon.classList.contains('fa-instagram')) platform = 'Instagram';
            else if (icon.classList.contains('fa-youtube-play')) platform = 'YouTube';
            
            showNotification(`${platform}链接正在开发中...`, 'info');
        });
    });
}

// 初始化价格方案按钮
function initializePricingButtons() {
    // 免费开始使用按钮
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('免费开始使用')) {
            btn.addEventListener('click', function() {
                showSignupModal();
            });
        }
    });
    
    // 选择标准版按钮
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('选择标准版')) {
            btn.addEventListener('click', function() {
                showPurchaseModal('标准版', '29');
            });
        }
    });
    
    // 联系销售按钮
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('联系销售')) {
            btn.addEventListener('click', function() {
                showContactModal();
            });
        }
    });
}

// 显示购买模态框
function showPurchaseModal(plan, price) {
    const modal = createModal('purchase-modal', `购买${plan}`, `
        <div class="text-center mb-6">
            <div class="text-3xl font-bold text-primary mb-2">¥${price}<span class="text-sm text-gray-500">/月</span></div>
            <p class="text-gray-600">${plan}方案</p>
        </div>
        <form class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">联系邮箱</label>
                <input type="email" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入您的邮箱">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">公司名称(可选)</label>
                <input type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入公司名称">
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium mb-2">支付方式</h4>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="radio" name="payment" value="alipay" class="text-primary" checked>
                        <span class="ml-2">支付宝</span>
                    </label>
                    <label class="flex items-center">
                        <input type="radio" name="payment" value="wechat" class="text-primary">
                        <span class="ml-2">微信支付</span>
                    </label>
                    <label class="flex items-center">
                        <input type="radio" name="payment" value="card" class="text-primary">
                        <span class="ml-2">信用卡</span>
                    </label>
                </div>
            </div>
            <button type="submit" class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">立即购买</button>
        </form>
    `);
    
    const form = modal.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('支付功能正在开发中...', 'info');
        closeModal('purchase-modal');
    });
}

// 显示联系销售模态框
function showContactModal() {
    const modal = createModal('contact-modal', '联系销售', `
        <form class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                <input type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入您的姓名">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                <input type="email" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入邮箱地址">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">公司名称</label>
                <input type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入公司名称">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">联系电话</label>
                <input type="tel" class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" placeholder="请输入联系电话">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">需求描述</label>
                <textarea class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" rows="4" placeholder="请描述您的具体需求"></textarea>
            </div>
            <button type="submit" class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">提交申请</button>
        </form>
    `);
    
    const form = modal.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('申请已提交，我们将尽快联系您!', 'success');
        closeModal('contact-modal');
    });
}

// 初始化滚动效果
function initializeScrollEffects() {
    // 导航栏滚动效果
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('bg-white/95');
            navbar.classList.remove('bg-white/90');
        } else {
            navbar.classList.add('bg-white/90');
            navbar.classList.remove('bg-white/95');
        }
    });
}

// 添加页脚链接交互
function initializeFooterLinks() {
    // 页脚链接点击处理
    document.querySelectorAll('footer a[href="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const linkText = this.textContent.trim();
            
            // 根据链接文本显示相应的模态框
            if (linkText.includes('隐私政策')) {
                showPrivacyModal();
            } else if (linkText.includes('服务条款')) {
                showTermsModal();
            } else if (linkText.includes('Cookie政策')) {
                showCookieModal();
            } else {
                showNotification(`${linkText}页面正在开发中...`, 'info');
            }
        });
    });
}

// 隐私政策模态框
function showPrivacyModal() {
    createModal('privacy-modal', '隐私政策', `
        <div class="max-h-96 overflow-y-auto">
            <h4 class="font-medium mb-2">1. 信息收集</h4>
            <p class="text-sm text-gray-600 mb-4">我们仅收集为您提供服务所必需的信息...</p>
            
            <h4 class="font-medium mb-2">2. 信息使用</h4>
            <p class="text-sm text-gray-600 mb-4">我们使用您的信息来提供和改进我们的服务...</p>
            
            <h4 class="font-medium mb-2">3. 信息保护</h4>
            <p class="text-sm text-gray-600 mb-4">我们采用行业标准的安全措施来保护您的信息...</p>
        </div>
    `);
}

// 服务条款模态框
function showTermsModal() {
    createModal('terms-modal', '服务条款', `
        <div class="max-h-96 overflow-y-auto">
            <h4 class="font-medium mb-2">1. 服务描述</h4>
            <p class="text-sm text-gray-600 mb-4">VProOnline提供在线视频处理服务...</p>
            
            <h4 class="font-medium mb-2">2. 用户责任</h4>
            <p class="text-sm text-gray-600 mb-4">您有责任确保上传的内容合法合规...</p>
            
            <h4 class="font-medium mb-2">3. 服务限制</h4>
            <p class="text-sm text-gray-600 mb-4">我们保留随时修改或终止服务的权利...</p>
        </div>
    `);
}

// Cookie政策模态框  
function showCookieModal() {
    createModal('cookie-modal', 'Cookie政策', `
        <div class="max-h-96 overflow-y-auto">
            <h4 class="font-medium mb-2">什么是Cookie？</h4>
            <p class="text-sm text-gray-600 mb-4">Cookie是存储在您设备上的小型文本文件...</p>
            
            <h4 class="font-medium mb-2">我们如何使用Cookie？</h4>
            <p class="text-sm text-gray-600 mb-4">我们使用Cookie来改善用户体验...</p>
            
            <h4 class="font-medium mb-2">如何管理Cookie？</h4>
            <p class="text-sm text-gray-600 mb-4">您可以通过浏览器设置来管理Cookie...</p>
        </div>
    `);
}

// 当DOM加载完成时初始化页脚链接
document.addEventListener('DOMContentLoaded', function() {
    initializeFooterLinks();
});