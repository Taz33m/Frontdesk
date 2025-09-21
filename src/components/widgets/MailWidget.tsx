import React, { useState, useEffect, useRef } from "react";
import { Mail, Star, Archive, Trash2, ChevronDown, ChevronUp, Sparkles, X, Paperclip, Download, Loader2, Send, ArrowLeft, CornerUpLeft } from "lucide-react";
import { FlippableCard } from "../FlippableCard";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { fetchEmailData, transformEmailForUI, TransformedEmail } from "../../lib/emailUtils";

// Use the TransformedEmail interface from emailUtils
type Email = TransformedEmail;

// Toast implementation
const toast = (options: { title: string; description: string; variant?: 'default' | 'destructive' | 'success' }) => {
  const variant = options.variant || 'default';
  
  if (variant === 'destructive') {
    console.error(`[Error] ${options.title}: ${options.description}`);
  } else if (variant === 'success') {
    console.log(`[Success] ${options.title}: ${options.description}`);
  } else {
    console.log(`[${options.title}] ${options.description}`);
  }
};

interface MailWidgetProps {
  onExpand?: () => void;
  icon?: React.ReactNode;
}

// Email View Modal Component
const EmailViewModal: React.FC<{ 
  email: Email | null; 
  onClose: () => void;
  onReplySent?: () => void;
}> = ({ email, onClose, onReplySent }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleReplyClick = () => {
    setIsReplying(true);
    // Set default reply content with quoted text
    setReplyContent(`\n\n---------- Original Message ----------\nFrom: ${email?.sender}\nDate: ${email?.date}\nSubject: ${email?.subject}\n\n${email?.content}`);
    // Focus the textarea after a small delay to ensure it's rendered
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSendReply = async () => {
    if (!email || !replyContent.trim()) return;
    
    setIsSending(true);
    try {
      // Extract the email address from the sender string (handles "Name <email@example.com>" format)
      const extractEmail = (emailStr: string) => {
        const match = emailStr.match(/<([^>]+)>/);
        return match ? match[1] : emailStr;
      };

      const response = await fetch('http://localhost:5004/send_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: extractEmail(email.sender),
          subject: `Re: ${email.subject}`,
          body: replyContent.trim(),
          // Include thread information if available
          ...(email.threadId && { threadId: email.threadId }),
          ...(email.references && { references: email.references })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }

      toast({
        title: 'Success',
        description: 'Your reply has been sent successfully!',
      });
      
      // Reset form and close the reply section
      setReplyContent('');
      setIsReplying(false);
      
      // Notify parent component that a reply was sent
      if (onReplySent) onReplySent();
      
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyContent('');
  };
  // Don't render if no email is provided
  if (!email) {
    return null;
  }
  
  // Format file size in a human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get an appropriate icon class based on file type
  const getFileIcon = (type: string): string => {
    const icons: Record<string, string> = {
      pdf: 'text-red-500',
      doc: 'text-blue-500',
      xls: 'text-green-600',
      jpg: 'text-purple-500',
      png: 'text-teal-500',
      zip: 'text-yellow-500',
    };
    return icons[type] || 'text-gray-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">{email.subject}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Email Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-800 font-medium">
                {email.sender.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{email.sender}</p>
                <p className="text-sm text-gray-500">to me</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {email.date} at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>
        
        {/* Email Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="prose max-w-none">
            <p>{email.content}</p>
            <p className="mt-4">Best regards,<br/>{email.sender}</p>
          </div>
          
          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Paperclip className="h-4 w-4 mr-2" />
                {email.attachments.length} {email.attachments.length === 1 ? 'Attachment' : 'Attachments'}
              </h4>
              <div className="space-y-2">
                {email.attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-md ${getFileIcon(file.type)} bg-opacity-10`}>
                        <Paperclip className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)} • {file.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <a 
                      href={file.url} 
                      download
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      onClick={e => e.stopPropagation()}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Reply Button */}
        {!isReplying && (
          <div className="p-3 border-t">
            <Button 
              onClick={handleReplyClick}
              variant="ghost" 
              size="sm"
              className="text-blue-600 hover:bg-blue-50"
            >
              <CornerUpLeft className="h-4 w-4 mr-2" />
              Reply
            </Button>
          </div>
        )}

        {/* Reply Form */}
        {isReplying && (
          <div className="p-4 border-t bg-white">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium">Reply to {email?.sender}</h4>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsReplying(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              ref={textareaRef}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply here..."
              className="min-h-[150px] w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end space-x-2 mt-3">
              <Button 
                variant="outline" 
                onClick={() => setIsReplying(false)}
                disabled={isSending}
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendReply}
                disabled={isSending || !replyContent.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <div className="text-xs text-gray-500">
            {email?.date}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              disabled={isSending}
              className="px-4"
            >
              Close
            </Button>
            {!isReplying && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleReplyClick}
                disabled={isSending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4"
              >
                <CornerUpLeft className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function MailWidget({ onExpand, icon }: MailWidgetProps) {
  // Initialize state with proper types
  const [emails, setEmails] = useState<Email[]>(() => []);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(() => new Set());
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [viewingEmail, setViewingEmail] = useState<Email | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleReplyClick = (email: Email) => {
    setIsReplying(true);
    setReplyContent(`\n\n---------- Original Message ----------\nFrom: ${email.sender}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.content}`);
    // Focus the textarea after a small delay to ensure it's rendered
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSendReply = async () => {
    if (!viewingEmail || !replyContent.trim()) return;
    
    setIsSending(true);
    try {
      // Extract the email address from the sender string (handles "Name <email@example.com>" format)
      const extractEmail = (emailStr: string) => {
        // First try to extract from format "Name <email@example.com>"
        const match = emailStr.match(/<([^>]+)>/);
        if (match) return match[1];
        
        // If it's just an email, return it
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
          return emailStr;
        }
        
        // If it's just a name, use the user's email from the configuration
        // You might want to replace this with actual user email from your auth context
        return 'user@example.com'; // Replace with actual user email
      };

      const response = await fetch('http://localhost:5004/send_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: extractEmail(viewingEmail.sender),
          subject: `Re: ${viewingEmail.subject}`,
          body: replyContent.trim(),
          // Include thread information if available
          ...(viewingEmail.threadId && { threadId: viewingEmail.threadId }),
          ...(viewingEmail.references && { references: viewingEmail.references })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }

      // Show success popup
      alert('Your message has been sent successfully!');
      
      // Also show toast for consistency
      toast({
        title: 'Success',
        description: 'Your reply has been sent successfully!',
        variant: 'success'
      });
      
      // Reset form and close the reply section
      setReplyContent('');
      setIsReplying(false);
      
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Fetch email data on component mount
  useEffect(() => {
    const loadEmails = async () => {
      try {
        setIsLoading(true);
        const data = await fetchEmailData();
        
        // Transform the email data using our utility function
        const transformedEmails = data.emails
          .map(email => {
            try {
              return transformEmailForUI(email);
            } catch (error) {
              console.error('Error transforming email:', error);
              return null;
            }
          })
          .filter((email): email is Email => email !== null); // Ensure we have valid emails
        
        setEmails(transformedEmails);
      } catch (error) {
        console.error('Failed to load emails:', error);
        toast({
          title: 'Error',
          description: 'Failed to load emails. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEmails();
  }, []);

  // Toggle the expanded state of an email
  const toggleEmail = (id: string, event?: React.MouseEvent): void => {
    // Prevent event bubbling if an event was provided
    event?.stopPropagation();
    
    // Toggle the expanded state of the email
    setExpandedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    const icons: Record<string, string> = {
      pdf: 'text-red-500',
      doc: 'text-blue-500',
      xls: 'text-green-600',
      jpg: 'text-purple-500',
      png: 'text-teal-500',
      zip: 'text-yellow-500',
    };
    return icons[type] || 'text-gray-500';
  };

  // Handle keyboard events for the modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewingEmail) {
        setViewingEmail(null);
      }
    };

    // Add event listener when component mounts
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewingEmail]);

  const handleCloseEmail = (): void => {
    setViewingEmail(null);
  };

  const handleViewEmail = (email: Email): void => {
    setViewingEmail(email);
  };

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const handleGenerateSummary = async (): Promise<void> => {
    setIsSummarizing(true);
    try {
      // TODO: Implement actual summary generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Summary Generated',
        description: 'AI summary has been generated for your emails.',
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate summary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const closeSummaryModal = (): void => {
    setShowSummaryModal(false);
  };

  const handleSummarizeAll = (): void => {
    setShowSummaryModal(true);
  };

  const frontContent = (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          {isLoading ? 'Loading emails...' : `Recent emails (${emails.length})`}
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700"
          onClick={handleSummarizeAll}
          disabled={isSummarizing || isLoading}
        >
          {isSummarizing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              Summarizing...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Summarize All
            </>
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading emails...</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Mail className="h-8 w-8 mb-2 text-gray-300" />
            <p>No emails found</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {emails.map((email) => (
          <li 
            key={email.id} 
            className={`rounded-lg border ${selectedEmail === email.id ? 'border-blue-300 bg-blue-50' : 'border-transparent hover:bg-gray-50'} transition-colors`}
            onClick={(e) => {
              e.stopPropagation();
              toggleEmail(email.id);
            }}
          >
            <div className="p-3 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium
                    ${email.priority === 'high' ? 'bg-red-100 text-red-800' : 
                      email.priority === 'normal' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {email.sender.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900 truncate">{email.sender}</p>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{email.time}</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium mt-0.5 line-clamp-1">{email.subject}</p>
                  {email.priority === "high" && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      Priority
                    </Badge>
                  )}
                  {email.hasAttachments && (
                    <Paperclip className="h-3 w-3 text-gray-400 mt-1" />
                  )}
                </div>
                <div className="flex-shrink-0 ml-2">
                  {expandedEmails.has(email.id) ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              {expandedEmails.has(email.id) && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-700 mb-2 line-clamp-3">{email.summary || 'No summary available'}</p>
                  <div className="flex justify-end mt-2 space-x-2">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <Archive className="h-3.5 w-3.5 mr-1.5" />
                          Archive
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700">
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                      <div className="ml-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs bg-white hover:bg-gray-50 border-gray-300"
                          onClick={() => handleViewEmail(email)}
                        >
                          View Email
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
        </ul>
        )}
        {emails.length > 0 && (
          <p className="text-xs text-gray-500 mt-4 italic">
            Showing {emails.length} email{emails.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );

  // Summary Modal Component
  const SummaryModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-semibold text-gray-900">Email Summaries</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 -mr-2 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close summary"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="bg-blue-50 p-5 rounded-xl">
              <h3 className="font-medium text-blue-800 text-lg mb-3">Key Insights</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-2 pl-2">
                <li>{emails.filter(e => e.priority === 'high').length} high priority emails require your attention</li>
                <li>{emails.length} messages in your inbox</li>
                <li>{emails.filter(e => e.subject.toLowerCase().includes('meeting')).length} meeting requests</li>
                <li>{emails.filter(e => e.attachments?.length > 0).length} emails with attachments</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 text-lg mb-4">Priority Items</h3>
              <div className="space-y-4">
                {emails
                  .filter(e => e.priority === "high")
                  .slice(0, 5)
                  .map((email) => (
                    <div key={email.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-800 font-medium">
                            {email.sender.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-xs">
                                High Priority
                              </Badge>
                              <span className="text-xs text-gray-500">{email.time}</span>
                            </div>
                          </div>
                          <h4 className="font-medium text-gray-900 mt-1">{email.subject}</h4>
                          <p className="text-sm text-gray-600 mb-2">From: {email.sender}</p>
                          <div className="prose prose-sm text-gray-700 max-w-none">
                            {email.summary.split('\n').map((paragraph: string, i: number) => (
                              <p key={i} className="mb-3 last:mb-0">
                                {paragraph || <br />}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 text-lg mb-4">All Summaries</h3>
              <div className="space-y-4">
                {emails.map((email) => (
                  <div key={email.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full bg-${email.priority === 'high' ? 'red' : email.priority === 'normal' ? 'blue' : 'gray'}-100 flex items-center justify-center text-${email.priority === 'high' ? 'red' : email.priority === 'normal' ? 'blue' : 'gray'}-800 font-medium`}>
                          {email.sender.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {email.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                High Priority
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{email.time}</span>
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-900 mt-1">{email.subject}</h4>
                        <p className="text-sm text-gray-600 mb-2">From: {email.sender}</p>
                        <div className="prose prose-sm text-gray-700 max-w-none">
                          {email.summary.split('\n').map((paragraph: string, i: number) => (
                            <p key={i} className="mb-3 last:mb-0">
                              {paragraph || <br />}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
  
  const backContent = (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md mx-auto">
        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Email Summaries</h3>
        <p className="text-gray-600 mb-6">Click "Summarize All" to generate summaries of your emails.</p>
        <Button 
          variant="default" 
          onClick={(e) => {
            e.stopPropagation();
            handleSummarizeAll();
          }}
          disabled={isSummarizing}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isSummarizing ? 'Generating Summaries...' : 'Generate Summaries'}
        </Button>
      </div>
    </div>
  );

  return (
  <>
    <FlippableCard
      icon={icon || <Mail className="h-5 w-5" />}
      title="Inbox"
      count={emails.length}
      frontContent={frontContent}
      backContent={backContent}
      className="h-full"
      isFlipped={false}
    />
    {showSummaryModal && <SummaryModal onClose={closeSummaryModal} />}
    
    {/* Email View Modal - Matches widget aspect ratio */}
    {viewingEmail && (
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 m-0 overflow-y-auto"
        onClick={() => setViewingEmail(null)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
      >
        <div 
          className="bg-white shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col rounded-2xl overflow-hidden transform transition-all"
          style={{
            aspectRatio: '16/10', // Matches common widget aspect ratio
            maxHeight: '90vh',
            maxWidth: '90vw'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-10">
            <div className="flex-1 min-w-0">
              <h1 
                id="email-modal-title" 
                className="text-2xl font-semibold text-gray-900 mb-1 leading-tight"
              >
                {viewingEmail.subject}
              </h1>
              <div className="flex items-center text-sm text-gray-500">
                <span className="truncate">{viewingEmail.sender} &lt;{viewingEmail.senderEmail}&gt;</span>
                <span className="mx-2">•</span>
                <span>{viewingEmail.date}</span>
              </div>
            </div>
            <button 
              onClick={() => setViewingEmail(null)}
              className="text-gray-400 hover:text-gray-600 p-2 -mr-2 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0"
              aria-label="Close email"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Email Header - Simplified */}
          <div className="px-6 pt-2 pb-3 border-b">
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{viewingEmail.sender}</p>
                    <p className="text-sm text-gray-500">to me</p>
                  </div>
                  <div className="text-sm text-gray-500 whitespace-nowrap ml-4">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Email Body */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-3xl mx-auto w-full px-6 py-4">
              <div className="prose prose-slate max-w-none text-gray-800 text-[15.5px] leading-relaxed -mt-1">
                <div className="whitespace-pre-line break-words">
                  {viewingEmail.content.split('\n').map((paragraph: string, i: number) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {paragraph || <br className="h-4" />}
                    </p>
                  ))}
                </div>
                <div className="mt-8 pt-4 border-t border-gray-100">
                  <p className="text-gray-700">
                    Best regards,<br/>
                    <span className="font-medium">{viewingEmail.sender}</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Attachments */}
            {viewingEmail.attachments && viewingEmail.attachments.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Paperclip className="h-4 w-4 mr-2" />
                  {viewingEmail.attachments.length} {viewingEmail.attachments.length === 1 ? 'Attachment' : 'Attachments'}
                </h4>
                <div className="space-y-2">
                  {viewingEmail.attachments.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${getFileIcon(file.type)} bg-opacity-10`}>
                          <Paperclip className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)} • {file.type.toUpperCase()}</p>
                        </div>
                      </div>
                      <a 
                        href={file.url} 
                        download
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center px-3 py-1.5 rounded-md hover:bg-blue-50"
                        onClick={e => e.stopPropagation()}
                      >
                        <Download className="h-4 w-4 mr-1.5" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="px-4 py-2 border-t flex justify-between items-center bg-white/95 backdrop-blur-sm sticky bottom-0 border-gray-100">
            <div className="text-sm text-gray-500">
              {viewingEmail.attachments?.length > 0 && (
                <span className="flex items-center">
                  <Paperclip className="h-4 w-4 mr-1.5" />
                  {viewingEmail.attachments.length} {viewingEmail.attachments.length === 1 ? 'attachment' : 'attachments'}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" onClick={() => setViewingEmail(null)}>
                Close
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleReplyClick(viewingEmail)}
              >
                <CornerUpLeft className="h-4 w-4 mr-2" />
                Reply
              </Button>
            </div>
          </div>
          
          {/* Reply Form */}
          {isReplying && viewingEmail && (
            <div className="p-4 border-t bg-white">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium">Reply to {viewingEmail.sender}</h4>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsReplying(false)}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                ref={textareaRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
                className="min-h-[150px] w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex justify-end space-x-2 mt-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsReplying(false)}
                  disabled={isSending}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendReply}
                  disabled={isSending || !replyContent.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  );
}