import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import { User, Mail, Calendar, Wallet, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Profile = ({ user, onLogout }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    // Update logic would go here
    setEditOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50">
      <Header user={user} onLogout={onLogout} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-['Outfit'] font-bold text-teal-600 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 font-['Manrope']">Manage your account settings and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <Card className="surface-card border-0 shadow-xl">
              <CardContent className="pt-8 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-teal-500 flex items-center justify-center text-white text-3xl font-['Outfit'] font-bold shadow-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-['Outfit'] font-bold text-gray-800 mb-1">{user?.name}</h2>
                <p className="text-gray-500 font-['Manrope'] text-sm">{user?.email}</p>
                
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-6 w-full bg-teal-500 hover:bg-teal-600 hover:shadow-lg text-white rounded-full font-['Manrope']">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-['Outfit']">Edit Profile</DialogTitle>
                      <DialogDescription className="font-['Manrope']">
                        Update your account information
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-['Manrope']">Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="font-['Manrope']"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-['Manrope']">Email</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="font-['Manrope']"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-full font-['Manrope']">
                        Save Changes
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Details */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2"
          >
            <Card className="surface-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-['Outfit'] font-bold text-gray-800">
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-['Manrope'] text-gray-500 mb-1">Full Name</p>
                    <p className="text-lg font-['Manrope'] font-semibold text-gray-800">{user?.name}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-['Manrope'] text-gray-500 mb-1">Email Address</p>
                    <p className="text-lg font-['Manrope'] font-semibold text-gray-800">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-green-50 border border-green-100">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-['Manrope'] text-gray-500 mb-1">Default Currency</p>
                    <p className="text-lg font-['Manrope'] font-semibold text-gray-800">{user?.currency_preference || 'USD'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-['Manrope'] text-gray-500 mb-1">Member Since</p>
                    <p className="text-lg font-['Manrope'] font-semibold text-gray-800">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
