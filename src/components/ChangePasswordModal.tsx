import React, { useState } from 'react';
import { changePassword, validatePassword } from '../services/auth';
import { AuthUser } from '../types/asset';
import {
  X,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const passValidation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
      return;
    }

    if (!passValidation.valid) {
      setError(passValidation.message || 'Mật khẩu mới phải gồm cả chữ và số, tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const res = await changePassword({
        userId: currentUser.id,
        username: currentUser.username,
        oldPassword,
        newPassword,
      });

      setSuccessMsg(res.message || 'Đổi mật khẩu thành công!');
      setTimeout(() => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Đổi Mật Khẩu Tải Khoản</h2>
              <p className="text-[11px] text-slate-400">Tài khoản: <span className="text-amber-400 font-mono font-bold">{currentUser.username}</span> ({currentUser.name})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Old Password */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">Mật khẩu hiện tại *:</label>
            <div className="relative">
              <input
                type={showOldPass ? 'text' : 'password'}
                placeholder="Nhập mật khẩu đang sử dụng..."
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-base sm:text-xs"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">Mật khẩu mới (Cả chữ và số) *:</label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới (chứa cả chữ và số)..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-base sm:text-xs"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">Xác nhận mật khẩu mới *:</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-base sm:text-xs"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Live Password Rules Checklist */}
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-[11px]">
            <span className="text-slate-400 font-semibold block">Quy tắc bảo mật mật khẩu:</span>
            <div className="flex flex-col gap-1">
              <div
                className={`flex items-center space-x-1.5 font-medium ${
                  passValidation.hasMinLength ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tối thiểu 6 ký tự</span>
              </div>
              <div
                className={`flex items-center space-x-1.5 font-medium ${
                  passValidation.hasLetter ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Chứa ít nhất 1 chữ cái</span>
              </div>
              <div
                className={`flex items-center space-x-1.5 font-medium ${
                  passValidation.hasNumber ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Chứa ít nhất 1 chữ số</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-md text-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác Nhận Đổi Mật Khẩu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
