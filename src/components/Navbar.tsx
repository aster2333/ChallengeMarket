import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EnhancedWalletButton } from './EnhancedWalletButton';
import { Plus, Trophy, Search, Bell, Menu, Globe, Moon, Sun, BookOpen, Info, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { useSolana } from '../../components/solana-provider';
import { useWalletConnect } from '../providers/WalletConnectProvider';
import { useLocalWallet } from '../providers/LocalWalletProvider';
import { useTheme } from '../hooks/useTheme';
import HomeUnselected from '../assets/home-un.svg';
import HomeSelected from '../assets/home-ch.svg';
import MeUnselected from '../assets/me-un.svg';
import MeSelected from '../assets/me-ch.svg';
import CreateIcon from '../assets/create.svg';
import LogoIcon from '../assets/LOGO.svg';

interface NavbarProps {
  hideBottomNav?: boolean;
}

// 设置按钮组件
const SettingsButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation('common');
  const [showLanguagePanel, setShowLanguagePanel] = React.useState(false);
  const languagePanelRef = React.useRef<HTMLDivElement>(null);
  const settingsRef = React.useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'zh', name: '简体中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setShowLanguagePanel(false);
  };

  // 处理点击外部区域关闭面板
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguagePanel && 
          languagePanelRef.current && 
          settingsRef.current &&
          !languagePanelRef.current.contains(event.target as Node) &&
          !settingsRef.current.contains(event.target as Node)) {
        setShowLanguagePanel(false);
      }
    };

    if (showLanguagePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguagePanel]);

  return (
    <div className="relative" ref={settingsRef}>
      {/* 语言选择面板 - 位于设置菜单左侧 */}
      {showLanguagePanel && (
        <div 
          ref={languagePanelRef}
          className="absolute right-full top-0 mr-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 animate-in slide-in-from-right-2 duration-200"
        >
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('navbar.language')}
            </div>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm hover:bg-accent transition-colors ${
                  i18n.language === language.code 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-foreground'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {i18n.language === language.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-accent rounded-full"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="font-heading">{t('navbar.settings')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer font-body"
            onClick={() => setShowLanguagePanel(!showLanguagePanel)}
          >
            <Globe className="mr-2 h-4 w-4" />
            {t('navbar.language')} ({currentLanguage.name})
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer font-body"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            {theme === 'light' ? `${t('navbar.theme')} (${t('navbar.dark_mode')})` : `${t('navbar.theme')} (${t('navbar.light_mode')})`}
          </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer font-body"
          onClick={() => {
            // TODO: 实现使用教程功能
            console.log('使用教程被点击');
          }}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          {t('navbar.tutorial')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer font-body"
          onClick={() => {
            // TODO: 实现帮助与反馈功能
            console.log('帮助与反馈被点击');
          }}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {t('navbar.help_feedback')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer font-body"
          onClick={() => {
            // TODO: 实现关于我们功能
            console.log('关于我们被点击');
          }}
        >
          <Info className="mr-2 h-4 w-4" />
          {t('navbar.about_us')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
};

// 通知按钮组件
const NotificationButton: React.FC = () => {
  const { isConnected } = useSolana();
  const { isConnected: wcConnected } = useWalletConnect();
  const { isUnlocked } = useLocalWallet();
  
  // 检查是否有任何钱包连接
  const hasConnection = isConnected || wcConnected || isUnlocked;
  
  // 只有在用户登录时才显示通知按钮
  if (!hasConnection) {
    return null;
  }
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className="p-2 hover:bg-accent rounded-full"
      onClick={() => {
        // TODO: 实现通知功能
        console.log('通知按钮被点击');
      }}
    >
      <Bell className="w-5 h-5 text-foreground" />
    </Button>
  );
};

// 钱包连接按钮组件 - 仅在未连接时显示
const WalletConnectionButton: React.FC = () => {
  const { isConnected } = useSolana();
  const { isConnected: wcConnected } = useWalletConnect();
  const { isUnlocked } = useLocalWallet();
  
  // 检查是否有任何钱包连接
  const hasConnection = isConnected || wcConnected || isUnlocked;
  
  // 只有在未连接时才显示钱包连接按钮
  if (hasConnection) {
    return null;
  }
  
  return <EnhancedWalletButton />;
};

export const Navbar: React.FC<NavbarProps> = ({ hideBottomNav = false }) => {
  const location = useLocation();
  const { t } = useTranslation('common');

  const navItems = [
    { 
      path: '/', 
      label: t('navbar.home'), 
      icon: Plus, // 这个不会被使用，因为我们会用自定义逻辑
      customIcon: { unselected: HomeUnselected, selected: HomeSelected }
    },
    { 
      path: '/create', 
      label: t('navbar.create'), 
      icon: Plus, 
      isSpecial: true,
      customIcon: { unselected: CreateIcon, selected: CreateIcon }
    },
    { 
      path: '/profile', 
      label: t('navbar.profile'), 
      icon: Plus, // 这个不会被使用，因为我们会用自定义逻辑
      customIcon: { unselected: MeUnselected, selected: MeSelected }
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* 桌面端导航栏 - 顶部 */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧：Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src={LogoIcon} 
                alt="Challenge Market Logo" 
                className="w-8 h-8"
              />
            </Link>



            {/* 桌面端导航链接 */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map(({ path, label, icon: Icon, isSpecial, customIcon }) => (
                <Button
                  key={path}
                  asChild
                  variant={isSpecial ? "default" : isActive(path) ? "secondary" : "ghost"}
                  size="sm"
                  className={isSpecial ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transform hover:scale-105" : ""}
                >
                  <Link to={path} className="flex items-center space-x-2 font-button">
                    {customIcon ? (
                      <img 
                        src={isActive(path) ? customIcon.selected : customIcon.unselected} 
                        alt={label}
                        className="w-4 h-4"
                      />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span>{label}</span>
                  </Link>
                </Button>
              ))}
            </div>

            {/* 右侧按钮组：设置按钮、通知按钮和钱包连接按钮 */}
            <div className="flex items-center space-x-2 ml-4">
              {/* 设置按钮 - 始终显示 */}
              <SettingsButton />
              {/* 通知按钮 - 仅在用户登录时显示 */}
              <NotificationButton />
              {/* 钱包连接按钮 - 仅在未连接时显示 */}
              <WalletConnectionButton />
            </div>
          </div>
        </div>
      </nav>

      {/* 移动端导航栏 - 底部固定 */}
      {!hideBottomNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-pb">
          <div className="flex justify-around py-2 px-4">
            {navItems.map(({ path, label, icon: Icon, isSpecial, customIcon }) => (
              <Button
                key={path}
                asChild
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center transition-all duration-200 h-auto ${
                  isSpecial
                    ? 'w-24 h-24 -mt-6 z-10 hover:bg-transparent focus:bg-transparent active:bg-transparent bg-transparent'
                    : isActive(path)
                    ? 'text-primary py-3 px-4'
                    : 'text-muted-foreground py-3 px-4'
                }`}
              >
                <Link to={path} className="flex flex-col items-center">
                  {customIcon ? (
                    <img 
                      src={isActive(path) ? customIcon.selected : customIcon.unselected} 
                      alt={label}
                      className={isSpecial ? "w-24 h-24" : "w-6 h-6"}
                    />
                  ) : (
                    <Icon className={`w-8 h-8 ${isSpecial ? 'text-white' : ''}`} />
                  )}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}


    </>
  );
};