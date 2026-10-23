import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  FileText,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  FileQuestion,
  Eye,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { getAssetUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface FacultyFilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName?: string;
  fileCategory?: string;
}

// Global authenticated download helper
export const downloadFileAuthenticated = async (url: string, fileName?: string) => {
  if (!url) return;
  const fullUrl = getAssetUrl(url);
  const toastId = toast.loading('Preparing download...');
  try {
    const res = await api.get(fullUrl, { responseType: 'blob' });
    const rawBlob = res.data as Blob;

    // Detect filename from disposition header
    let finalName = fileName;
    const disposition = String(res.headers['content-disposition'] || '');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) finalName = match[1].trim();
    }
    if (!finalName) {
      finalName = url.split('/').pop()?.split('?')[0] || 'faculty-document';
    }

    // Detect MIME type and create download blob
    let contentType = String(res.headers['content-type'] || rawBlob.type || 'application/octet-stream');
    if (finalName.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    }

    const blob = new Blob([rawBlob], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    toast.success('Download started', { id: toastId });
  } catch (err: any) {
    console.error('Download error:', err);
    let msg = 'Failed to download file. Please check permissions.';
    if (err.response?.status === 401) msg = 'Session expired. Please log in again.';
    else if (err.response?.status === 403) msg = 'Access denied. You do not have permission to download this document.';
    else if (err.response?.status === 404) msg = 'File not found on storage server.';
    toast.error(msg, { id: toastId });
  }
};

// Global authenticated print helper
export const printFileAuthenticated = async (url: string, fileName?: string) => {
  if (!url) return;
  const fullUrl = getAssetUrl(url);
  const toastId = toast.loading('Preparing document for print...');
  try {
    const res = await api.get(fullUrl, { responseType: 'blob' });
    const rawBlob = res.data as Blob;
    let contentType = String(res.headers['content-type'] || rawBlob.type || '');

    // Check magic bytes or extension
    const effectiveName = fileName || url.split('/').pop()?.split('?')[0] || 'document';
    let isPdf = contentType.includes('pdf') || effectiveName.toLowerCase().endsWith('.pdf');
    let isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(effectiveName);

    try {
      const headerSlice = await rawBlob.slice(0, 5).arrayBuffer();
      const headerText = new TextDecoder('ascii').decode(headerSlice);
      if (headerText.startsWith('%PDF')) {
        isPdf = true;
        isImage = false;
        contentType = 'application/pdf';
      }
    } catch (e) {
      // Fallback to extension check
    }

    const blob = new Blob([rawBlob], { type: isPdf ? 'application/pdf' : contentType || 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(blob);

    if (isPdf) {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.src = blobUrl;

      document.body.appendChild(printIframe);
      printIframe.onload = () => {
        try {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print failed, opening in new tab for print', e);
          const w = window.open(blobUrl, '_blank');
          w?.print();
        }
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      };
      toast.dismiss(toastId);
    } else if (isImage) {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';

      document.body.appendChild(printIframe);
      const frameDoc = printIframe.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${effectiveName}</title>
              <style>
                @page { margin: 10mm; }
                body {
                  margin: 0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 90vh;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .meta {
                  font-size: 11px;
                  color: #64748b;
                  margin-bottom: 12px;
                  text-align: center;
                  font-weight: 500;
                }
                img {
                  max-width: 100%;
                  max-height: 85vh;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              <div class="meta">${effectiveName} &bull; ACADRO Faculty Profile Evidence</div>
              <img src="${blobUrl}" onload="window.focus(); window.print();" />
            </body>
          </html>
        `);
        frameDoc.close();
      }
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
        URL.revokeObjectURL(blobUrl);
      }, 60000);
      toast.dismiss(toastId);
    } else {
      toast.error('Direct print is only supported for PDF and image files. Please download the file to print.', { id: toastId });
      URL.revokeObjectURL(blobUrl);
    }
  } catch (err: any) {
    console.error('Print error:', err);
    toast.error('Failed to prepare document for printing.', { id: toastId });
  }
};

export const FacultyFilePreviewModal: React.FC<FacultyFilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileCategory
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [isImage, setIsImage] = useState<boolean>(false);
  const [fileSize, setFileSize] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Zoom & Rotation state for images
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const activeBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !fileUrl) {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
      setBlobUrl(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setZoom(1);
    setRotation(0);

    const loadFile = async () => {
      try {
        const fullUrl = getAssetUrl(fileUrl);
        const res = await api.get(fullUrl, { responseType: 'blob' });
        if (!isMounted) return;

        const rawBlob = res.data as Blob;
        let contentType = String(res.headers['content-type'] || rawBlob.type || '');
        const sizeBytes = rawBlob.size;
        const sizeFormatted = sizeBytes > 1024 * 1024 
          ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;

        // Accurately detect file type via magic bytes
        const effectiveName = fileName || fileUrl.split('/').pop()?.split('?')[0] || 'document';
        let detectedIsPdf = contentType.includes('pdf') || effectiveName.toLowerCase().endsWith('.pdf');
        let detectedIsImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(effectiveName);

        try {
          const headerSlice = await rawBlob.slice(0, 8).arrayBuffer();
          const headerText = new TextDecoder('ascii').decode(headerSlice);
          const bytes = new Uint8Array(headerSlice);

          if (headerText.startsWith('%PDF')) {
            detectedIsPdf = true;
            detectedIsImage = false;
            contentType = 'application/pdf';
          } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            detectedIsImage = true;
            detectedIsPdf = false;
            contentType = 'image/png';
          } else if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
            detectedIsImage = true;
            detectedIsPdf = false;
            contentType = 'image/jpeg';
          }
        } catch (e) {
          // Fall back to header/extension
        }

        // Recreate typed blob so browser native viewers handle it appropriately
        const finalType = detectedIsPdf ? 'application/pdf' : (contentType || 'application/octet-stream');
        const typedBlob = new Blob([rawBlob], { type: finalType });
        const newBlobUrl = URL.createObjectURL(typedBlob);
        activeBlobUrlRef.current = newBlobUrl;

        setIsPdf(detectedIsPdf);
        setIsImage(detectedIsImage);
        setFileSize(sizeFormatted);
        setBlobUrl(newBlobUrl);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('File load error:', err);

        let userFriendlyMsg = 'Failed to load document.';
        const status = err.response?.status;

        if (status === 401) {
          userFriendlyMsg = 'Your session has expired. Please log in again to view this document.';
        } else if (status === 403) {
          userFriendlyMsg = 'Access Denied. You do not have permission to view this document.';
        } else if (status === 404) {
          userFriendlyMsg = 'The requested document was not found on the institutional server.';
        } else if (status >= 500) {
          userFriendlyMsg = 'Server encountered an error while retrieving the document. Please try again later.';
        } else if (err.message && !err.response) {
          userFriendlyMsg = 'Network connection error. Could not reach server.';
        }

        // Try reading error text if response is a blob containing error JSON
        if (err.response?.data instanceof Blob) {
          try {
            const errText = await err.response.data.text();
            const parsed = JSON.parse(errText);
            if (parsed.message) userFriendlyMsg = parsed.message;
          } catch (e) {
            // Keep status-based message
          }
        }

        setError(userFriendlyMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFile();

    return () => {
      isMounted = false;
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, [isOpen, fileUrl]);

  const effectiveFileName = fileName || fileUrl.split('/').pop()?.split('?')[0] || 'Faculty Document';
  const isSupported = isPdf || isImage;

  const handleDownload = () => {
    downloadFileAuthenticated(fileUrl, effectiveFileName);
  };

  const handlePrint = () => {
    printFileAuthenticated(fileUrl, effectiveFileName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl w-[96vw] h-[90vh] p-0 flex flex-col bg-background border-border shadow-2xl overflow-hidden rounded-xl">
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-3 border-b border-border/80 bg-muted/40 gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              {isPdf ? <FileText className="w-5 h-5" /> : isImage ? <Eye className="w-5 h-5" /> : <FileQuestion className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-sm sm:text-base font-bold text-foreground truncate max-w-xs sm:max-w-md">
                  {effectiveFileName}
                </DialogTitle>
                {fileCategory && (
                  <Badge variant="outline" className="text-[10px] font-semibold bg-background border-primary/20 text-primary">
                    {fileCategory}
                  </Badge>
                )}
                {fileSize && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {fileSize}
                  </span>
                )}
              </div>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                In-app verified preview &bull; ACADRO Academic Dossier Evidence
              </DialogDescription>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
            {isImage && (
              <div className="flex items-center gap-1 mr-1 bg-muted/70 p-0.5 rounded-lg border border-border/60">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setZoom(z => Math.max(0.4, z - 0.25))}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[10px] font-mono px-1 select-none text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => { setZoom(1); setRotation(0); }}
                  title="Reset View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {isSupported && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 border-border/80 bg-background hover:bg-muted"
                onClick={handlePrint}
                title="Print Document"
              >
                <Printer className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="default"
              className="h-8 text-xs gap-1.5 shadow-sm bg-primary text-primary-foreground font-semibold"
              onClick={handleDownload}
              title="Download Original File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </Button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-muted/10 overflow-hidden flex items-center justify-center p-3 relative">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium">Fetching authenticated file content...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center max-w-md p-6 text-center bg-card rounded-xl border border-destructive/20 shadow-sm space-y-3">
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
              <h4 className="text-sm font-bold text-foreground">Document Unavailable</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
              <div className="pt-2 flex items-center gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Try Direct Download
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && !isSupported && (
            <div className="flex flex-col items-center justify-center max-w-md p-8 text-center bg-card rounded-xl border border-border shadow-sm">
              <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
                <FileQuestion className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-foreground">In-App Preview Not Supported</h4>
              <p className="text-xs text-muted-foreground mt-1.5 mb-5 leading-relaxed">
                Direct in-app rendering is available for <strong>PDF</strong> documents and <strong>JPG/PNG/WEBP</strong> images. Please download this file to inspect it in your local desktop application.
              </p>
              <Button size="sm" onClick={handleDownload} className="gap-2 text-xs font-semibold">
                <Download className="w-4 h-4" /> Download Original File
              </Button>
            </div>
          )}

          {!loading && !error && isPdf && blobUrl && (
            <div className="w-full h-full rounded-lg overflow-hidden border border-border/80 bg-card shadow-inner flex flex-col">
              <object
                data={`${blobUrl}#toolbar=1&navpanes=0`}
                type="application/pdf"
                className="w-full h-full flex-1 rounded-lg"
                aria-label={effectiveFileName}
              >
                <iframe
                  src={`${blobUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-full flex-1 border-0 rounded-lg"
                  title={effectiveFileName}
                >
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-card h-full space-y-3">
                    <FileText className="w-12 h-12 text-primary mx-auto" />
                    <h5 className="text-sm font-bold text-foreground">PDF Ready to View</h5>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Your browser does not support embedded PDF display. You can download or view it externally.
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open(blobUrl, '_blank')} className="gap-1.5 text-xs">
                        <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                      </Button>
                    </div>
                  </div>
                </iframe>
              </object>
            </div>
          )}

          {!loading && !error && isImage && blobUrl && (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={blobUrl}
                alt={effectiveFileName}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out'
                }}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
