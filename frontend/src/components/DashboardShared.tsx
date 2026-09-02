import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bell, Calendar as CalendarIcon, ExternalLink, CalendarX2, FileX2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { useNavigate } from 'react-router-dom';

export const RecentNoticesCard = ({ notices, basePath }: { notices: any[], basePath: string }) => {
  const navigate = useNavigate();
  return (
    <Card className="border border-border/50 shadow-sm flex flex-col h-full bg-card">
      <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4 pb-4">
        <div className="flex justify-between items-center w-full gap-2 min-w-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" /> Recent Notices
          </CardTitle>
          {notices.length > 0 && (
            <button 
              onClick={() => navigate(`${basePath}/notice`)}
              className="text-xs text-primary font-medium flex items-center hover:underline"
            >
              View All <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {notices.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground flex-1">
            <div className="p-3 bg-muted rounded-full mb-3">
              <FileX2 className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm font-medium">No recent notices</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notices.slice(0, 5).map((notice: any, idx: number) => (
              <div 
                key={idx} 
                className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer"
                onClick={() => navigate(`${basePath}/notice`)}
              >
                <div className="flex justify-between items-start gap-2 mb-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors flex-1 min-w-0 break-words">{notice.title}</h4>
                  {notice.priority && (
                    <Badge variant="outline" className={`text-[10px] shrink-0 border-0 ${
                      notice.priority === 'HIGH' ? 'bg-destructive/10 text-destructive' :
                      notice.priority === 'MEDIUM' ? 'bg-warning/10 text-warning' :
                      'bg-success/10 text-success'
                    }`}>
                      {notice.priority}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>{notice.category || 'General'}</span>
                  <span>{new Date(notice.publishDate || notice.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const UpcomingEventsCard = ({ events, basePath }: { events: any[], basePath: string }) => {
  const navigate = useNavigate();
  return (
    <Card className="border border-border/50 shadow-sm flex flex-col h-full bg-card">
      <CardHeader className="bg-muted/20 border-b border-border/50 px-5 py-4 pb-4">
        <div className="flex justify-between items-center w-full gap-2 min-w-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-purple-500" /> Upcoming Events
          </CardTitle>
          {events.length > 0 && (
            <button 
              onClick={() => navigate(`${basePath}/events`)}
              className="text-xs text-primary font-medium flex items-center hover:underline"
            >
              View All <ExternalLink className="w-3 h-3 ml-1" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {events.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center text-muted-foreground flex-1">
            <div className="p-3 bg-muted rounded-full mb-3">
              <CalendarX2 className="w-6 h-6 opacity-50" />
            </div>
            <p className="text-sm font-medium">No upcoming events scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {events.slice(0, 5).map((event: any, idx: number) => (
              <div 
                key={idx} 
                className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer flex gap-4 items-center min-w-0"
                onClick={() => navigate(`${basePath}/events`)}
              >
                <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg p-2 min-w-[50px] shrink-0 border border-primary/20">
                  <span className="text-[10px] uppercase font-bold tracking-wider leading-none">{new Date(event.startDate || Date.now()).toLocaleDateString(undefined, { month: 'short' })}</span>
                  <span className="text-lg font-black leading-none mt-1">{new Date(event.startDate || Date.now()).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{event.name}</h4>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    {event.type}
                    {event.location && ` • ${event.location}`}
                  </p>
                </div>
                {event.registrationRequired && (
                  <Badge variant="outline" className="text-[10px] shrink-0 bg-secondary/10 text-secondary border-secondary/20">
                    Reg Reqd
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
