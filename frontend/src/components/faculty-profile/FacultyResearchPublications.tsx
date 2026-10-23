import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { BookOpen, Plus, ExternalLink, Trash2, Edit2, Save, X, Sparkles, FileText, Globe, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { facultyProfileService } from '../../services/facultyProfileService';
import { FacultyFileActions } from './FacultyFileActions';

interface FacultyResearchPublicationsProps {
  facultyId: string;
  data: any;
  researchItems: any[];
  readOnly: boolean;
  onSaveProfile: (updated: any) => Promise<boolean>;
  onRefresh: () => void;
}

export const FacultyResearchPublications: React.FC<FacultyResearchPublicationsProps> = ({
  facultyId,
  data,
  researchItems = [],
  readOnly,
  onSaveProfile,
  onRefresh
}) => {
  const [isEditingIds, setIsEditingIds] = useState(false);
  const [savingIds, setSavingIds] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Identifiers and Counts
  const [formCounts, setFormCounts] = useState({
    sciCount: data.sciCount ?? 0,
    scopusCount: data.scopusCount ?? 0,
    ugcCount: data.ugcCount ?? 0,
    booksCount: data.booksCount ?? 0,
    bookChaptersCount: data.bookChaptersCount ?? 0,
    patentsCount: data.patentsCount ?? 0,
    projectsCount: data.projectsCount ?? 0,
    consultancyCount: data.consultancyCount ?? 0,
    googleScholarId: data.googleScholarId || '',
    orcidId: data.orcidId || '',
    scopusId: data.scopusId || ''
  });

  useEffect(() => {
    setFormCounts({
      sciCount: data.sciCount ?? 0,
      scopusCount: data.scopusCount ?? 0,
      ugcCount: data.ugcCount ?? 0,
      booksCount: data.booksCount ?? 0,
      bookChaptersCount: data.bookChaptersCount ?? 0,
      patentsCount: data.patentsCount ?? 0,
      projectsCount: data.projectsCount ?? 0,
      consultancyCount: data.consultancyCount ?? 0,
      googleScholarId: data.googleScholarId || '',
      orcidId: data.orcidId || '',
      scopusId: data.scopusId || ''
    });
  }, [data]);

  // New Research Item Form
  const [newItem, setNewItem] = useState({
    category: 'SCI',
    title: '',
    journalOrPublisherOrAgency: '',
    publicationDate: new Date().getFullYear().toString(),
    issnOrIsbnOrPatentNo: '',
    url: '',
    documentUrl: '',
    amount: '',
    status: 'Published',
    remarks: ''
  });

  const handleSaveCountsAndIds = async () => {
    setSavingIds(true);
    try {
      const ok = await onSaveProfile(formCounts);
      if (ok) setIsEditingIds(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update research counts & identifiers');
    } finally {
      setSavingIds(false);
    }
  };

  const handleItemDocUpload = async (file: File) => {
    if (!file) return;
    setUploadingDoc(true);
    try {
      const url = await facultyProfileService.uploadDocument(file);
      setNewItem(p => ({ ...p, documentUrl: url }));
      toast.success('Evidence document uploaded successfully!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to upload evidence');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim()) {
      toast.error('Please enter the contribution title');
      return;
    }
    setSavingItem(true);
    try {
      await facultyProfileService.addResearch(facultyId, newItem);
      toast.success('Research contribution recorded successfully!');
      setModalOpen(false);
      setNewItem({
        category: 'SCI',
        title: '',
        journalOrPublisherOrAgency: '',
        publicationDate: new Date().getFullYear().toString(),
        issnOrIsbnOrPatentNo: '',
        url: '',
        documentUrl: '',
        amount: '',
        status: 'Published',
        remarks: ''
      });
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to add research contribution');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (contributionId: string) => {
    if (!confirm('Are you sure you want to remove this research contribution?')) return;
    try {
      await facultyProfileService.deleteResearch(facultyId, contributionId);
      toast.success('Research contribution removed');
      onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete entry');
    }
  };

  const countCards = [
    { key: 'sciCount', label: '2. SCI Indexed', count: formCounts.sciCount, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { key: 'scopusCount', label: '3. Scopus', count: formCounts.scopusCount, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    { key: 'ugcCount', label: '4. UGC Care', count: formCounts.ugcCount, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
    { key: 'booksCount', label: '5. Books Authored', count: formCounts.booksCount, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { key: 'bookChaptersCount', label: '6. Book Chapters', count: formCounts.bookChaptersCount, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
    { key: 'patentsCount', label: '7. Patents', count: formCounts.patentsCount, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { key: 'projectsCount', label: '8. Projects (Grants)', count: formCounts.projectsCount, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { key: 'consultancyCount', label: '9. Consultancy', count: formCounts.consultancyCount, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  ];

  const categories = [
    'SCI', 'SCOPUS', 'UGC', 'BOOK', 'BOOK_CHAPTER', 'PATENT', 'PROJECT', 'CONSULTANCY'
  ];

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden transition-all">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">5. Research, Publications & Academic Contributions</CardTitle>
          </div>
          <CardDescription>
            Indexed research papers, author citations, book chapters, granted patents, research projects, and consultancy.
          </CardDescription>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" /> Add Research Record
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        
        {/* Research Counts Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> Verified Contribution Counts
            </h4>
            {!readOnly && (
              isEditingIds ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingIds(false)} disabled={savingIds}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveCountsAndIds} disabled={savingIds}>
                    {savingIds ? 'Saving...' : 'Save Counts & IDs'}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditingIds(true)} className="gap-1 text-xs">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Counts & Links
                </Button>
              )
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {countCards.map(item => (
              <div key={item.key} className={`p-3 rounded-xl border ${item.color} flex flex-col items-center text-center justify-center`}>
                {isEditingIds ? (
                  <Input
                    type="number"
                    min="0"
                    value={(formCounts as any)[item.key]}
                    onChange={e => setFormCounts(p => ({ ...p, [item.key]: parseInt(e.target.value, 10) || 0 }))}
                    className="h-8 text-center font-bold text-base p-1 bg-background"
                  />
                ) : (
                  <span className="text-xl font-bold tracking-tight">{item.count}</span>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-wider mt-1 line-clamp-1">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Research Profile Identifiers */}
        <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-primary" /> Author Identifiers & Profile Links
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Google Scholar */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">10. Google Scholar URL / ID</Label>
              {isEditingIds ? (
                <Input
                  value={formCounts.googleScholarId}
                  onChange={e => setFormCounts(p => ({ ...p, googleScholarId: e.target.value }))}
                  placeholder="https://scholar.google.com/citations?user=..."
                  className="bg-background text-xs"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={formCounts.googleScholarId || 'Not linked'}
                    disabled
                    className="bg-muted/50 text-xs font-mono"
                  />
                  {formCounts.googleScholarId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-9"
                      onClick={() => window.open(formCounts.googleScholarId.startsWith('http') ? formCounts.googleScholarId : `https://scholar.google.com/citations?user=${formCounts.googleScholarId}`, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* ORCID */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">11. ORCID Identifier</Label>
              {isEditingIds ? (
                <Input
                  value={formCounts.orcidId}
                  onChange={e => setFormCounts(p => ({ ...p, orcidId: e.target.value }))}
                  placeholder="0000-0002-1825-0097"
                  className="bg-background text-xs font-mono"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={formCounts.orcidId || 'Not linked'}
                    disabled
                    className="bg-muted/50 text-xs font-mono"
                  />
                  {formCounts.orcidId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-9"
                      onClick={() => window.open(`https://orcid.org/${formCounts.orcidId}`, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Scopus ID */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">12. Scopus Author ID</Label>
              {isEditingIds ? (
                <Input
                  value={formCounts.scopusId}
                  onChange={e => setFormCounts(p => ({ ...p, scopusId: e.target.value }))}
                  placeholder="57200000000"
                  className="bg-background text-xs font-mono"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={formCounts.scopusId || 'Not linked'}
                    disabled
                    className="bg-muted/50 text-xs font-mono"
                  />
                  {formCounts.scopusId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 h-9"
                      onClick={() => window.open(`https://www.scopus.com/authid/detail.uri?authorId=${formCounts.scopusId}`, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Structured Contribution Records Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Detailed Publications, Books, Patents & Projects
            </h4>
            <span className="text-xs text-muted-foreground">
              Total {researchItems.length} records registered
            </span>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4">1. S.No.</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Journal / Publisher / Agency</th>
                    <th className="py-3 px-4">Year / Date</th>
                    <th className="py-3 px-4">ISSN / ISBN / Grant</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Evidence</th>
                    {!readOnly && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {researchItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-muted-foreground italic">
                        No detailed research contributions recorded yet. Click &quot;Add Research Record&quot; to add journal papers, patents, or projects.
                      </td>
                    </tr>
                  ) : (
                    researchItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs font-semibold uppercase">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-foreground max-w-sm line-clamp-2">{item.title}</p>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              DOI / Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                          {item.journalOrPublisherOrAgency || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {item.publicationDate || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {item.issnOrIsbnOrPatentNo || item.amount || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                            {item.status || 'Published'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.documentUrl ? (
                            <FacultyFileActions
                              url={item.documentUrl}
                              fileName={item.title ? `${item.title.substring(0, 30)}.pdf` : 'Research_Proof.pdf'}
                              category={item.category || 'Research Proof'}
                              label="Preview Proof"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </td>
                        {!readOnly && (
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </CardContent>

      {/* Add Research Item Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Add Research Contribution
            </DialogTitle>
            <DialogDescription>
              Record an indexed publication, book, patent, sponsored grant, or consultancy.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddItem} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">Category</Label>
                <select
                  value={newItem.category}
                  onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-semibold"
                  required
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">Status</Label>
                <select
                  value={newItem.status}
                  onChange={e => setNewItem(p => ({ ...p, status: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="Published">Published</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Granted">Granted</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">Title of Paper / Book / Patent / Project</Label>
              <Input
                value={newItem.title}
                onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Deep Learning Approaches in Cloud Resource Allocation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">Journal / Publisher / Funding Agency</Label>
              <Input
                value={newItem.journalOrPublisherOrAgency}
                onChange={e => setNewItem(p => ({ ...p, journalOrPublisherOrAgency: e.target.value }))}
                placeholder="e.g. IEEE Transactions on Cloud Computing / Springer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">Year / Date</Label>
                <Input
                  value={newItem.publicationDate}
                  onChange={e => setNewItem(p => ({ ...p, publicationDate: e.target.value }))}
                  placeholder="e.g. 2024"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase">ISSN / ISBN / Patent No / Amount</Label>
                <Input
                  value={newItem.issnOrIsbnOrPatentNo}
                  onChange={e => setNewItem(p => ({ ...p, issnOrIsbnOrPatentNo: e.target.value }))}
                  placeholder="e.g. 2168-7161 or ₹4,50,000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">DOI / Web Link</Label>
              <Input
                type="url"
                value={newItem.url}
                onChange={e => setNewItem(p => ({ ...p, url: e.target.value }))}
                placeholder="https://doi.org/10.1109/..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase">Supporting Document / Proof (PDF/JPG)</Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  if (e.target.files?.[0]) handleItemDocUpload(e.target.files[0]);
                }}
                disabled={uploadingDoc}
              />
              {newItem.documentUrl && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Evidence document attached
                </p>
              )}
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={savingItem || uploadingDoc}>
                {savingItem ? 'Saving...' : 'Add Contribution'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
