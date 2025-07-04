import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Filter, User, MoreVertical, CheckCircle, XCircle, Shield, Edit, Trash2 } from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { EditUserModal } from '../components/auth/EditUserModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useToast } from '../lib/ToastContext';

export const AdminUsersPage = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          const typedUsers = data.map(user => ({
            ...user,
            role: (user.role === 'admin' || user.role === 'moderator' || user.role === 'user') ? user.role : 'user'
          })) as UserType[];
          setUsers(typedUsers);
          setFilteredUsers(typedUsers);
        }
      } catch (error: any) {
        console.error('Ошибка при загрузке пользователей:', error);
        setError('Не удалось загрузить пользователей. Проверьте подключение к интернету.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => {

      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filterRole === '' || user.role === filterRole;

      const matchesStatus = filterStatus === '' || (filterStatus === 'active');
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterStatus]);
  
  const handleEdit = (user: UserType) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setError(null);
    try {
      if (userToDelete === currentUser?.id) {
        throw new Error("Вы не можете удалить свою собственную учетную запись.");
      }
      
      const { error: deleteUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete);

      if (deleteUserError) throw deleteUserError;
      
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete));
      addToast('Пользователь успешно удален.', 'success');

    } catch (error: any) {
      console.error('Ошибка при удалении пользователя:', error);
      addToast(`Ошибка: ${error.message}`, 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setUserToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleSaveUser = (updatedUser: UserType) => {
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u)
    );
    addToast('Информация о пользователе успешно обновлена.', 'success');
  };
  

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'moderator':
        return 'Модератор';
      case 'user':
        return 'Пользователь';
      default:
        return 'Неизвестно';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Управление пользователями</h1>
          <p className="text-gray-600">
            Просмотр и редактирование информации о пользователях
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">X</button>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter size={18} className="mr-2" />
              Фильтры
            </Button>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Роль пользователя</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  >
                    <option value="">Все роли</option>
                    <option value="user">Пользователи</option>
                    <option value="moderator">Модераторы</option>
                    <option value="admin">Администраторы</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  >
                    <option value="">Все статусы</option>
                    <option value="active">Активные</option>
                    <option value="blocked">Заблокированные</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterRole('');
                    setFilterStatus('');
                  }}
                  className="mr-2"
                >
                  Сбросить
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  Применить
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Загрузка пользователей...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-100">
            <User size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Пользователи не найдены</h3>
            <p className="text-gray-600">Попробуйте изменить параметры поиска или фильтры</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата регистрации
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.avatar_url ? (
                              <img className="h-10 w-10 rounded-full object-cover\" src={user.avatar_url} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Активен
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50"
                            title="Редактировать"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user.id)}
                            className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50"
                            title="Удалить"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button variant="outline" size="sm">Назад</Button>
                <Button variant="outline" size="sm">Вперед</Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Показано <span className="font-medium">1</span> - <span className="font-medium">{filteredUsers.length}</span> из <span className="font-medium">{users.length}</span> пользователей
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Предыдущая</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">1</a>
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Следующая</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <EditUserModal
        isOpen={isEditModalOpen}
        user={selectedUser}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveUser}
        setError={(err) => addToast(err || 'Произошла неизвестная ошибка', 'error')}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Удалить пользователя?"
        message="Это действие необратимо. Вы уверены, что хотите удалить этого пользователя?"
        confirmText="Удалить"
        cancelText="Отмена"
        isLoading={isDeleting}
      />
    </Layout>
  );
};