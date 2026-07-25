import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Edit, Save, MapPin, Home } from 'lucide-react';

interface AddressDetailsProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => void;
}

export const AddressDetails: React.FC<AddressDetailsProps> = ({ data, readOnly, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    localAddress: data.addressDetails?.localAddress || '',
    localCity: data.addressDetails?.localCity || '',
    localState: data.addressDetails?.localState || '',
    localPincode: data.addressDetails?.localPincode || '',
    permanentAddress: data.addressDetails?.permanentAddress || '',
    permanentCity: data.addressDetails?.permanentCity || '',
    permanentState: data.addressDetails?.permanentState || '',
    permanentPincode: data.addressDetails?.permanentPincode || '',
  });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const copyToPermanent = () => {
    setFormData({
      ...formData,
      permanentAddress: formData.localAddress,
      permanentCity: formData.localCity,
      permanentState: formData.localState,
      permanentPincode: formData.localPincode,
    });
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Address Details
          </CardTitle>
          <CardDescription>Manage your current and permanent address information.</CardDescription>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Local Address */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Current Address
              </h4>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Address</label>
                <Input value={formData.localAddress} onChange={(e) => setFormData({ ...formData, localAddress: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">City</label>
                  <Input value={formData.localCity} onChange={(e) => setFormData({ ...formData, localCity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">State</label>
                  <Input value={formData.localState} onChange={(e) => setFormData({ ...formData, localState: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Pincode</label>
                <Input value={formData.localPincode} onChange={(e) => setFormData({ ...formData, localPincode: e.target.value })} />
              </div>
            </div>

            {/* Permanent Address */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Home className="w-4 h-4" /> Permanent Address
                </h4>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" onChange={(e) => {
                    if(e.target.checked) copyToPermanent();
                  }} className="rounded border-input text-primary focus:ring-primary h-3 w-3" />
                  Same as Current
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Address</label>
                <Input value={formData.permanentAddress} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">City</label>
                  <Input value={formData.permanentCity} onChange={(e) => setFormData({ ...formData, permanentCity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">State</label>
                  <Input value={formData.permanentState} onChange={(e) => setFormData({ ...formData, permanentState: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Pincode</label>
                <Input value={formData.permanentPincode} onChange={(e) => setFormData({ ...formData, permanentPincode: e.target.value })} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/50">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" /> Current Address
              </h4>
              <p className="text-sm text-foreground font-medium">{formData.localAddress || 'Not Provided'}</p>
              <p className="text-sm text-muted-foreground">
                {formData.localCity}{formData.localCity && formData.localState ? ', ' : ''}{formData.localState} {formData.localPincode}
              </p>
            </div>
            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/50">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <Home className="w-4 h-4 text-primary" /> Permanent Address
              </h4>
              <p className="text-sm text-foreground font-medium">{formData.permanentAddress || 'Not Provided'}</p>
              <p className="text-sm text-muted-foreground">
                {formData.permanentCity}{formData.permanentCity && formData.permanentState ? ', ' : ''}{formData.permanentState} {formData.permanentPincode}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
