
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, ExternalLink, Loader2, Mail, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isValidUUID } from '@/utils/securityUtils';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

interface ShareWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheetId: string;
  worksheetTitle: string;
  studentEmail?: string; // Pre-fill from student profile if available
}

const ShareWorksheetModal = ({ 
  isOpen, 
  onClose, 
  worksheetId, 
  worksheetTitle,
  studentEmail: initialStudentEmail 
}: ShareWorksheetModalProps) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(initialStudentEmail || '');
  const [saveEmailForVerification, setSaveEmailForVerification] = useState(true);
  const { toast } = useToast();
  const { refreshProgress } = useOnboardingProgress();

  // Update recipient email when initialStudentEmail changes
  useEffect(() => {
    if (initialStudentEmail) {
      setRecipientEmail(initialStudentEmail);
    }
  }, [initialStudentEmail]);

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) {
      setShareUrl('');
      setIsSendingEmail(false);
    }
  }, [isOpen]);

  const generateShareLink = async () => {
    setIsGenerating(true);
    
    try {
      console.log('Starting share link generation...');
      console.log('Worksheet ID:', worksheetId);
      console.log('Worksheet Title:', worksheetTitle);

      // Validate worksheetId format
      if (!worksheetId || !isValidUUID(worksheetId)) {
        console.error('Invalid worksheet ID format:', worksheetId);
        throw new Error('Invalid worksheet ID format');
      }

      // Get current user and validate authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Authentication error: ' + userError.message);
      }
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('You must be logged in to share worksheets');
      }

      // Check if user is anonymous
      if (user.is_anonymous) {
        console.error('Anonymous user attempting to share worksheet');
        throw new Error('Anonymous users cannot share worksheets. Please create an account first.');
      }

      console.log('Authenticated user ID:', user.id);
      console.log('User email:', user.email);

      // Call the RPC function with proper error handling
      console.log('Calling generate_worksheet_share_token RPC...');
      const { data: shareToken, error: rpcError } = await supabase.rpc('generate_worksheet_share_token' as any, {
        p_worksheet_id: worksheetId,
        p_teacher_id: user.id,
        p_expires_hours: 168 // 7 days
      });

      console.log('RPC response - data:', shareToken);
      console.log('RPC response - error:', rpcError);

      if (rpcError) {
        console.error('RPC function error:', rpcError);
        throw new Error(`Failed to generate share token: ${rpcError.message}`);
      }

      if (!shareToken) {
        console.error('RPC returned null/empty token - worksheet may not exist or user may not have permission');
        throw new Error('Unable to generate share link. You may not have permission to share this worksheet or it may not exist.');
      }

      const url = `${window.location.origin}/shared/${shareToken}`;
      setShareUrl(url);
      
      console.log('Generated share URL:', url);
      
      // ENHANCED: Immediate onboarding refresh after sharing with multiple triggers
      console.log('[ShareWorksheet] Triggering onboarding refresh after share link generation');
      refreshProgress();
      setTimeout(refreshProgress, 500);
      setTimeout(refreshProgress, 1500);
      
      toast({
        title: "Share link generated",
        description: "Your worksheet share link is ready (expires in 7 days)",
        className: "bg-green-50 border-green-200"
      });

    } catch (error) {
      console.error('Share link generation failed:', error);
      
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Failed to generate share link", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      toast({
        title: "Copy failed",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const openInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  const sendEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address",
        variant: "destructive"
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to send emails');
      }

      const response = await supabase.functions.invoke('send-worksheet-email', {
        body: {
          worksheetId,
          studentEmail: recipientEmail.toLowerCase(),
          updateShareRecipientEmail: saveEmailForVerification
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send email');
      }

      toast({
        title: "Email sent!",
        description: `Worksheet link sent to ${recipientEmail}`,
        className: "bg-green-50 border-green-200"
      });

    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: "Failed to send email",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Worksheet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Worksheet:</p>
            <p className="font-medium">{worksheetTitle}</p>
          </div>

          {!shareUrl && (
            <Button 
              onClick={generateShareLink}
              disabled={isGenerating}
              className="w-full bg-worksheet-purple hover:bg-worksheet-purpleDark"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Generate Share Link
                </>
              )}
            </Button>
          )}

          {shareUrl && (
            <div className="space-y-4">
              {/* Share Link Section */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Share this link:</p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                  <input 
                    type="text" 
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={openInNewTab}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 bg-worksheet-purple hover:bg-worksheet-purpleDark"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              </div>

              {/* Email Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-medium">Send via Email</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="recipientEmail" className="text-sm">Student Email</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="student@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="saveEmail" 
                      checked={saveEmailForVerification}
                      onCheckedChange={(checked) => setSaveEmailForVerification(checked as boolean)}
                    />
                    <Label htmlFor="saveEmail" className="text-xs text-gray-600">
                      Save this email for student verification access
                    </Label>
                  </div>

                  <Button
                    onClick={sendEmail}
                    disabled={isSendingEmail || !recipientEmail}
                    variant="outline"
                    className="w-full border-worksheet-purple text-worksheet-purple hover:bg-worksheet-purple/5"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Link expires in 7 days • Student will verify email to access
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWorksheetModal;
