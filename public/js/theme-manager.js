// 主题管理系统
class ThemeManager {
    constructor() {
        this.themes = {
            light: 'light',
            dark: 'dark',
            system: 'system'
        };
        this.currentTheme = this.getStoredTheme() || 'system';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupMediaQueryListener();
        this.setupThemeToggleButton();
    }

    // 获取存储的主题
    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    // 存储主题设置
    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    // 获取系统主题偏好
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // 应用主题
    applyTheme(theme) {
        this.currentTheme = theme;
        const actualTheme = theme === 'system' ? this.getSystemTheme() : theme;
        
        document.documentElement.setAttribute('data-theme', actualTheme);
        document.documentElement.classList.toggle('dark', actualTheme === 'dark');
        
        this.updateThemeToggleIcon(theme);
        this.setStoredTheme(theme);
    }

    // 切换主题
    toggleTheme() {
        const themes = Object.values(this.themes);
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        this.applyTheme(nextTheme);
        
        // 显示主题切换提示
        this.showThemeChangeNotification(nextTheme);
    }

    // 更新主题切换按钮图标
    updateThemeToggleIcon(theme) {
        const themeBtn = document.getElementById('theme-btn');
        const themeIcon = document.getElementById('theme-icon');
        
        if (!themeBtn || !themeIcon) return;

        // 移除所有可能的图标类
        themeIcon.className = '';
        
        switch (theme) {
            case 'light':
                themeIcon.className = 'fa fa-sun-o text-lg';
                themeBtn.title = '切换到暗色主题';
                break;
            case 'dark':
                themeIcon.className = 'fa fa-moon-o text-lg';
                themeBtn.title = '切换到跟随系统';
                break;
            case 'system':
                themeIcon.className = 'fa fa-desktop text-lg';
                themeBtn.title = '切换到亮色主题';
                break;
        }
        
        // 更新移动端主题选项按钮状态
        this.updateMobileThemeButtons(theme);
    }

    // 设置系统主题变化监听
    setupMediaQueryListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener(() => {
            if (this.currentTheme === 'system') {
                this.applyTheme('system');
            }
        });
    }

    // 设置主题切换按钮
    setupThemeToggleButton() {
        // 桌面端主题按钮事件
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // 移动端主题选项按钮事件
        this.setupMobileThemeButtons();
    }

    // 设置移动端主题按钮
    setupMobileThemeButtons() {
        const themeOptionBtns = document.querySelectorAll('.theme-option-btn');
        themeOptionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                if (theme) {
                    this.applyTheme(theme);
                }
            });
        });
    }
    
    // 更新移动端主题按钮状态
    updateMobileThemeButtons(currentTheme) {
        const themeOptionBtns = document.querySelectorAll('.theme-option-btn');
        themeOptionBtns.forEach(btn => {
            const theme = btn.getAttribute('data-theme');
            if (theme === currentTheme) {
                btn.classList.add('border-primary', 'text-primary', 'bg-primary/5');
                btn.classList.remove('border-gray-300', 'text-gray-600');
            } else {
                btn.classList.remove('border-primary', 'text-primary', 'bg-primary/5');
                btn.classList.add('border-gray-300', 'text-gray-600');
            }
        });
    }

    // 显示主题切换通知
    showThemeChangeNotification(theme) {
        const messages = {
            light: '已切换到亮色主题',
            dark: '已切换到暗色主题',
            system: '已切换到跟随系统主题'
        };
        
        if (typeof showNotification === 'function') {
            showNotification(messages[theme] || '主题已切换', 'success');
        }
    }
}

// 右下角工具栏管理
class ToolbarManager {
    constructor() {
        this.toolbar = null;
        this.scrollToTopBtn = null;
        this.init();
    }

    init() {
        this.createToolbar();
        this.setupScrollListener();
    }

    // 创建工具栏
    createToolbar() {
        // 创建工具栏容器
        this.toolbar = document.createElement('div');
        this.toolbar.id = 'fixed-toolbar';
        this.toolbar.className = 'fixed-toolbar';
        
        // 创建回到顶部按钮
        this.scrollToTopBtn = document.createElement('button');
        this.scrollToTopBtn.className = 'toolbar-btn scroll-to-top-btn';
        this.scrollToTopBtn.innerHTML = '<i class="fa fa-chevron-up"></i>';
        this.scrollToTopBtn.title = '回到顶部';
        this.scrollToTopBtn.style.display = 'none';
        
        // 添加点击事件
        this.scrollToTopBtn.addEventListener('click', () => {
            this.scrollToTop();
        });
        
        // 组装工具栏
        this.toolbar.appendChild(this.scrollToTopBtn);
        
        // 添加到页面
        document.body.appendChild(this.toolbar);
    }

    // 设置滚动监听
    setupScrollListener() {
        let isScrolling = false;
        
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
    }

    // 处理滚动事件
    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const showButton = scrollTop > 300;
        
        if (showButton && this.scrollToTopBtn.style.display === 'none') {
            this.scrollToTopBtn.style.display = 'flex';
            this.scrollToTopBtn.classList.add('show');
        } else if (!showButton && this.scrollToTopBtn.style.display !== 'none') {
            this.scrollToTopBtn.classList.remove('show');
            setTimeout(() => {
                if (!this.scrollToTopBtn.classList.contains('show')) {
                    this.scrollToTopBtn.style.display = 'none';
                }
            }, 300);
        }
    }

    // 平滑滚动到顶部
    scrollToTop() {
        const startPosition = window.pageYOffset;
        const startTime = performance.now();
        const duration = 500; // 动画持续时间

        const easeInOutQuart = (t) => {
            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
        };

        const animateScroll = (currentTime) => {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = easeInOutQuart(progress);
            
            window.scrollTo(0, startPosition * (1 - ease));
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    }
}

// 初始化主题和工具栏管理器
let themeManager;
let toolbarManager;

document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化以确保DOM完全加载
    setTimeout(() => {
        themeManager = new ThemeManager();
        toolbarManager = new ToolbarManager();
    }, 100);
});

// 导出供外部使用
window.ThemeManager = ThemeManager;
window.ToolbarManager = ToolbarManager;