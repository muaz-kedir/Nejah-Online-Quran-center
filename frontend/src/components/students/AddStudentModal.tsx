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
      <DialogContent aria-describedby={undefined} className="sm:max-w-[640px] dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold dark:text-gray-100">Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="dark:text-gray-300">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  placeholder="e.g. Omar Al-Fayid"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="dark:text-gray-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  placeholder="student@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label className="dark:text-gray-300">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age" className="dark:text-gray-300">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min={3}
                  max={80}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  required
                  className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div className="grid gap-2">
                <Label className="dark:text-gray-300">Level *</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                  <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600"><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
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
              <Label htmlFor="residency" className="dark:text-gray-300">Current Residency</Label>
              <Input
                id="residency"
                value={formData.currentResidency}
                onChange={(e) => setFormData({ ...formData, currentResidency: e.target.value })}
                className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                placeholder="e.g. Addis Ababa, Ethiopia"
              />
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Assign Teacher</Label>
              <Select value={formData.teacherId} onValueChange={(v) => setFormData({ ...formData, teacherId: v })}>
                <SelectTrigger className="dark:bg-gray-900 dark:border-gray-600"><SelectValue placeholder="Select teacher..." /></SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  {teachers?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.fullName || t.user?.name || 'Unknown'} {t.specialization ? `— ${t.specialization}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Account Credentials (Optional)</p>
              <p className="text-xs text-gray-400 mb-3">Set a password so the student can log in using their email, family email, or family phone number.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="dark:text-gray-300">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-gray-300">Learning Goals</Label>
              <Textarea
                value={formData.learningGoals}
                onChange={(e) => setFormData({ ...formData, learningGoals: e.target.value })}
                className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                placeholder="e.g. Memorize Juz 30, improve Tajweed..."
                rows={2}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Family Information (Optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="familyName" className="dark:text-gray-300">Parent/Guardian Name</Label>
                  <Input
                    id="familyName"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g. Ahmed Al-Fayid"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="familyPhone" className="dark:text-gray-300">Phone Number</Label>
                  <Input
                    id="familyPhone"
                    value={formData.familyPhone}
                    onChange={(e) => setFormData({ ...formData, familyPhone: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g. +251 912 345 678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="familyAddress" className="dark:text-gray-300">Address</Label>
                  <Input
                    id="familyAddress"
                    value={formData.familyAddress}
                    onChange={(e) => setFormData({ ...formData, familyAddress: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g. 123 Main St"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="familyCountry" className="dark:text-gray-300">Country</Label>
                  <Input
                    id="familyCountry"
                    value={formData.familyCountry}
                    onChange={(e) => setFormData({ ...formData, familyCountry: e.target.value })}
                    className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g. Ethiopia"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
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
                  className="rounded text-emerald-600 focus:ring-emerald-500 dark:bg-gray-900 dark:border-gray-600"
                />
                <Label htmlFor="useExistingParent" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
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
                      className="flex-1 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                      disabled={searchingParent}
                    />
                    <Button
                      type="button"
                      onClick={searchParent}
                      disabled={searchingParent}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      {searchingParent ? 'Searching...' : <Search className="w-4 h-4" />}
                    </Button>
                  </div>

                  {parentResults.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Parent Name</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Email</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Phone</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Children</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-300">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {parentResults.map((parent) => (
                            <tr key={parent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{parent.fullName}</td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{parent.email}</td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{parent.phoneNumber}</td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                {parent.students.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs">
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
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
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
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            Selected: {selectedParent.fullName}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Uncheck to create a new parent account for this student.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {loading ? 'Creating...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
