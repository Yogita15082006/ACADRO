import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Edit, Save, Users, User, Briefcase, IndianRupee, Heart, Phone } from 'lucide-react';

interface FamilyDetailsProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => void;
}

export const FamilyDetails: React.FC<FamilyDetailsProps> = ({ data, readOnly, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fatherName: data.familyDetails?.fatherName || '',
    fatherMobile: data.familyDetails?.fatherMobile || '',
    fatherOccupation: data.familyDetails?.fatherOccupation || '',
    fatherDesignation: data.familyDetails?.fatherDesignation || '',
    fatherOrganization: data.familyDetails?.fatherOrganization || '',
    motherName: data.familyDetails?.motherName || '',
    motherMobile: data.familyDetails?.motherMobile || '',
    motherOccupation: data.familyDetails?.motherOccupation || '',
    motherDesignation: data.familyDetails?.motherDesignation || '',
    motherOrganization: data.familyDetails?.motherOrganization || '',
    familyStatus: data.familyDetails?.familyStatus || '',
    numberOfBrothers: data.familyDetails?.numberOfBrothers || '',
    numberOfSisters: data.familyDetails?.numberOfSisters || '',
    annualIncome: data.familyDetails?.annualIncome || '',
  });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const renderField = (label: string, value: string | number, icon?: React.ReactNode) => (
    <div className="flex flex-col space-y-1 min-w-0">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">{label}</span>
      <span className="font-medium text-foreground flex items-center gap-2 truncate" title={String(value || 'Not Provided')}>
        {icon}
        <span className="truncate">{value || 'Not Provided'}</span>
      </span>
    </div>
  );

  const renderInput = (label: string, field: keyof typeof formData, type = 'text') => (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={formData[field]}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
      />
    </div>
  );

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Family Details
          </CardTitle>
          <CardDescription>Father, Mother, and Family information.</CardDescription>
        </div>
        {!readOnly && (
          <Button
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="gap-2"
          >
            {isEditing ? (
              <><Save className="w-4 h-4" /> Save</>
            ) : (
              <><Edit className="w-4 h-4" /> Edit</>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-8">
            {/* Father Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Father Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderInput('Name', 'fatherName')}
                {renderInput('Mobile Number', 'fatherMobile', 'tel')}
                {renderInput('Occupation', 'fatherOccupation')}
                {renderInput('Designation', 'fatherDesignation')}
                {renderInput('Organization', 'fatherOrganization')}
              </div>
            </div>

            {/* Mother Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4" /> Mother Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderInput('Name', 'motherName')}
                {renderInput('Mobile Number', 'motherMobile', 'tel')}
                {renderInput('Occupation', 'motherOccupation')}
                {renderInput('Designation', 'motherDesignation')}
                {renderInput('Organization', 'motherOrganization')}
              </div>
            </div>

            {/* Family Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Family Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderInput('Family Status', 'familyStatus')}
                {renderInput('Number of Brothers', 'numberOfBrothers', 'number')}
                {renderInput('Number of Sisters', 'numberOfSisters', 'number')}
                {renderInput('Annual Family Income', 'annualIncome')}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Father Details View */}
              <div className="space-y-4 bg-muted/10 p-5 rounded-xl border border-border/50">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border/50 pb-2">
                  <User className="w-4 h-4" /> Father Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderField('Name', formData.fatherName)}
                  {renderField('Mobile Number', formData.fatherMobile, <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />)}
                  {renderField('Occupation', formData.fatherOccupation)}
                  {renderField('Designation', formData.fatherDesignation)}
                  <div className="sm:col-span-2">
                    {renderField('Organization', formData.fatherOrganization, <Briefcase className="w-3 h-3 text-muted-foreground flex-shrink-0" />)}
                  </div>
                </div>
              </div>

              {/* Mother Details View */}
              <div className="space-y-4 bg-muted/10 p-5 rounded-xl border border-border/50">
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border/50 pb-2">
                  <Heart className="w-4 h-4" /> Mother Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderField('Name', formData.motherName)}
                  {renderField('Mobile Number', formData.motherMobile, <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />)}
                  {renderField('Occupation', formData.motherOccupation)}
                  {renderField('Designation', formData.motherDesignation)}
                  <div className="sm:col-span-2">
                    {renderField('Organization', formData.motherOrganization, <Briefcase className="w-3 h-3 text-muted-foreground flex-shrink-0" />)}
                  </div>
                </div>
              </div>
            </div>

            {/* Family Information View */}
            <div className="space-y-4 bg-muted/10 p-5 rounded-xl border border-border/50">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-border/50 pb-2">
                <Users className="w-4 h-4" /> Family Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderField('Family Status', formData.familyStatus)}
                {renderField('Brothers', formData.numberOfBrothers)}
                {renderField('Sisters', formData.numberOfSisters)}
                {renderField('Annual Income', formData.annualIncome, <IndianRupee className="w-3 h-3 text-muted-foreground" />)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
