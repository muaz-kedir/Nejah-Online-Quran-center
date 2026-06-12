import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, User, Phone, Mail, Users, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Teacher {
  id: string;
  fullName?: string;
  user?: { name: string };
  specialization?: string;
}

interface Parent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  students: { id: string; fullName: string }[];
}

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teachers: Teacher[];
}

export function AddStudentModal({ open, onClose, onSuccess, teachers }: AddStudentModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchingParent, setSearchingParent] = useState(false);
  const [parentResults, setParentResults] = useState<Parent[]>([]);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [useExistingParent, setUseExistingParent] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    age: '',
    currentResidency: '',
    level: 'Quran Reading',
    email: '',
    teacherId: '',
    familyName: '',
    familyPhone: '',
    familyAddress: '',
    familyCountry: '',
    learningGoals: '',
    password: '',
    confirmPassword: '',
    parentId: '',
  });

  // Search for existing parent
  const searchParent = async () => {
    setSearchingParent(true);
    try {
      const token = localStorage.getItem('token');
      const searchQuery = formData.familyName || formData.familyPhone || '';
      const url = `http://localhost:3000/api/parents/search?search=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setParentResults(data || []);
      }
    } catch (error) {
      console.error('Failed to search parents', error);
    } finally {
      setSearchingParent(false);
    }
  };

  const handleSelectParent = (parent: Parent) => {
    setSelectedParent(parent);
    setUseExistingParent(true);
    setParentResults([]);
  };

  const clearParentSelection = () => {
    setSelectedParent(null);
    setUseExistingParent(false);
    setParentResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Check if using existing parent
    if (useExistingParent && !selectedParent) {
      toast.error('Please select an existing parent');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const age = parseInt(formData.age, 10);
      
      // Calculate ageRange based on age
      let ageRange: 'Under 18' | '18 - 25' | 'Above 25' = 'Under 18';
      if (age >= 18 && age <= 25) {
        ageRange = '18 - 25';
      } else if (age > 25) {
        ageRange = 'Above 25';
      }

      const body: any = {
        ...formData,
        ageRange,
      };
      delete body.confirmPassword;
      delete body.age;
      if (!body.password) delete body.password;
      if (!body.teacherId) delete body.teacherId;
      if (!body.familyName) delete body.familyName;
      if (!body.familyPhone) delete body.familyPhone;
      if (!body.familyAddress) delete body.familyAddress;
      if (!body.familyCountry) delete body.familyCountry;
      if (!body.learningGoals) delete body.learningGoals;
      
      // If using existing parent, use parentId instead of family info
      if (useExistingParent && selectedParent) {
        body.parentId = selectedParent.id;
      }

      const response = await fetch('http://localhost:3000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create student');
      }

      toast.success('Student created successfully');
      onSuccess();
      onClose();
      setFormData({
        fullName: '',
        gender: 'Male',
        age: '',
        currentResidency: '',
        level: 'Quran Reading',
        email: '',
        teacherId: '',
        familyName: '',
        familyPhone: '',
        familyAddress: '',
        familyCountry: '',
        learningGoals: '',
        password: '',
        confirmPassword: '',
        parentId: '',
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[640px] dark:bg-nejah-surface dark:border-nejah-border-blue">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="dark:text-muted-foreground">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                  placeholder="e.g. Omar Al-Fayid"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="dark:text-muted-foreground">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                  placeholder="student@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="dark:text-muted-foreground">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age" className="dark:text-muted-foreground">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min={3}
                  max={80}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label className="dark:text-muted-foreground">Level *</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                  <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                    <SelectItem value="Qaida Nooraniya">Qaida Nooraniya</SelectItem>
                    <SelectItem value="Quran Reading">Quran Reading</SelectItem>
                    <SelectItem value="Tajweed Program">Tajweed Program</SelectItem>
                    <SelectItem value="Hifz Program">Hifz Program</SelectItem>
                    <SelectItem value="Hifz Muraja'a">Hifz Muraja&apos;a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="residency" className="dark:text-muted-foreground">Current Residency</Label>
              <Input
                id="residency"
                value={formData.currentResidency}
                onChange={(e) => setFormData({ ...formData, currentResidency: e.target.value })}
                className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                placeholder="e.g. Addis Ababa, Ethiopia"
              />
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-muted-foreground">Assign Teacher</Label>
              <Select value={formData.teacherId} onValueChange={(v) => setFormData({ ...formData, teacherId: v })}>
                <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue"><SelectValue placeholder="Select teacher..." /></SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.fullName || t.user?.name || 'Unknown'} {t.specialization ? `— ${t.specialization}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-border dark:border-nejah-border-blue pt-4">
              <p className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground mb-3">Account Credentials (Optional)</p>
              <p className="text-xs text-muted-foreground mb-3">Set a password so the student can log in using their email, family email, or family phone number.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password" className="dark:text-muted-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="dark:text-muted-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-muted-foreground">Learning Goals</Label>
              <Textarea
                value={formData.learningGoals}
                onChange={(e) => setFormData({ ...formData, learningGoals: e.target.value })}
                className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                placeholder="e.g. Memorize Juz 30, improve Tajweed..."
                rows={2}
              />
            </div>

            <div className="border-t border-border dark:border-nejah-border-blue pt-4">
              <p className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground mb-3">Family Information (Optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="familyName" className="dark:text-muted-foreground">Parent/Guardian Name</Label>
                  <Input
                    id="familyName"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                    placeholder="e.g. Ahmed Al-Fayid"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="familyPhone" className="dark:text-muted-foreground">Phone Number</Label>
                  <Input
                    id="familyPhone"
                    value={formData.familyPhone}
                    onChange={(e) => setFormData({ ...formData, familyPhone: e.target.value })}
                    className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                    placeholder="e.g. +251 912 345 678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="familyAddress" className="dark:text-muted-foreground">Address</Label>
                  <Input
                    id="familyAddress"
                    value={formData.familyAddress}
                    onChange={(e) => setFormData({ ...formData, familyAddress: e.target.value })}
                    className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                    placeholder="e.g. 123 Main St"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="familyCountry" className="dark:text-muted-foreground">Country</Label>
                  <Input
                    id="familyCountry"
                    value={formData.familyCountry}
                    onChange={(e) => setFormData({ ...formData, familyCountry: e.target.value })}
                    className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                    placeholder="e.g. Ethiopia"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border dark:border-nejah-border-blue pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  id="useExistingParent"
                  type="checkbox"
                  checked={useExistingParent}
                  onChange={(e) => {
                    if (e.target.checked) {
                      searchParent();
                    } else {
                      clearParentSelection();
                    }
                  }}
                  className="rounded text-primary focus:ring-primary/500 dark:bg-nejah-surface dark:border-nejah-border-blue"
                />
                <Label htmlFor="useExistingParent" className="text-sm font-semibold text-foreground dark:text-muted-foreground cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Link to Existing Parent Account
                  </div>
                </Label>
              </div>
              
              {useExistingParent && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      id="parentSearchName"
                      placeholder="Search by parent name or phone..."
                      value={formData.familyName || formData.familyPhone || ''}
                      onChange={(e) => setFormData({ ...formData, familyName: e.target.value, familyPhone: '' })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          searchParent();
                        }
                      }}
                      className="flex-1 dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                      disabled={searchingParent}
                    />
                    <Button
                      type="button"
                      onClick={searchParent}
                      disabled={searchingParent}
                      className="bg-primary hover:bg-nejah-azure text-white"
                    >
                      {searchingParent ? 'Searching...' : <Search className="w-4 h-4" />}
                    </Button>
                  </div>

                  {parentResults.length > 0 && (
                    <div className="border border-border dark:border-nejah-border-blue rounded-lg max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted dark:bg-nejah-surface sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground dark:text-muted-foreground">Parent Name</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground dark:text-muted-foreground">Email</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground dark:text-muted-foreground">Phone</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground dark:text-muted-foreground">Children</th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground dark:text-muted-foreground">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-nejah-border-blue">
                          {parentResults.map((parent) => (
                            <tr key={parent.id} className="hover:bg-muted dark:hover:bg-nejah-surface/50">
                              <td className="px-3 py-2 font-medium text-foreground text-foreground">{parent.fullName}</td>
                              <td className="px-3 py-2 text-muted-foreground dark:text-muted-foreground">{parent.email}</td>
                              <td className="px-3 py-2 text-muted-foreground dark:text-muted-foreground">{parent.phoneNumber}</td>
                              <td className="px-3 py-2 text-muted-foreground dark:text-muted-foreground">
                                {parent.students.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 bg-primary/10 dark:bg-primary/10 text-primary text-nejah-electric px-2 py-0.5 rounded-full text-xs">
                                    <Users className="w-3 h-3" />
                                    {parent.students.length}
                                  </span>
                                ) : (
                                  'No children'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectParent(parent)}
                                  className="text-primary hover:text-primary hover:bg-primary/10 text-nejah-electric dark:hover:bg-primary/30"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedParent && (
                    <div className="flex items-center justify-between bg-primary/10 dark:bg-primary/10/20 border border-primary/200 dark:border-primary/800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-primary text-nejah-electric" />
                        <div>
                          <p className="text-sm font-medium text-nejah-sapphire dark:text-nejah-electric">
                            Selected: {selectedParent.fullName}
                          </p>
                          <p className="text-xs text-primary text-nejah-electric">
                            {selectedParent.email} • {selectedParent.students.length} child(ren)
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearParentSelection}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!useExistingParent && (
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                  Uncheck to create a new parent account for this student.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="dark:border-nejah-border-blue dark:text-muted-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-nejah-azure text-white">
              {loading ? 'Creating...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
