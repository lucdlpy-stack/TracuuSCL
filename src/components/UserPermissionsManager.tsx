import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AuthUser, UserPermissions } from '../types/asset';
import { formatVietnameseDateTime } from '../utils/dateFormatter';
import {
  ShieldCheck,
  Save,
  CheckCircle2,
  Building2,
  UserPlus,
  Search,
  Lock,
  Clock,
  Trash2,
} from 'lucide-react';

export const UserPermissionsManager: React.FC = () => {
  const { currentUser } = useApp();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toISOString());
  const [search, setSearch] = useState('');

  // New User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Engineer');

  // Strict Admin Check for luctt1 / Admin role
  const isAdmin =
    currentUser?.username?.toLowerCase() === 'luctt1' ||
    currentUser?.role === 'Admin';

  // Load registered users from API or LocalStorage
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Offline fallback
    }

    // Fallback default users if API offline
    const rawLocal = localStorage.getItem('evn_users_permissions_db_v1');
    if (rawLocal) {
      try {
        setUsers(JSON.parse(rawLocal));
        setLoading(false);
        return;
      } catch {
        // ignore
      }
    }

    const defaultUsers: AuthUser[] = [
      {
        id: 'USR-000',
        username: 'luctt1',
        name: 'Tôn Tấn Lực (Admin EVN)',
        email: 'luctt1@evn.com.vn',
        role: 'Admin',
        unit: 'Công ty Điện lực Chợ Lớn',
        permissions: { canView: true, canEdit: true, canUpdate: true },
      },
      {
        id: 'USR-001',
        username: 'admin',
        name: 'Tôn Tấn Lực',
        email: 'admin@evn.com.vn',
        role: 'Admin',
        unit: 'Công ty Điện lực Chợ Lớn',
        permissions: { canView: true, canEdit: true, canUpdate: true },
      },
      {
        id: 'USR-002',
        username: 'kythuat',
        name: 'Kỹ sư Quản lý Kỹ thuật',
        email: 'kythuat@evn.com.vn',
        role: 'Technical',
        unit: 'Công ty Điện lực Chợ Lớn',
        permissions: { canView: true, canEdit: true, canUpdate: true },
      },
      {
        id: 'USR-003',
        username: 'vanhanh',
        name: 'Kỹ sư Quản lý Vận hành',
        email: 'vanhanh@evn.com.vn',
        role: 'Operator',
        unit: 'Công ty Điện lực Tân Thuận',
        permissions: { canView: true, canEdit: true, canUpdate: false },
      },
    ];

    setUsers(defaultUsers);
    localStorage.setItem('evn_users_permissions_db_v1', JSON.stringify(defaultUsers));
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleTogglePermission = (
    userId: string,
    permKey: keyof UserPermissions
  ) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const currentPerms = u.permissions || {
            canView: true,
            canEdit: true,
            canUpdate: true,
          };
          return {
            ...u,
            permissions: {
              ...currentPerms,
              [permKey]: !currentPerms[permKey],
            },
          };
        }
        return u;
      })
    );
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, role: newRole };
        }
        return u;
      })
    );
  };

  const handleDeleteUser = async (userId: string, targetName: string, targetUsername: string) => {
    if (targetUsername.toLowerCase() === 'luctt1') {
      alert('Không thể xóa tài khoản Quản trị viên tối cao (luctt1 - Tôn Tấn Lực).');
      return;
    }

    if (window.confirm(`Đồng chí có chắc chắn muốn XÓA tài khoản cán bộ "${targetName}" (@${targetUsername}) khỏi hệ thống EVN?`)) {
      const updated = users.filter((u) => u.id !== userId);
      setUsers(updated);
      localStorage.setItem('evn_users_permissions_db_v1', JSON.stringify(updated));

      try {
        await fetch('/api/users/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      } catch {
        // deleted locally
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSaveChanges = async () => {
    const nowISO = new Date().toISOString();
    setLastUpdatedTime(nowISO);
    localStorage.setItem('evn_users_permissions_db_v1', JSON.stringify(users));

    try {
      await fetch('/api/users/update-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      });
    } catch {
      // saved locally
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newName || !newPassword) return;

    const newUser: AuthUser = {
      id: `USR-${Date.now()}`,
      username: newUsername.trim(),
      name: newName.trim(),
      email: newEmail.trim() || `${newUsername.trim()}@evn.com.vn`,
      role: newRole,
      unit: newUnit.trim() || 'Công ty Điện lực Chợ Lớn',
      permissions: { canView: true, canEdit: true, canUpdate: true },
    };

    const updated = [newUser, ...users];
    setUsers(updated);
    localStorage.setItem('evn_users_permissions_db_v1', JSON.stringify(updated));

    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          unit: newUnit.trim(),
        }),
      });
    } catch {
      // created locally
    }

    setShowAddModal(false);
    setNewUsername('');
    setNewName('');
    setNewUnit('');
    setNewEmail('');
    setNewPassword('');
    alert(`Đã cấp tài khoản thành công cho cán bộ: ${newName}`);
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      u.username.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      u.unit.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  // Strict Security Access Denied view for non-admin accounts
  if (!isAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-10 text-center space-y-4 shadow-2xl my-6">
        <div className="w-16 h-16 rounded-full bg-rose-950 text-rose-500 border border-rose-800 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-white">Chức năng Bảo mật Phân quyền</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Mục <span className="text-amber-300 font-extrabold">Phân quyền Cán bộ</span> chỉ hiển thị duy nhất khi đăng nhập bằng tài khoản Quản trị viên <span className="text-amber-300 font-extrabold">luctt1 (Tôn Tấn Lực)</span> để đảm bảo tối đa tính bảo mật phân quyền hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white p-6 rounded-3xl shadow-xl border border-blue-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-extrabold border border-amber-400/40 mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Bảo mật Phân quyền • Tôn Tấn Lực (luctt1 - Admin EVN)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Quản Lý Tài Khoản Nguồn Nhân Lực & Xóa / Tích Chọn Phân Quyền
          </h2>
          <p className="text-xs text-blue-200/90 mt-1">
            Quản trị viên có thể <span className="text-rose-300 font-bold">Xóa tài khoản không còn sử dụng</span> hoặc tích chọn phân quyền <span className="text-emerald-300 font-bold">Xem</span>, <span className="text-amber-300 font-bold">Chỉnh sửa</span>, <span className="text-blue-300 font-bold">Thêm mới/Cập nhật</span>.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-lg text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo Tài Khoản Mới</span>
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl shadow-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Phân Quyền</span>
          </button>
        </div>
      </div>

      {/* Timestamp Toast */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs font-bold rounded-2xl flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Đã cập nhật danh sách người dùng & phân quyền thành công!</span>
          </div>
          <div className="text-[11px] text-emerald-300/90 font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Cập nhật lúc: {formatVietnameseDateTime(lastUpdatedTime)}</span>
          </div>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo Tên cán bộ, Tài khoản, Đơn vị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="text-xs text-slate-400 font-semibold flex items-center gap-2">
          <span>Thời gian cập nhật: <span className="text-emerald-400 font-bold">{formatVietnameseDateTime(lastUpdatedTime)}</span></span>
          <span>•</span>
          <span>Tổng số: <span className="text-amber-400 font-extrabold">{users.length}</span> cán bộ</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 font-black uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Cán bộ / Đơn vị</th>
                <th className="p-3.5">Vai trò hệ thống</th>
                <th className="p-3.5 text-center">👁️ Quyền Xem</th>
                <th className="p-3.5 text-center">✏️ Quyền Chỉnh sửa</th>
                <th className="p-3.5 text-center">➕ Quyền Cập nhật/Thêm mới</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((user) => {
                const perms = user.permissions || {
                  canView: true,
                  canEdit: true,
                  canUpdate: true,
                };

                const isTargetAdmin = user.username.toLowerCase() === 'luctt1';

                return (
                  <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* User Info */}
                    <td className="p-3.5 space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isTargetAdmin && (
                              <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-md">
                                ADMIN EVN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            @{user.username} • {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{user.unit}</span>
                      </div>
                    </td>

                    {/* Role Selector */}
                    <td className="p-3.5">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="Admin">Quản trị viên (Admin)</option>
                        <option value="Technical">Kỹ sư Kỹ thuật</option>
                        <option value="Operator">Kỹ sư Vận hành</option>
                        <option value="Viewer">Người xem (Chỉ xem)</option>
                      </select>
                    </td>

                    {/* Checkbox: Quyền Xem */}
                    <td className="p-3.5 text-center">
                      <label className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={perms.canView}
                          onChange={() => handleTogglePermission(user.id, 'canView')}
                          className="w-4 h-4 accent-emerald-500 rounded focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                        />
                      </label>
                    </td>

                    {/* Checkbox: Quyền Chỉnh sửa */}
                    <td className="p-3.5 text-center">
                      <label className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={perms.canEdit}
                          onChange={() => handleTogglePermission(user.id, 'canEdit')}
                          className="w-4 h-4 accent-amber-500 rounded focus:ring-2 focus:ring-amber-400 cursor-pointer"
                        />
                      </label>
                    </td>

                    {/* Checkbox: Quyền Cập nhật / Thêm mới */}
                    <td className="p-3.5 text-center">
                      <label className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={perms.canUpdate}
                          onChange={() => handleTogglePermission(user.id, 'canUpdate')}
                          className="w-4 h-4 accent-blue-500 rounded focus:ring-2 focus:ring-blue-400 cursor-pointer"
                        />
                      </label>
                    </td>

                    {/* Actions: Delete User */}
                    <td className="p-3.5 text-right font-bold">
                      {isTargetAdmin ? (
                        <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-[10px]">
                          Admin Tối cao
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name, user.username)}
                          className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ml-auto cursor-pointer"
                          title="Xóa người dùng không còn sử dụng"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserPlus className="w-5 h-5 text-blue-400" />
              <span>Thêm Mới Cán Bộ & Cấp Phân Quyền</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Tên tài khoản (viết liền) *:</label>
                <input
                  type="text"
                  placeholder="VD: linhtv, phuongevn..."
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Họ và tên cán bộ *:</label>
                <input
                  type="text"
                  placeholder="VD: Tôn Văn Linh..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Đơn vị quản lý *:</label>
                <input
                  type="text"
                  placeholder="VD: Điện lực Tuy An..."
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Email *:</label>
                <input
                  type="email"
                  placeholder="VD: linhtv@evn.com.vn..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Mật khẩu (chứa chữ và số) *:</label>
                <input
                  type="password"
                  placeholder="VD: Linh2026..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Vai trò:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                >
                  <option value="Engineer">Kỹ sư Kỹ thuật</option>
                  <option value="Operator">Kỹ sư Vận hành</option>
                  <option value="Admin">Quản trị viên (Admin)</option>
                  <option value="Viewer">Người xem</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-lg"
                >
                  Thêm Cán Bộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
