import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  setError: (error: string | null) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, user, onClose, onSave, setError }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
      setRole(user.role);
    }
  }, [user]);

  if (!isOpen) {
    return null;
  }

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    
    try {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          username,
          role,
          email,
        })
        .eq('id', user.id);
      
      if (userUpdateError) throw userUpdateError;

      const updatedUser: User = {
        ...user,
        username,
        email,
        role,
      };
      
      onSave(updatedUser);
      onClose();

    } catch (error: any) {
      console.error("Ошибка при обновлении пользователя:", error);
      setError(`Не удалось обновить пользователя: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all scale-95 opacity-0 animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Редактировать пользователя</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">&times;</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Имя пользователя</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            >
              <option value="user">Пользователь</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
}; 