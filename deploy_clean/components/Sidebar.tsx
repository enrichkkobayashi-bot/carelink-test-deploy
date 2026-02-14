import React from 'react';
import { Monitor, Users, FileText, Heart, Building2, ClipboardList } from 'lucide-react';

const Sidebar: React.FC = () => {
    const menuItems = [
        {
            label: 'モニタリング',
            icon: <Monitor size={20} />,
            href: 'https://monitoring-test-app.vercel.app',
        },
        {
            label: '担当者会議録',
            icon: <Users size={20} />,
            href: 'https://care-minutes-ai.vercel.app',
        },
        {
            label: '要介護プラン',
            icon: <FileText size={20} />,
            href: 'https://carelink-test-deploy.vercel.app',
        },
        {
            label: '要支援プラン',
            icon: <Heart size={20} />,
            href: 'https://careplan-test-v2.vercel.app',
        },
        {
            label: '入院時連携',
            icon: <Building2 size={20} />,
            href: 'https://carelink-ai-sheet.vercel.app',
        },
    ];

    return (
        <aside className="w-64 bg-[#0B1527] text-gray-300 flex flex-col h-screen sticky top-0 shrink-0 font-sans z-[100] border-r border-[#1a2638] print:hidden">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                    <ClipboardList size={22} className="stroke-[2.5]" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">CareLink</span>
            </div>

            {/* Navigation Label */}
            <div className="px-6 mb-4">
                <p className="text-xs font-bold text-gray-500 tracking-wider">NAVIGATION</p>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-3 space-y-2">
                {menuItems.map((item, index) => (
                    <a
                        key={index}
                        href={item.href}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all group duration-200"
                    >
                        <span className="text-gray-400 group-hover:text-white transition-colors">
                            {item.icon}
                        </span>
                        <span className="font-medium text-[15px]">{item.label}</span>
                    </a>
                ))}
            </nav>

            {/* User Profile or Footer could go here if needed, keeping it empty for now matching the image */}
        </aside>
    );
};

export default Sidebar;

