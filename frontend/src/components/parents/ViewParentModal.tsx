import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, MapPin, Users, Calendar, GraduationCap, TrendingUp, User } from "lucide-react";

interface Student {
  id: string;
  fullName: string;
  email: string;
  age: number;
  gender: string;
  level: string;
  status: string;
  currentResidency?: string;
  studentCode?: string;
  attendanceRate: number;
  progressRate: number;
  avatarUrl?: string;
}

interface Parent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  residency: string;
  relationshipWithStudent: string;
  status: string;
  students: Student[];
  createdAt: string;
}

interface ViewParentModalProps {
  parent: Parent | null;
  open: boolean;
  onClose: () => void;
}

export function ViewParentModal({ parent, open, onClose }: ViewParentModalProps) {
  if (!parent) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Parent Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{parent.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    variant={parent.status === "active" ? "default" : "secondary"}
                    className={parent.status === "active" ? "bg-emerald-100 text-emerald-700" : ""}
                  >
                    {parent.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{parent.email}</span>
              </div>

              {parent.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{parent.phoneNumber}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{parent.residency}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Users className="h-4 w-4 text-gray-400" />
                <span>Relationship: {parent.relationshipWithStudent}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Joined: {new Date(parent.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Linked Students ({parent.students?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {parent.students && parent.students.length > 0 ? (
                <div className="space-y-2">
                  {parent.students.map((student: any) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{student.fullName}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <Badge variant="outline">{student.level}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No students linked yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
