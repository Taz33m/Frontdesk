import { useState } from 'react';

interface SendReplyParams {
  to: string;
  subject: string;
  message: string;
  threadId?: string;
  references?: string;
}

export function useGmailReply() {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const sendReply = async ({
    to,
    subject,
    message,
    threadId,
    references,
  }: SendReplyParams) => {
    setIsSending(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await fetch('/api/send-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          message,
          threadId,
          references,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      setIsSuccess(true);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  return { sendReply, isSending, error, isSuccess };
}

export default useGmailReply;
