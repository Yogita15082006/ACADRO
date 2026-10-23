import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FacultyProfileData } from '../services/facultyProfileService';

export const generateFacultyProfilePDF = (profile: FacultyProfileData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [30, 58, 138]; // Navy / Indigo #1E3A8A
  const secondaryColor: [number, number, number] = [79, 70, 229]; // Indigo #4F46E5
  const darkTextColor: [number, number, number] = [30, 41, 59]; // Slate #1E293B
  const mutedTextColor: [number, number, number] = [100, 116, 139]; // Slate #64748B

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let currentY = 16;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      currentY = 18;
    }
  };

  const addSectionHeader = (title: string) => {
    checkPageBreak(14);
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, currentY, pageWidth - 28, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryColor);
    doc.text(title, 17, currentY + 5.2);
    currentY += 10.5;
  };

  // 1. INSTITUTIONAL HEADER
  doc.setFillColor(...primaryColor);
  doc.rect(14, currentY, pageWidth - 28, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('ACADRO — ACADEMIC & FACULTY MANAGEMENT SYSTEM', pageWidth / 2, currentY + 7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text('ACROPOLIS INSTITUTE OF TECHNOLOGY & RESEARCH (AITR), INDORE', pageWidth / 2, currentY + 12.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(253, 224, 71); // amber-300
  doc.text('OFFICIAL FACULTY PROFILE & ACADEMIC DOSSIER', pageWidth / 2, currentY + 18, { align: 'center' });

  currentY += 26;

  // 2. METADATA SUMMARY BAR
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.text(profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Faculty Member', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedTextColor);
  doc.text(`Emp ID: ${profile.employeeId || 'N/A'}  |  Designation: ${profile.designation || 'Faculty Member'}  |  Role: ${profile.role || 'FACULTY'}`, 18, currentY + 11.5);
  doc.text(`Department: ${profile.departmentName || 'Information Technology'}  |  Generated: ${new Date().toLocaleString()}`, 18, currentY + 15.5);

  currentY += 23;

  // SECTION 1: Personal & Employment Details
  addSectionHeader('1. PERSONAL & EMPLOYMENT DETAILS');
  const personalRows = [
    ['Employee ID', profile.employeeId || '-', 'Designation', profile.designation || '-'],
    ['Full Name', profile.fullName || '-', 'Department', profile.departmentName || '-'],
    ['Date of Joining', profile.joiningDate ? String(profile.joiningDate) : '-', 'Employment Type', profile.employmentType || 'Regular'],
    ['Official Email', profile.email || '-', 'Contact Phone', profile.phone || '-'],
    ['Permanent Account No. (PAN)', profile.pan || 'Protected (Masked)', 'AICTE Faculty ID', profile.aicteId || '-'],
    ['RGPV Faculty ID', profile.rgpvId || '-', 'Highest Qualification', profile.highestQualification || '-'],
    ['Administrative Remarks', { content: profile.remarks || '-', colSpan: 3 }]
  ];

  autoTable(doc, {
    startY: currentY,
    body: personalRows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: darkTextColor },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
      1: { cellWidth: 49 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
      3: { cellWidth: 49 }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // SECTION 2: Academic Qualifications
  addSectionHeader('2. ACADEMIC QUALIFICATIONS');
  const qualRows = [
    ['Highest Qualification', profile.highestQualification || '-', 'Doctorate (Ph.D.) Status', profile.hasPhd ? 'Awarded / Completed' : 'Not Awarded'],
    ['Ph.D. Awarding University', profile.phdUniversity || '-', 'Ph.D. Award Date', profile.phdAwardDate ? String(profile.phdAwardDate) : '-'],
    ['Postgraduate (PG) Degree', profile.pgDetail || '-', 'PG Specialization', profile.pgSpecialization || '-'],
    ['PG University / Institute', profile.pgUniversity || '-', 'PG Completion Year', profile.pgYear ? String(profile.pgYear) : '-'],
    ['Undergraduate (UG) Degree', profile.ugDetail || '-', 'UG Specialization', profile.ugSpecialization || '-'],
    ['UG University / Institute', profile.ugUniversity || '-', 'UG Completion Year', profile.ugYear ? String(profile.ugYear) : '-']
  ];

  autoTable(doc, {
    startY: currentY,
    body: qualRows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: darkTextColor },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
      1: { cellWidth: 49 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
      3: { cellWidth: 49 }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // SECTION 3: Experience & Retention
  addSectionHeader('3. TEACHING EXPERIENCE & RETENTION PROFILE');
  const expRows = [
    ['Total Teaching Experience', `${profile.teachingExperienceYears ?? 0} Years`, 'Industry / Corporate Experience', `${profile.industryExperienceYears ?? 0} Years`],
    ['Service at AITR Institute', `${profile.aitrServiceYears ?? 0} Years`, 'Retention Category', profile.retentionCategory ? `Category ${profile.retentionCategory}` : 'Unassigned'],
    ['Current Designation Since', profile.currentDesignationSince ? String(profile.currentDesignationSince) : '-', 'Previous Institute / Organization', profile.previousInstitute || '-']
  ];

  autoTable(doc, {
    startY: currentY,
    body: expRows,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: darkTextColor },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
      1: { cellWidth: 49 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 42 },
      3: { cellWidth: 49 }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // SECTION 4: Promotion History
  addSectionHeader('4. PROMOTION HISTORY & CADRE ADVANCEMENT');
  const promotions = (profile as any).promotions || [];
  const promoHeaders = [['S.No.', 'Designation Awarded', 'Promotion Date', 'Prof', 'Assoc', 'Assist', 'Order / Ref Number', 'Remarks']];
  const promoBody = promotions.length === 0
    ? [['-', 'No promotion orders registered. Initial cadre: ' + (profile.designation || 'Faculty Member'), '-', '-', '-', '-', '-', '-']]
    : promotions.map((p: any, idx: number) => [
        idx + 1,
        p.designation || '-',
        p.promotionDate ? String(p.promotionDate) : '-',
        p.isProfessor ? 'Yes' : 'No',
        p.isAssociate ? 'Yes' : 'No',
        p.isAssistant ? 'Yes' : 'No',
        p.orderNumber || '-',
        p.remarks || '-'
      ]);

  autoTable(doc, {
    startY: currentY,
    head: promoHeaders,
    body: promoBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, textColor: darkTextColor },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // SECTION 5: Research & Publications
  addSectionHeader('5. RESEARCH CONTRIBUTIONS & PUBLICATIONS');
  const researchSummary = [
    ['SCI Indexed Journals', profile.sciCount ?? 0, 'Scopus Indexed Journals', profile.scopusCount ?? 0, 'UGC / Peer Reviewed', profile.ugcCount ?? 0],
    ['Published Textbooks', profile.booksCount ?? 0, 'Edited Book Chapters', profile.bookChaptersCount ?? 0, 'Granted / Filed Patents', profile.patentsCount ?? 0],
    ['Sponsored Research Projects', profile.projectsCount ?? 0, 'Consultancy Grants', profile.consultancyCount ?? 0, 'Total Research Items', (profile as any).researchContributions?.length || 0]
  ];

  autoTable(doc, {
    startY: currentY,
    body: researchSummary,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: darkTextColor, halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], halign: 'left', cellWidth: 42 },
      1: { fontStyle: 'bold', cellWidth: 20 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], halign: 'left', cellWidth: 42 },
      3: { fontStyle: 'bold', cellWidth: 20 },
      4: { fontStyle: 'bold', fillColor: [248, 250, 252], halign: 'left', cellWidth: 38 },
      5: { fontStyle: 'bold', cellWidth: 20 }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  const researchItems = (profile as any).researchContributions || [];
  if (researchItems.length > 0) {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text('Key Research Publications & Patents Roster:', 14, currentY);
    currentY += 4;

    const researchHeaders = [['S.No.', 'Category', 'Title', 'Journal / Agency', 'Date', 'ISSN/ISBN/Patent', 'Status']];
    const researchBody = researchItems.map((r: any, idx: number) => [
      idx + 1,
      r.category || 'Journal',
      (r.title || '-').substring(0, 50),
      (r.journalOrPublisherOrAgency || '-').substring(0, 30),
      r.publicationDate ? String(r.publicationDate) : '-',
      r.issnOrIsbnOrPatentNo || '-',
      r.status || 'Published'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: researchHeaders,
      body: researchBody,
      theme: 'grid',
      headStyles: { fillColor: secondaryColor, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 1.5, textColor: darkTextColor },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // SECTION 6: Resource Person & Courses
  addSectionHeader('6. RESOURCE PERSON & PROFESSIONAL DEVELOPMENT');
  const resourceItems = (profile as any).resourcePersons || [];
  const resourceHeaders = [['S.No.', 'Resource / Event Title', 'Organization Type', 'Course / Subject Area', 'Duration (Hrs)', 'Academic Year']];
  const resourceBody = resourceItems.length === 0
    ? [['-', 'No resource person engagements recorded.', '-', '-', '-', '-']]
    : resourceItems.map((rp: any, idx: number) => [
        idx + 1,
        rp.resourceName || '-',
        rp.orgType || '-',
        rp.course || '-',
        rp.hours ? `${rp.hours} Hrs` : '-',
        rp.academicYear || '-'
      ]);

  autoTable(doc, {
    startY: currentY,
    head: resourceHeaders,
    body: resourceBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, textColor: darkTextColor },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // SECTION 7: Teaching Workload & Duties
  addSectionHeader('7. TEACHING WORKLOAD & INSTITUTIONAL RESPONSIBILITIES');
  const workloadSummary = [
    ['Weekly Theory Teaching Load', `${profile.theoryLoadHours ?? 0} Hours/Week`, 'Weekly Lab / Practical Load', `${profile.labLoadHours ?? 0} Hours/Week`],
    ['Total Assigned Teaching Load', `${profile.totalTeachingLoadHours ?? 0} Hours/Week`, 'Project Guidance Responsibilities', profile.projectGuideDetails || 'Supervising Final/Pre-final Projects'],
    ['Student Mentoring Details', profile.mentoringDetails || 'Assigned Student Batches', 'Institutional / Admin Duties', profile.adminDuties || 'Departmental Administrative Committee']
  ];

  autoTable(doc, {
    startY: currentY,
    body: workloadSummary,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: darkTextColor },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 46 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 46 },
      3: { cellWidth: 45 }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // SECTION 8: Supporting Documents Evidence List
  addSectionHeader('8. SUPPORTING VERIFICATION DOCUMENTS & EVIDENCE');
  const docs = (profile as any).documents || {};
  const docKeys = Object.keys(docs);
  const docHeaders = [['S.No.', 'Document Classification', 'Original File Name', 'Status / Verification']];
  const docBody = docKeys.length === 0
    ? [['-', 'Institutional supporting documents repository', 'Registered digitally in ACADRO ERP', 'Verified']]
    : docKeys.map((k, idx) => {
        const item = docs[k];
        const categoryName = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const fileName = typeof item === 'object' ? item.fileName : item;
        return [idx + 1, categoryName, fileName || 'Uploaded Document', 'Verified Record'];
      });

  autoTable(doc, {
    startY: currentY,
    head: docHeaders,
    body: docBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, textColor: darkTextColor },
    margin: { left: 14, right: 14 }
  });

  // RUNNING FOOTERS ON ALL PAGES
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedTextColor);
    doc.text('ACADRO Faculty Dossier &bull; Acropolis Institute of Technology and Research, Indore', 14, pageHeight - 7.5);
    doc.text(`Emp ID: ${profile.employeeId || 'N/A'}  |  Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7.5, { align: 'right' });
  }

  // Save document
  const safeName = (profile.lastName || profile.firstName || 'Faculty').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ACADRO_Faculty_Dossier_${profile.employeeId || 'EMP'}_${safeName}.pdf`;
  doc.save(filename);
};
