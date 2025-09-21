import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, MessageSquare, AtSign } from 'lucide-react';
import { Badge } from '../ui/badge';

interface SlackMention {
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
}

interface SlackMentionsData {
  generated_at: string;
  total_mentions: number;
  actual_mentions_count: number;
  mentions: SlackMention[];
  summary: {
    ai_summary: string;
    total_count: number;
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
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function SlackMentionsReport() {
  const [data, setData] = useState<SlackMentionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mentions' | 'summary'>('mentions');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/mails_widget/slack_mentions_report.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        console.error('Error fetching Slack mentions:', err);
        setError('Failed to load Slack mentions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
        <p>No data available</p>
      </div>
    );
  }

  const unreadMentions = data.mentions.filter(m => m.message_type !== 'system');
  const hasUnread = unreadMentions.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <h2 className="font-medium flex items-center gap-2">
          <AtSign className="h-4 w-4 text-blue-500" />
          Slack Mentions
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={hasUnread ? 'destructive' : 'secondary'}>
            {hasUnread ? `${unreadMentions.length} unread` : 'All caught up'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex">
        <button
          onClick={() => setActiveTab('mentions')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'mentions'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Mentions
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'summary'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Summary
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'mentions' ? (
          <div className="space-y-4">
            {unreadMentions.length > 0 ? (
              <ul className="divide-y">
                {unreadMentions.map((mention, index) => (
                  <li key={`${mention.timestamp}-${index}`} className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {priorityIcons[getMentionPriority(mention)]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {mention.user_name || 'System'}
                            <span className="ml-2 text-xs text-gray-500">
                              in #{mention.channel_name || 'general'}
                            </span>
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatDate(mention.date)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          {mention.text}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                <p className="text-sm text-gray-500">No unread mentions</p>
                <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Summary</h3>
              <p className="text-sm text-gray-700 mb-4">
                {data.summary?.ai_summary || 'No summary available'}
              </p>
              
              <h4 className="text-sm font-medium mb-2">Key Actions</h4>
              {data.summary?.key_actions && data.summary.key_actions.length > 0 ? (
                <ul className="space-y-2">
                  {data.summary.key_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{action}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No key actions available</p>
              )}
            </div>
            
            <div className="pt-4 border-t mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Total Mentions</p>
                  <p className="text-lg font-medium">{data.total_mentions}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500">Unread</p>
                  <p className="text-lg font-medium">{data.actual_mentions_count}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t px-4 py-2 text-xs text-gray-500">
        <p>Last updated: {new Date(data.generated_at).toLocaleString()}</p>
      </div>
    </div>
  );
}
