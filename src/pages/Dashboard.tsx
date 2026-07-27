import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.full_name || user?.email}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <p className="text-lg text-green-600">
                {user?.is_verified ? 'Verified' : 'Not Verified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-lg">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
