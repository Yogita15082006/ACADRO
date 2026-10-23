import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Eye, Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FacultyFilePreviewModal,
  downloadFileAuthenticated,
  printFileAuthenticated
} from './FacultyFilePreviewModal';

interface FacultyFileActionsProps {
  url?: any;
  fileName?: string;
  category?: string;
  label?: string;
  showLabels?: boolean;
  className?: string;
  variant?: 'compact' | 'standard';
}

export const FacultyFileActions: React.FC<FacultyFileActionsProps> = ({
  url,
  fileName,
  category,
  label = 'Preview',
  showLabels = false,
  className,
  variant = 'compact'
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Extract actual string URL if an object was passed
  const rawUrl: string | null = typeof url === 'string'
    ? url
    : (url?.url || url?.documentUrl || url?.fileUrl || null);

  if (!rawUrl) return null;

  const effectiveFileName = fileName || 
    (typeof url === 'object' && url?.fileName ? url.fileName : null) || 
    rawUrl.split('/').pop()?.split('?')[0] || 
    'Document';

  return (
    <>
      <div className={cn('inline-flex items-center gap-1 flex-wrap shrink-0 max-w-full', className)}>
        {/* Preview Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-7 px-2 text-xs gap-1 border-border/80 text-primary hover:text-primary hover:bg-primary/5 transition-colors shrink-0 shadow-xs font-medium',
            variant === 'standard' && 'h-8 px-2.5'
          )}
          onClick={() => setModalOpen(true)}
          title={`Preview ${effectiveFileName}`}
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span>{label}</span>
        </Button>

        {/* Download Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors shrink-0',
            variant === 'standard' && 'h-8 w-8'
          )}
          onClick={() => downloadFileAuthenticated(rawUrl, effectiveFileName)}
          title={`Download ${effectiveFileName}`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          {showLabels && <span className="ml-1 text-xs">Download</span>}
        </Button>

        {/* Print Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors shrink-0',
            variant === 'standard' && 'h-8 w-8'
          )}
          onClick={() => printFileAuthenticated(rawUrl, effectiveFileName)}
          title={`Print ${effectiveFileName}`}
        >
          <Printer className="w-3.5 h-3.5 shrink-0" />
          {showLabels && <span className="ml-1 text-xs">Print</span>}
        </Button>
      </div>

      {modalOpen && (
        <FacultyFilePreviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          fileUrl={rawUrl}
          fileName={effectiveFileName}
          fileCategory={category}
        />
      )}
    </>
  );
};
