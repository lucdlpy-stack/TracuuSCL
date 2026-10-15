import React, { useState } from 'react';
import { validatePassword } from '../services/auth';
import { AuthUser } from '../types/asset';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Công ty Điện lực Chợ Lớn');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live password validation
  const passValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!account.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    if (!passValidation.valid) {
      setError(passValidation.message || 'Mật khẩu phải bao gồm cả chữ và số.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Vui lòng nhập họ và tên cán bộ.');
          setLoading(false);
          return;
        }

        const { registerUser } = await import('../services/auth');
        const res = await registerUser({
          username: account.trim(),
          name: name.trim(),
          email: email.trim() || `${account.trim()}@evn.com.vn`,
          password,
          unit,
        });
        onLoginSuccess(res.user, res.token);
      } else {
        const { loginUser } = await import('../services/auth');
        const res = await loginUser(account.trim(), password);
        onLoginSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoAcc: string, demoPass: string) => {
    setAccount(demoAcc);
    setPassword(demoPass);
    setIsRegister(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background glowing mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative z-10 space-y-6">
        {/* Header with EVN insignia */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 mx-auto flex items-center justify-center font-black text-white shadow-xl shadow-red-900/40 border border-red-400">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            Tập Đoàn Điện Lực Việt Nam
          </h1>
          <p className="text-xs text-blue-300 font-semibold">
            SỔ TAY TRA CỨU & QUẢN LÝ TÀI SẢN SCL
          </p>
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-950/80 border border-blue-700/60 rounded-full text-[11px] font-bold text-blue-200 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hệ thống Bảo mật Cán bộ EVN</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-start space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Họ và tên cán bộ kỹ thuật *:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn Kỹ Thuật"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Đơn vị quản lý:</label>
                <div className="relative">
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Công ty Điện lực Chợ Lớn">Công ty Điện lực Chợ Lớn</option>
                    <option value="Công ty Điện lực Tân Thuận">Công ty Điện lực Tân Thuận</option>
                    <option value="Công ty Điện lực Gia Định">Công ty Điện lực Gia Định</option>
                    <option value="Công ty Điện lực Bình Phú">Công ty Điện lực Bình Phú</option>
                    <option value="Công ty Truyền tải Điện 1">Công ty Truyền tải Điện 1</option>
                    <option value="Công ty Truyền tải Điện 2">Công ty Truyền tải Điện 2</option>
                    <option value="Ban Quản lý Dự án Lưới điện">Ban Quản lý Dự án Lưới điện</option>
                  </select>
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Email nội bộ:</label>
                <input
                  type="email"
                  placeholder="canbo@evn.com.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </>
          )}

          {/* Account / Username Input */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">
              Tài khoản hoặc Email *:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isRegister ? 'Tên đăng nhập (viết liền)' : 'admin, kythuat, hoặc email...'}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-300">
                Mật khẩu (Gồm cả chữ và số) *:
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu (chứa chữ và số)..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Live Password Rules Checklist */}
            <div className="mt-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-[11px]">
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
                  <span>Phải chứa ít nhất 1 chữ cái (a-z, A-Z)</span>
                </div>
                <div
                  className={`flex items-center space-x-1.5 font-medium ${
                    passValidation.hasNumber ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Phải chứa ít nhất 1 chữ số (0-9)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-blue-900/40 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Đăng Ký Tài Khoản Mới' : 'Đăng Nhập Vào Hệ Thống'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-blue-400 hover:text-blue-300 font-bold text-xs"
          >
            {isRegister
              ? 'Đã có tài khoản? Bấm để Đăng nhập'
              : 'Chưa có tài khoản cán bộ? Bấm vào đây để Đăng ký'}
          </button>
        </div>

        {/* Quick Demo Login Preset Buttons for easy testing */}
        {!isRegister && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold block text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Chọn nhanh tài khoản mẫu EVN:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'EvnAdmin2026')}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-colors"
              >
                <div className="font-bold text-amber-400">Quản trị viên (Admin)</div>
                <div className="text-slate-400 text-[10px]">Pass: EvnAdmin2026</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('kythuat', 'Kythuat2026')}
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 text-left transition-colors"
              >
                <div className="font-bold text-blue-400">Cán bộ Kỹ thuật</div>
                <div className="text-slate-400 text-[10px]">Pass: Kythuat2026</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-500 space-y-1">
        <p>Hệ thống Thông tin Quản lý Kỹ thuật & SCL Thiết bị Điện lực EVN</p>
        <p>Bảo mật xác thực đa cấp • Tự động đồng bộ Realtime Web & Mobile</p>
      </footer>
    </div>
  );
};
