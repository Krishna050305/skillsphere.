import React from 'react';
import { Globe, MapPin, Send, CheckCircle2, User, Award, ExternalLink, Paperclip, Star, MessageCircle, Rocket, Bell, Briefcase, Gift, DollarSign, Sun, Moon, Menu, X, Video } from 'lucide-react';

export const IconGlobe = (props) => <Globe {...props} />;
export const IconMapPin = (props) => <MapPin {...props} />;
export const IconSend = (props) => <Send {...props} />;
export const IconCheck = (props) => <CheckCircle2 {...props} />;
export const IconUser = (props) => <User {...props} />;
export const IconAward = (props) => <Award {...props} />;
export const IconExternal = (props) => <ExternalLink {...props} />;
export const IconPaperclip = (props) => <Paperclip {...props} />;
export const IconStar = (props) => <Star {...props} />;
export const IconMessage = (props) => <MessageCircle {...props} />;
export const IconRocket = (props) => <Rocket {...props} />;
export const IconBell = (props) => <Bell {...props} />;
export const IconBriefcase = (props) => <Briefcase {...props} />;
export const IconGift = (props) => <Gift {...props} />;
export const IconDollar = (props) => <DollarSign {...props} />;
export const IconSun = (props) => <Sun {...props} />;
export const IconMoon = (props) => <Moon {...props} />;
export const IconMenu = (props) => <Menu {...props} />;
export const IconX = (props) => <X {...props} />;
export const IconVideo = (props) => <Video {...props} />;

// Small presentational SVGs for alerts/empty states not in lucide imports
export const IconAlert = ({ className, style }) => (
  <svg className={className} width="36" height="36" viewBox="0 0 24 24" fill="none" style={style} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 9v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

export const IconEmpty = ({ className, style }) => (
  <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" style={style} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8 14s1.5-2 4-2 4 2 4 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default {
  IconGlobe,
  IconMapPin,
  IconSend,
  IconCheck,
  IconUser,
  IconAward,
  IconExternal,
  IconPaperclip,
  IconStar,
  IconMessage,
  IconRocket,
  IconBell,
  IconBriefcase,
  IconGift,
  IconDollar,
  IconSun,
  IconMoon,
  IconMenu,
  IconX,
  IconVideo,
  IconAlert,
  IconEmpty,
};
