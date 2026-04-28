import { useMemo, useState } from 'react';
import {
  UserCircle,
  WarningCircle,
  EnvelopeSimple,
  UsersThree,
  Key,
  PaperPlaneTilt,
  ShieldCheck,
} from '@phosphor-icons/react';
import { requestEmailCode } from '../lib/emailAuth';

function LoginField({ icon: Icon, placeholder, type = 'text', value, onChange, onKeyDown, rightIcon: RightIcon, onRightIconClick, rightIconClassName = '', rightIconAriaLabel = 'Acción de campo' }) {
  return (
    <div className="group flex h-[3.65rem] items-center gap-3 rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.045))] px-5 text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_42px_rgba(0,0,0,0.20)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#9fe4bf]/28 focus-within:bg-white/[0.095] focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_22px_50px_rgba(74,124,111,0.14)]">
      <div className="flex h-9 w-9 min-w-9 items-center justify-center rounded-full bg-[#4A7C6F]/16 text-[#a8e8c5] shadow-[inset_0_0_0_1px_rgba(151,224,188,0.16)] transition-all duration-300 group-focus-within:bg-[#4A7C6F]/24 group-focus-within:text-[#d7fff0]">
        <Icon size={19} weight="bold" />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="w-full bg-transparent text-[15px] font-medium tracking-[0.01em] text-white outline-none placeholder:text-white/38"
        autoComplete="off"
      />
      {RightIcon ? (
        <button
          type="button"
          onClick={onRightIconClick}
          aria-label={rightIconAriaLabel}
          className="flex h-9 w-9 min-w-9 items-center justify-center rounded-full bg-[#4A7C6F]/20 text-[#cffff0] shadow-[inset_0_0_0_1px_rgba(151,224,188,0.28)] transition-all duration-300 hover:bg-[#4A7C6F]/30 hover:text-white"
        >
          <RightIcon size={18} weight="bold" className={rightIconClassName} />
        </button>
      ) : null}
    </div>
  );
}

const DIRECT_ADMIN_EMAIL = 'yuniorm001@gmail.com';

export default function LoginScreen({ onGuestAccess, onProviderSelect, onEmailCodeVerify, onDirectAdminLogin, isTransitioning = false, loginError = '', cloudReady = false }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpStatus, setOtpStatus] = useState('');
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const emailReady = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const isDirectAdmin = email.trim().toLowerCase() === DIRECT_ADMIN_EMAIL;
  const canVerify = emailReady && code.trim().length >= 4;
  const canDirectLogin = emailReady && isDirectAdmin && password.trim().length > 0;

  const handleDirectLogin = async () => {
    if (!canDirectLogin || isVerifyingCode || isTransitioning) return;

    try {
      setIsVerifyingCode(true);
      setOtpStatus('');
      await onDirectAdminLogin?.({ email: email.trim(), password: password.trim() });
    } catch (error) {
      setOtpStatus(error?.message || 'No se pudo iniciar sesión con esa clave.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSendCode = async () => {
    if (!emailReady || isRequestingCode || isTransitioning) return;

    try {
      setIsRequestingCode(true);
      setOtpStatus('');
      await requestEmailCode(email.trim());
      setOtpRequested(true);
      setOtpStatus('Te enviamos un código de 6 dígitos a tu correo autorizado. Revisa también spam o promociones.');
    } catch (error) {
      setOtpStatus(error?.message || 'No se pudo enviar el código.');
    } finally {
      setIsRequestingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!canVerify || isVerifyingCode || isTransitioning) return;

    try {
      setIsVerifyingCode(true);
      setOtpStatus('');
      await onEmailCodeVerify?.({ email: email.trim(), code: code.trim() });
    } catch (error) {
      setOtpStatus(error?.message || 'No se pudo validar el código.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const statusToneClass = otpStatus.includes('Te enviamos')
    ? 'bg-emerald-500/10 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]'
    : 'bg-white/[0.04] text-white/75 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040806] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(126,180,159,0.22),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(74,124,111,0.14),transparent_18%),linear-gradient(135deg,#030605_0%,#07100d_42%,#091611_100%)]" />
      <div className="absolute left-[-10%] top-[12%] h-96 w-96 rounded-full bg-[#4A7C6F]/12 blur-3xl" />
      <div className="absolute bottom-[-14%] right-[-10%] h-[30rem] w-[30rem] rounded-full bg-[#2F6154]/14 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(189,255,221,0.28),transparent)]" />

      <div className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-[560px] rounded-[38px] border border-white/[0.075] bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.032))] px-6 py-8 shadow-[0_28px_90px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:px-10 sm:py-10">
          <div className="flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_22px_62px_rgba(0,0,0,0.36)]">
              <div className="absolute inset-[-7px] rounded-full border border-[#97e0bc]/12" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(145deg,#2F6154,#6ca08f)] text-white shadow-[0_14px_38px_rgba(74,124,111,0.32)]">
                <UserCircle size={35} weight="fill" />
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#97e0bc]/14 bg-[#4A7C6F]/12 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#cffff0] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <ShieldCheck size={13} weight="fill" />
              Acceso seguro
            </div>
            <h1 className="mt-4 text-[31px] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[36px]">
              Control financiero inteligente
            </h1>
            <p className="mx-auto mt-3 max-w-[410px] text-[14px] leading-6 text-white/55">
              Entra a tu panel para medir cash, tarjetas, metas y decisiones con una experiencia premium creada para tomar mejores decisiones cada día.
            </p>
          </div>

          <div className="mt-7 rounded-[30px] border border-white/[0.07] bg-black/[0.13] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
            <div className="space-y-3">
              <LoginField
                icon={EnvelopeSimple}
                placeholder="Correo autorizado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (isDirectAdmin) { handleDirectLogin(); } else { otpRequested ? handleVerifyCode() : handleSendCode(); } } }}
              />
              {isDirectAdmin ? (
                <LoginField
                  icon={Key}
                  placeholder="Clave de administrador"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDirectLogin(); } }}
                  rightIcon={ShieldCheck}
                  onRightIconClick={handleDirectLogin}
                  rightIconClassName="text-[#d7fff0]"
                  rightIconAriaLabel="Entrar como administrador"
                />
              ) : (
                <LoginField
                  icon={ShieldCheck}
                  placeholder="Código de verificación"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); otpRequested ? handleVerifyCode() : handleSendCode(); } }}
                  rightIcon={otpRequested ? ShieldCheck : PaperPlaneTilt}
                  onRightIconClick={otpRequested ? handleVerifyCode : handleSendCode}
                  rightIconClassName="text-[#d7fff0]"
                  rightIconAriaLabel={otpRequested ? 'Verificar código' : 'Enviar código'}
                />
              )}
            </div>
          </div>

          {isDirectAdmin ? (
            <div className="mt-4 rounded-[22px] bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]">
              Acceso directo de administrador activo para yuniorm001@gmail.com. Solo escribe tu clave y entra al panel admin.
            </div>
          ) : null}

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(151,224,188,0.22))]" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#97e0bc]/14 bg-white/[0.035] text-[#bfe8d5] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Key size={15} weight="bold" />
            </div>
            <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(151,224,188,0.22),transparent)]" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={isDirectAdmin ? handleDirectLogin : (otpRequested ? handleVerifyCode : handleSendCode)}
              disabled={isTransitioning || isRequestingCode || isVerifyingCode || !emailReady || (isDirectAdmin ? !canDirectLogin : (otpRequested && !canVerify))}
              className="group relative flex h-[3.6rem] w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-[#7eb49f]/40 bg-[linear-gradient(135deg,rgba(47,97,84,0.88)_0%,rgba(84,134,119,0.72)_100%)] px-5 text-[14px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_16px_40px_rgba(22,50,42,0.30),inset_0_1px_0_rgba(255,255,255,0.11)] transition-all duration-700 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 before:absolute before:inset-y-0 before:left-[-24%] before:w-[40%] before:skew-x-[-20deg] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)] before:opacity-0 before:transition-all before:duration-700 before:ease-in-out hover:border-[#bfe8d5]/34 hover:before:left-[62%] hover:before:opacity-100"
            >
              {isDirectAdmin ? <ShieldCheck size={20} weight="fill" className="relative z-10" /> : (otpRequested ? <ShieldCheck size={20} weight="fill" className="relative z-10" /> : <PaperPlaneTilt size={20} weight="fill" className="relative z-10" />)}
              <span className="relative z-10">
                {isDirectAdmin ? (isVerifyingCode ? 'Entrando...' : 'Entrar como admin') : (otpRequested ? (isVerifyingCode ? 'Validando...' : 'Verificar código') : (isRequestingCode ? 'Enviando...' : 'Enviar código'))}
              </span>
            </button>

          {otpRequested && !isDirectAdmin ? (
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isTransitioning || isRequestingCode}
              className="group relative flex h-[3.6rem] w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-[#7eb49f]/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(74,124,111,0.11))] px-5 text-[14px] font-semibold uppercase tracking-[0.2em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:border-[#9ad2b9]/35 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.075),rgba(74,124,111,0.17))] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PaperPlaneTilt size={20} weight="bold" className="relative z-10" />
              <span className="relative z-10">Reenviar código</span>
            </button>
          ) : null}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="rounded-[18px] bg-white/[0.035] px-2 py-3">
              <PaperPlaneTilt size={16} weight="bold" className="mx-auto text-[#9ddabc]" />
              <p className="mt-1 text-[11px] font-medium text-white/58">Cash</p>
            </div>
            <div className="rounded-[18px] bg-white/[0.035] px-2 py-3">
              <ShieldCheck size={16} weight="bold" className="mx-auto text-[#9ddabc]" />
              <p className="mt-1 text-[11px] font-medium text-white/58">Crédito</p>
            </div>
            <div className="rounded-[18px] bg-white/[0.035] px-2 py-3">
              <Key size={16} weight="bold" className="mx-auto text-[#9ddabc]" />
              <p className="mt-1 text-[11px] font-medium text-white/58">Metas</p>
            </div>
          </div>

          {otpStatus ? (
            <div className={`mt-5 rounded-[22px] px-4 py-4 text-sm ${statusToneClass}`}>
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} weight="fill" className="mt-0.5" />
                <span>{otpStatus}</span>
              </div>
            </div>
          ) : null}

          {loginError ? (
            <div className="mt-5 rounded-[22px] bg-red-500/10 px-4 py-4 text-sm text-red-200 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.18)]">
              <div className="flex items-start gap-3">
                <WarningCircle size={18} weight="fill" className="mt-0.5" />
                <span>{loginError}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
