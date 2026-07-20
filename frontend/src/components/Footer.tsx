import React from 'react';
import { Facebook, Twitter, Youtube, Linkedin, Rss, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    const footerLinks = [
        {
            title: 'Explore',
            links: [
                { name: 'Features', href: '#' },
                { name: 'Pricing', href: '#' }
            ]
        },
        {
            title: 'Account',
            links: [
                { name: 'Billing', href: '#' }
            ]
        },
        {
            title: 'Resources',
            links: [
                { name: 'Blog', href: '#' },
                { name: 'Community', href: '#' }
            ]
        },
        {
            title: 'Support',
            links: [
                { name: 'Feedback', href: '#' },
                { name: 'Documentation', href: '#' },
                { name: 'Release Notes', href: '#' },
                { name: 'Forums', href: '#' }
            ]
        },
        {
            title: 'Company',
            links: [
                { name: 'About Us', href: '#' },
                { name: 'Resources', href: '#' },
                { name: 'Blog', href: '#' },
                { name: 'Customers', href: '#' },
                { name: 'Partners', href: '#' },
                { name: 'Newsroom', href: '#' },
                { name: 'Events and Webinars', href: '#' },
                { name: 'Careers', href: '#' },
                { name: 'Contact Us', href: '#' },
                { name: 'System Status', href: '#', icon: <ExternalLink className="inline-block ml-1 w-3 h-3" /> }
            ]
        }
    ];

    const socialIcons = [
        { Icon: Facebook, href: '#' },
        { Icon: Twitter, href: '#' }, // Using Twitter as X icon substitute
        { Icon: Youtube, href: '#' },
        { Icon: Linkedin, href: '#' },
        { Icon: Rss, href: '#' }
    ];

    return (
        <footer className="bg-[#1d2c3c] text-[#d6d9dc] pt-12 pb-8 px-6 md:px-12 lg:px-24">
            <div className="max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-16">
                    {/* Logo Column */}
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-8">
                             <img src="/logo.png" alt="QuizHub Logo" className="w-8 h-8 object-contain" />
                             <span className="text-xl font-black tracking-tighter text-white">Quiz<span className="text-[#32a8ff]">Hub</span></span>
                        </Link>
                    </div>

                    {/* Links Columns */}
                    {footerLinks.map((column, idx) => (
                        <div key={idx} className="flex flex-col gap-4">
                            <h4 className="text-white font-bold text-base leading-tight mb-2">
                                {column.title}
                            </h4>
                            <ul className="flex flex-col gap-2">
                                {column.links.map((link, lIdx) => (
                                    <li key={lIdx}>
                                        <a 
                                            href={link.href} 
                                            className="text-[#939ca5] hover:text-white transition-colors text-[14.4px] leading-[1.2]"
                                        >
                                            {link.name}
                                            {link.icon && link.icon}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Separator */}
                <div className="border-t border-[#34414e] my-8"></div>

                {/* Bottom Bar */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#939ca5] text-[13px]">
                        <span>© 2026 QuizHub Global Inc. All rights reserved.</span>
                        <span className="hidden md:inline">|</span>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <span className="hidden md:inline">|</span>
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <span className="hidden md:inline">|</span>
                        <a href="#" className="hover:text-white transition-colors">Legal</a>
                    </div>

                    <div className="flex items-center gap-4">
                        {socialIcons.map(({ Icon, href }, idx) => (
                            <a 
                                key={idx} 
                                href={href} 
                                className="w-[30px] h-[30px] bg-[#939ca5] rounded-[4px] flex items-center justify-center text-black hover:bg-white transition-all transform hover:-translate-y-0.5"
                            >
                                <Icon size={16} fill="currentColor" strokeWidth={0} />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Cookies Setting Button */}
                <div className="mt-8">
                    <button className="bg-[#415162] text-white text-[13px] px-3 py-1.5 rounded-[4px] hover:bg-[#526478] transition-colors leading-none">
                        Cookies Settings
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
