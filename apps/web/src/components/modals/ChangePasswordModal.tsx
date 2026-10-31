"use client";

import React, { useState, useMemo } from "react";
import { Key, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, ShieldCheck } from "lucide-react";

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onPasswordChanged: (newPassword: string) => void;
  showToast: (msg: string) => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  user,
  onPasswordChanged,
  showToast
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Critères de sécurité mot de passe
  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[^A-Za-z0-9]/.test(newPassword),
      matchesConfirm: Boolean(newPassword && newPassword === confirmPassword)
    };
  }, [newPassword, confirmPassword]);

  const isPasswordStrong =
    passwordCriteria.hasMinLength &&
    passwordCriteria.hasUppercase &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasSpecialChar;

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!oldPassword.trim()) {
      setErrorMsg("Veuillez saisir votre mot de passe actuel.");
      return;
    }

    if (!isPasswordStrong) {
      setErrorMsg("Le nouveau mot de passe ne respecte pas tous les critères de sécurité.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    if (oldPassword === newPassword) {
      setErrorMsg("Le nouveau mot de passe doit être différent de l'ancien mot de passe.");
      return;
    }

    // Validation réussie
    onPasswordChanged(newPassword);
    showToast("✅ Mot de passe modifié avec succès ! Votre compte est sécurisé.");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  return (
    <div
      data-testid="change-password-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* En-tête de la modale */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Changer mon mot de passe</h3>
              <p className="text-[11px] text-sky-200/80">Compte : {user.name} ({user.email})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {errorMsg && (
            <div
              data-testid="change-password-error"
              className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mot de passe actuel / temporaire *
            </label>
            <input
              type="password"
              data-testid="old-password-input"
              required
              placeholder="Saisissez votre mot de passe actuel"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nouveau mot de passe *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                data-testid="new-password-input"
                required
                placeholder="Minimum 8 caractères, majuscule, chiffre, symbole"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-1.5 pr-9 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Confirmer le nouveau mot de passe *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                data-testid="confirm-password-input"
                required
                placeholder="Retapez le nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-1.5 pr-9 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Indicateurs de force du mot de passe */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
              <span>Critères de sécurité requis :</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                <CheckCircle2 className={`w-3 h-3 ${passwordCriteria.hasMinLength ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Au moins 8 caractères</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUppercase ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                <CheckCircle2 className={`w-3 h-3 ${passwordCriteria.hasUppercase ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Une majuscule (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                <CheckCircle2 className={`w-3 h-3 ${passwordCriteria.hasNumber ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Au moins un chiffre (0-9)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecialChar ? "text-emerald-700 font-semibold" : "text-slate-500"}`}>
                <CheckCircle2 className={`w-3 h-3 ${passwordCriteria.hasSpecialChar ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Un caractère spécial (@, #, !, etc.)</span>
              </div>
            </div>
            {confirmPassword && (
              <div className={`pt-1 border-t border-slate-200 flex items-center gap-1.5 ${passwordCriteria.matchesConfirm ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}`}>
                <CheckCircle2 className={`w-3 h-3 ${passwordCriteria.matchesConfirm ? "text-emerald-600" : "text-rose-400"}`} />
                <span>{passwordCriteria.matchesConfirm ? "Les deux mots de passe correspondent" : "Les mots de passe ne correspondent pas"}</span>
              </div>
            )}
          </div>

          {/* Pied de modale */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              data-testid="submit-change-password-btn"
              disabled={!isPasswordStrong || !passwordCriteria.matchesConfirm}
              className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 text-white transition shadow-sm ${
                isPasswordStrong && passwordCriteria.matchesConfirm
                  ? "bg-sky-700 hover:bg-sky-800 cursor-pointer"
                  : "bg-slate-400 cursor-not-allowed opacity-70"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Valider le nouveau mot de passe</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
