import { useState, useEffect } from 'react';
import { API_BASE, apiUrl } from "@/lib/api";
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
import { Search, Plus, User, Phone, Mail, Users, X, Check, Eye, EyeOff, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Teacher {
  id: string;
  fullName?: string;
  user?: { name: string };
  specialization?: string;
}

interface LearningGoal {
  id: string;
  name: string;
  description?: string;
}

interface Parent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  students: { id: string; fullName: string }[];
}

interface FeeInfo {
  amount: number;
  currency: string;
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
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [customGoalText, setCustomGoalText] = useState('');
  const [suggestedFee, setSuggestedFee] = useState<FeeInfo | null>(null);
  const [showCustomGoal, setShowCustomGoal] = useState(false);
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

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const togglePassword = (field: string) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(apiUrl(`/learning-goals`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setLearningGoals(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedGoalId && formData.familyCountry) {
      const token = localStorage.getItem('token');
      fetch(apiUrl(`/fee-config/lookup?goalId=${selectedGoalId}&country=${encodeURIComponent(formData.familyCountry)}`), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setSuggestedFee(data ? { amount: Number(data.amount), currency: data.currency } : null))
        .catch(() => setSuggestedFee(null));
    } else {
      setSuggestedFee(null);
    }
  }, [selectedGoalId, formData.familyCountry]);

  // Search for existing parent
  const searchParent = async () => {
    setSearchingParent(true);
    try {
      const token = localStorage.getItem('token');
      const query = parentSearchQuery.trim();
      if (!query) { setParentResults([]); return; }
      const url = apiUrl(`/parents/search?search=${encodeURIComponent(query)}`);
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

      const response = await fetch(apiUrl(`/students`), {
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
      setSelectedGoalId('');
      setCustomGoalText('');
      setShowCustomGoal(false);
      setSuggestedFee(null);
      setSelectedParent(null);
      setParentResults([]);
      setUseExistingParent(false);
      setParentSearchQuery('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto dark:bg-nejah-surface dark:border-nejah-border-blue">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Add New Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPasswords['password'] ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="pr-9 dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                    />
                    <button type="button" onClick={() => togglePassword('password')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {showPasswords['password'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="dark:text-muted-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords['confirmPassword'] ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="pr-9 dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                    />
                    <button type="button" onClick={() => togglePassword('confirmPassword')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {showPasswords['confirmPassword'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-muted-foreground">Learning Goals</Label>
              <Select
                value={selectedGoalId}
                onValueChange={(v) => {
                  setSelectedGoalId(v);
                  const goal = learningGoals.find(g => g.id === v);
                  if (goal?.name === 'Custom') {
                    setShowCustomGoal(true);
                    setFormData({ ...formData, learningGoals: '' });
                  } else {
                    setShowCustomGoal(false);
                    setFormData({ ...formData, learningGoals: goal?.name || '' });
                  }
                }}
              >
                <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                  <SelectValue placeholder="Select a learning goal..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                  {learningGoals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showCustomGoal && (
                <Textarea
                  value={customGoalText}
                  onChange={(e) => {
                    setCustomGoalText(e.target.value);
                    setFormData({ ...formData, learningGoals: e.target.value });
                  }}
                  className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground mt-2"
                  placeholder="Describe the custom learning goal..."
                  rows={2}
                />
              )}

              {suggestedFee && (
                <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
                  <DollarSign className="h-5 w-5 text-nejah-electric" />
                  <span className="text-sm font-medium text-foreground">
                    Suggested monthly fee: <strong>{suggestedFee.amount.toLocaleString()} {suggestedFee.currency}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-border dark:border-nejah-border-blue pt-4">
              <p className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground mb-3">Family Information (Optional)</p>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label className="dark:text-muted-foreground">Family Type</Label>
                  <Select
                    value={useExistingParent ? 'existing' : 'new'}
                    onValueChange={(v) => {
                      if (v === 'existing') {
                        setUseExistingParent(true);
                        setParentSearchQuery('');
                        setParentResults([]);
                        setSelectedParent(null);
                      } else {
                        clearParentSelection();
                      }
                    }}
                  >
                    <SelectTrigger className="dark:bg-nejah-surface dark:border-nejah-border-blue"><SelectValue /></SelectTrigger>
                    <SelectContent className="dark:bg-nejah-surface dark:border-nejah-border-blue">
                      <SelectItem value="new">Create New Family</SelectItem>
                      <SelectItem value="existing">Link Existing Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {useExistingParent ? (
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <Label className="dark:text-muted-foreground">Search Existing Parent</Label>
                      <Input
                        placeholder="Type parent name or phone..."
                        value={parentSearchQuery}
                        onChange={(e) => {
                          setParentSearchQuery(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            searchParent();
                          }
                        }}
                        className="dark:bg-nejah-surface dark:border-nejah-border-blue text-foreground"
                      />
                    </div>

                    {selectedParent ? (
                      <div className="flex items-center justify-between bg-primary/10 dark:bg-primary/10/20 border border-primary/200 dark:border-primary/800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-nejah-electric" />
                          <div>
                            <p className="text-sm font-medium text-nejah-sapphire dark:text-nejah-electric">
                              Selected: {selectedParent.fullName}
                            </p>
                            <p className="text-xs text-nejah-electric">
                              {selectedParent.email} &bull; {selectedParent.students.length} child(ren)
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={clearParentSelection} className="text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {parentSearchQuery && (
                          <Button type="button" onClick={searchParent} disabled={searchingParent} size="sm" className="w-full">
                            {searchingParent ? 'Searching...' : 'Search Parents'}
                          </Button>
                        )}

                        {parentResults.length > 0 && (
                          <div className="border border-border dark:border-nejah-border-blue rounded-lg max-h-48 overflow-y-auto">
                            {parentResults.map((parent) => (
                              <div
                                key={parent.id}
                                onClick={() => handleSelectParent(parent)}
                                className="flex items-center justify-between px-3 py-2.5 hover:bg-muted dark:hover:bg-nejah-surface/50 border-b border-border dark:border-nejah-border-blue last:border-0 cursor-pointer transition-colors"
                              >
                                <div>
                                  <p className="text-sm font-medium text-foreground">{parent.fullName}</p>
                                  <p className="text-xs text-muted-foreground">{parent.email} &bull; {parent.phoneNumber}</p>
                                </div>
                                <span className="inline-flex items-center gap-1 bg-primary/10 text-nejah-electric px-2 py-0.5 rounded-full text-xs">
                                  <Users className="w-3 h-3" />
                                  {parent.students.length}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {parentSearchQuery && parentResults.length === 0 && !searchingParent && (
                          <p className="text-xs text-muted-foreground">No parents found matching &ldquo;{parentSearchQuery}&rdquo;</p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
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
                    <div className="grid grid-cols-2 gap-4">
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
                )}
              </div>
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
