import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import CreateDoctorForm from '../../components/admin/CreateDoctorForm';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Users, UserX, UserCheck } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBlock = async (id) => {
    try {
      await api.put(`/admin/block-user/${id}`);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-800">
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <CreateDoctorForm onSuccess={fetchUsers} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="text-green-600" /> Users & Doctors Management
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 capitalize">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.role === 'doctor' ? 'bg-blue-100 text-blue-800' : 
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 font-mono text-sm">{u.email}</td>
                      <td className="p-3">
                         {u.isBlocked ? (
                            <span className="text-red-500 flex items-center gap-1"><UserX size={14}/> Blocked</span>
                         ) : (
                            <span className="text-green-500 flex items-center gap-1"><UserCheck size={14}/> Active</span>
                         )}
                      </td>
                      <td className="p-3">
                        {u.role !== 'admin' && (
                          <button 
                            onClick={() => toggleBlock(u._id)}
                            className={`px-3 py-1 rounded text-sm ${u.isBlocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
