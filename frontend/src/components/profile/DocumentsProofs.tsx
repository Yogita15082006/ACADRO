import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Upload, Eye, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { getAssetUrl } from '@/lib/utils';

interface DocumentsProofsProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => any;
}

export const DocumentsProofs: React.FC<DocumentsProofsProps> = ({ data, readOnly, onUpdate }) => {
  const [documents, setDocuments] = useState<any>(data.documents || {
    aadhar: null,
    pan: null,
    tenthMarksheet: null,
    twelfthMarksheet: null,
  });

  useEffect(() => {
    if (data.documents) {
      setDocuments(data.documents);
    }
  }, [data]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocType, setActiveDocType] = useState<string | null>(null);

  const handleUploadClick = (docType: string) => {
    setActiveDocType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeDocType) {
      const file = e.target.files[0];
      const tempUrl = URL.createObjectURL(file);
      
      const newDocs = {
        ...documents,
        [activeDocType]: {
          name: file.name,
          url: tempUrl,
          type: file.type
        }
      };
      setDocuments(newDocs);

      const formData = new FormData();
      formData.append('file', file);
      
      try {
        // Now using the proper endpoint for documents so we don't overwrite the profile photo
        const response = await api.post('/v1/profile/document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data?.data?.url) {
          const finalDocs = {
            ...documents,
            [activeDocType]: {
              name: file.name,
              url: response.data.data.url,
              type: file.type
            }
          };
          setDocuments(finalDocs);
          const success = await onUpdate({ documents: finalDocs });
          if (success !== false) {
            toast.success(`${file.name} uploaded successfully.`);
          } else {
            setDocuments(documents); // rollback on failure
          }
        }
      } catch (err) {
        console.error("Failed to upload document", err);
        toast.error(`Failed to upload ${file.name}`);
        setDocuments(documents); // rollback on failure
      }
    }
    setActiveDocType(null);
  };

  const handleDelete = async (docType: string) => {
    const newDocs = { ...documents, [docType]: null };
    setDocuments(newDocs);
    const success = await onUpdate({ documents: newDocs });
    if (success === false) {
       setDocuments(documents); // rollback
    }

    toast.success(`Document removed.`);
  };

  const renderDocumentItem = (docType: string, label: string) => {
    const doc = documents[docType];
    
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/10 transition-colors hover:bg-muted/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${doc ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{label}</p>
            <p className="text-xs text-muted-foreground truncate">{doc ? doc.name : 'Not Uploaded'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {doc ? (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(getAssetUrl(doc.url), '_blank')}>
                <Eye className="w-4 h-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const link = document.createElement('a');
                link.href = getAssetUrl(doc.url);
                link.download = doc.name || 'document';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}>
                <Download className="w-4 h-4 text-primary" />
              </Button>
              {!readOnly && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(docType)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </>
          ) : (
            !readOnly && (
              <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => handleUploadClick(docType)}>
                <Upload className="w-3 h-3" /> Upload
              </Button>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40">
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Documents & ID Proofs
        </CardTitle>
        <CardDescription>Upload and manage necessary documents.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,application/pdf" 
          onChange={handleFileChange} 
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderDocumentItem('aadhar', 'Aadhar Card')}
          {renderDocumentItem('pan', 'PAN Card')}
          {renderDocumentItem('tenthMarksheet', '10th Marksheet')}
          {renderDocumentItem('twelfthMarksheet', '12th/Diploma Marksheet')}
        </div>
      </CardContent>
    </Card>
  );
};
