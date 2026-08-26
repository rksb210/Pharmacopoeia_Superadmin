import React from 'react';
import { Badge } from '../../ui/badge';
import {
  BookOpen,
  Clock,
  Calendar,
  Video,
  GraduationCap,
  Megaphone,
  GitBranch,
  Bell,
} from 'lucide-react';

export const NotificationCategoryBadge = ({ category }) => {
  switch (category) {
    case 'NEW_CONTENT':
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 text-[9px] font-bold">
          <BookOpen className="w-2.5 h-2.5 mr-1" />
          <span>New Content</span>
        </Badge>
      );

    case 'SUBSCRIPTION_EXPIRY':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[9px] font-bold">
          <Clock className="w-2.5 h-2.5 mr-1" />
          <span>Subscription Expiry</span>
        </Badge>
      );

    case 'EVENTS':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-[9px] font-bold">
          <Calendar className="w-2.5 h-2.5 mr-1" />
          <span>Event / Conference</span>
        </Badge>
      );

    case 'WEBINARS':
      return (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[9px] font-bold">
          <Video className="w-2.5 h-2.5 mr-1" />
          <span>Webinar</span>
        </Badge>
      );

    case 'TRAINING':
      return (
        <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-[9px] font-bold">
          <GraduationCap className="w-2.5 h-2.5 mr-1" />
          <span>CME Training</span>
        </Badge>
      );

    case 'ANNOUNCEMENT':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 text-[9px] font-bold">
          <Megaphone className="w-2.5 h-2.5 mr-1" />
          <span>Announcement</span>
        </Badge>
      );

    case 'WORKFLOW':
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300 text-[9px] font-bold">
          <GitBranch className="w-2.5 h-2.5 mr-1" />
          <span>Workflow Alert</span>
        </Badge>
      );

    default:
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[9px] font-bold">
          <Bell className="w-2.5 h-2.5 mr-1" />
          <span>General</span>
        </Badge>
      );
  }
};

export default NotificationCategoryBadge;
