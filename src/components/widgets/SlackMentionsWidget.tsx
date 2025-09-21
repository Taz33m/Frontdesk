import { AtSign, MessageSquare, Check, Clock, AlertCircle, Bell, CheckCircle } from "lucide-react";
import { FlippableCard } from "../FlippableCard";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";

interface SlackMention {
  id: string;
  timestamp: string;
  date: string;
  user: string;
  user_name: string;
  text: string;
  channel_id: string;
  channel_name: string;
  channel_type: string;
  mention_type: string;
  message_type: string;
  is_read?: boolean;
}

interface SlackMentionsData {
  generated_at: string;
  total_mentions: number;
  actual_mentions_count: number;
  mentions: SlackMention[];
  summary: {
    ai_summary: string;
    total_count: number;
    mention_breakdown: Record<string, unknown>;
    priority_level: string;
    key_actions: string[];
  };
}

const priorityIcons = {
  high: <AlertCircle className="h-4 w-4 text-red-500" />,
  medium: <Clock className="h-4 w-4 text-yellow-500" />,
  low: <MessageSquare className="h-4 w-4 text-blue-500" />,
  none: <CheckCircle className="h-4 w-4 text-green-500" />
};

const getMentionPriority = (mention: SlackMention) => {
  if (mention.mention_type === 'direct') return 'high';
  if (mention.mention_type === 'channel') return 'medium';
  return 'low';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export function SlackMentionsWidget({ onExpand }: { onExpand?: () => void }) {
  const [mentionsData, setMentionsData] = useState<SlackMentionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mentions' | 'summary'>('mentions');

  useEffect(() => {
    // In a real app, you would fetch this from your API
    const fetchMentions = async () => {
      try {
        // This would be an API call in production
        // const response = await fetch('/api/slack/mentions');
        // const data = await response.json();
        
        // For now, we'll use the local file
        const response = await fetch('/mails_widget/slack_mentions_report.json');
        const data = await response.json();
        setMentionsData(data);
      } catch (error) {
        console.error('Error fetching Slack mentions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentions();
  }, []);

  const markAsRead = (mentionId: string) => {
    // In a real app, this would update the backend
    setMentionsData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        mentions: prev.mentions.map(m => 
          m.id === mentionId ? { ...m, is_read: true } : m
        )
      };
    });
  };

  const unreadMentions = mentionsData?.mentions.filter(m => !m.is_read) || [];
  const hasUnread = unreadMentions.length > 0;

  const frontContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Slack Mentions</p>
        <Badge variant={hasUnread ? 'destructive' : 'secondary'}>  
          {hasUnread ? `${unreadMentions.length} unread` : 'All caught up'}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : hasUnread ? (
        <ul className="space-y-3">
          {unreadMentions.slice(0, 3).map((mention) => (
            <li key={mention.id} className="p-2 hover:bg-gray-50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="mt-1">
                  <AtSign className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {mention.user_name || 'Unknown User'}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(mention.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {mention.text}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{mention.channel_name || 'general'}
                    </Badge>
                    <button 
                      onClick={() => markAsRead(mention.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Mark as read
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-6">
          <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
          <p className="text-sm text-gray-500">You're all caught up!</p>
          <p className="text-xs text-gray-400 mt-1">No unread mentions</p>
        </div>
      )}
    </div>
  );

  const backContent = (
    <div className="space-y-4">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('mentions')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'mentions' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Mentions
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'summary' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Summary
        </button>
      </div>

      {activeTab === 'mentions' ? (
        <div className="space-y-4">
          {mentionsData?.mentions.length ? (
            <ul className="divide-y">
              {mentionsData.mentions.map((mention) => (
                <li key={mention.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {priorityIcons[getMentionPriority(mention)]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {mention.user_name || 'Unknown User'}
                          <span className="ml-2 text-xs text-gray-500">
                            in #{mention.channel_name || 'general'}
                          </span>
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(mention.date)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {mention.text}
                      </p>
                      {!mention.is_read && (
                        <button 
                          onClick={() => markAsRead(mention.id)}
                          className="mt-1 text-xs text-blue-600 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <Bell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No mentions found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {mentionsData?.summary ? (
            <div>
              <h3 className="text-sm font-medium mb-2">Summary</h3>
              <p className="text-sm text-gray-700 mb-4">
                {mentionsData.summary.ai_summary}
              </p>
              
              <h4 className="text-sm font-medium mb-2">Key Actions</h4>
              <ul className="space-y-2">
                {mentionsData.summary.key_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No summary available</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <FlippableCard
      icon={<AtSign className="h-4 w-4" />}
      title="Slack Mentions"
      count={unreadMentions.length}
      frontContent={frontContent}
      backContent={backContent}
      onExpand={onExpand}
    />
  );
}
