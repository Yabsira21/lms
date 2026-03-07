'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Phone, 
  Edit2, 
  Shield, 
  Key, 
  Bell,
  BookOpen,
  Calendar,
  MessageSquare,
  Camera
} from 'lucide-react';
import { toast } from 'sonner';
import FaceRegistrationCard from './FaceRegistrationCard';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface ProfileContentProps {
  user: User;
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 123-4567');
  const [bio, setBio] = useState('Computer Science student with a passion for AI and machine learning. Always eager to learn.');
  
  const [notifications, setNotifications] = useState({
    courseAnnouncements: true,
    assignmentReminders: true,
    emailNotifications: false
  });

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: user.name,
          phoneNumber,
          bio,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success('Notification preferences updated');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage 
                    src={user.image || `https://avatar.vercel.sh/${user.email}`} 
                    alt={user.name} 
                  />
                  <AvatarFallback className="text-3xl">
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-4 right-0 rounded-full h-8 w-8"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone Number"
                  />
                ) : (
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-sm">Phone Number: {phoneNumber}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Edit2 className="h-4 w-4 text-muted-foreground mt-1" />
                  {isEditing ? (
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Bio"
                      rows={3}
                    />
                  ) : (
                    <div className="flex-1">
                      <p className="text-sm font-medium">Bio:</p>
                      <p className="text-sm text-muted-foreground">{bio}</p>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveProfile} className="flex-1">
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {!isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="w-full"
                  variant="default"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Face Recognition Card */}
          <FaceRegistrationCard userId={user.id} />

          {/* Notification Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="course-announcements" className="cursor-pointer">
                    Course announcements
                  </Label>
                </div>
                <Switch
                  id="course-announcements"
                  checked={notifications.courseAnnouncements}
                  onCheckedChange={() => handleNotificationChange('courseAnnouncements')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="assignment-reminders" className="cursor-pointer">
                    Assignment reminders
                  </Label>
                </div>
                <Switch
                  id="assignment-reminders"
                  checked={notifications.assignmentReminders}
                  onCheckedChange={() => handleNotificationChange('assignmentReminders')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="email-notifications" className="cursor-pointer">
                    Email notifications
                  </Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={() => handleNotificationChange('emailNotifications')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account Security Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="default" className="w-full md:w-auto">
            <Key className="h-4 w-4 mr-2" />
            Change Password
          </Button>
          
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Last login: Today at 10:30 AM (Desktop - Chrome)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
