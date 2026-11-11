import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";

(() => {
  "use strict";

  const SUPABASE_URL = "https://ucwaoytakqldicdtoran.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wpp9kVHNg5pZeGRY0Eoxaw_iyyQez9Q";
  const ADMIN_EMAIL = "ecogrocerbdgreen@gmail.com";

  // Keep the recovery session in memory only. A reset link can never be
  // treated as the normal admin sign-in.
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: true,
      flowType: "implicit"
    }
  });

  const $ = (id) => document.getElementById(id);
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const recoveryTokenHash = search.get("token_hash") || "";
  const recoveryTokenType = search.get("type") || "";
  const hasManualRecoveryLink = Boolean(recoveryTokenHash && recoveryTokenType === "recovery");
  const legacyRecoveryLink = hash.get("type") === "recovery";
  let recoverySessionReady = false;
  let verifyInProgress = false;

  function showView(name) {
    $("login-view").classList.toggle("hidden", name !== "login");
    $("recovery-verify-view").classList.toggle("hidden", name !== "verify");
    $("password-view").classList.toggle("hidden", name !== "password");
    $("success-view").classList.toggle("hidden", name !== "success");
  }

  function showStatus(id, message, kind = "") {
    const target = $(id);
    target.textContent = message;
    target.className = "status" + (kind ? " " + kind : "");
  }

  function setBusy(buttonId, busy, label) {
    const button = $(buttonId);
    if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? label : button.dataset.originalLabel;
  }

  function callbackUrl() {
    return new URL(window.location.pathname, window.location.origin).toString();
  }

  function clearCallbackUrl() {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function isAuthorizedUser(user) {
    return String(user?.email || "").trim().toLowerCase() === ADMIN_EMAIL;
  }

  function friendlyAuthError(error) {
    const code = String(error?.code || "");
    const message = String(error?.message || "");
    const combined = (code + " " + message).toLowerCase();

    if (combined.includes("over_email_send_rate_limit") ||
        combined.includes("email rate limit") ||
        combined.includes("rate limit exceeded")) {
      return "Supabase-এর ইমেইল পাঠানোর সীমা আপাতত শেষ হয়েছে। বারবার বাটনে চাপবেন না। কিছুক্ষণ পরে আবার চেষ্টা করুন এবং Gmail-এর Inbox/Spam-এ সর্বশেষ ইমেইলটি দেখুন।";
    }

    if (combined.includes("otp_expired") ||
        combined.includes("one-time token not found") ||
        (combined.includes("email link") && combined.includes("expired")) ||
        combined.includes("invalid token")) {
      return "এই রিসেট লিংকটি মেয়াদোত্তীর্ণ বা আগে ব্যবহার হয়ে গেছে। নতুন রিসেট ইমেইল চাইতে হবে। Gmail-এর পুরোনো ইমেইল নয়, সর্বশেষ ইমেইলের লিংক ব্যবহার করুন।";
    }

    return message || "অনুরোধটি সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।";
  }

  function showPasswordForm() {
    showView("password");
    $("password-heading").textContent = "নতুন পাসওয়ার্ড সেট করুন";
    $("password-copy").textContent = "আপনার ইমেইল যাচাই হয়েছে। এখন নতুন পাসওয়ার্ডটি দুবার লিখে সংরক্ষণ করুন।";
    showStatus("password-status", "");
  }

  async function syncSessionToScreen(event, session) {
    if (!session?.user) {
      if (hasManualRecoveryLink) showView("verify");
      else if (!legacyRecoveryLink) showView("login");
      return;
    }

    if (!isAuthorizedUser(session.user)) {
      await supabase.auth.signOut({ scope: "local" });
      recoverySessionReady = false;
      showView("login");
      showStatus("login-status", "এই Gmail অ্যাডমিন ব্যবহারের জন্য অনুমোদিত নয়।", "error");
      return;
    }

    // PASSWORD_RECOVERY is a temporary permission to change the password,
    // never proof that the user completed a password-based admin login.
    if (event === "PASSWORD_RECOVERY" || legacyRecoveryLink || verifyInProgress) {
      recoverySessionReady = true;
      showPasswordForm();
      return;
    }

    if (event === "INITIAL_SESSION") {
      await supabase.auth.signOut({ scope: "local" });
      showView("login");
      showStatus("login-status", "আগের সেশন বন্ধ করা হয়েছে। অ্যাডমিনে ঢুকতে Gmail ও পাসওয়ার্ড দিয়ে লগইন করুন।", "success");
    }
  }

  // New links use TokenHash + an explicit Continue button. This prevents
  // email security scanners from consuming Supabase's single-use token.
  if (hasManualRecoveryLink) {
    showView("verify");
  } else if (search.get("error_code") || hash.get("error_code")) {
    showView("login");
    const errorCode = search.get("error_code") || hash.get("error_code") || "";
    const errorDescription = search.get("error_description") || hash.get("error_description") || "";
    showStatus(
      "login-status",
      errorCode === "otp_expired"
        ? "রিসেট লিংকটি মেয়াদোত্তীর্ণ বা আগে ব্যবহার হয়েছে। নতুন লিংক চাইতে হবে।"
        : (errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, " ")) : "ইমেইল লিংকটি যাচাই করা যায়নি। নতুন লিংক চাইুন।"),
      "error"
    );
  } else if (legacyRecoveryLink) {
    showView("login");
  }

  $("verify-recovery-button").addEventListener("click", async () => {
    if (!hasManualRecoveryLink) {
      showStatus("recovery-verify-status", "রিসেট লিংকটি অসম্পূর্ণ। Forgot Password থেকে নতুন ইমেইল চাইুন।", "error");
      return;
    }

    verifyInProgress = true;
    setBusy("verify-recovery-button", true, "ইমেইল যাচাই হচ্ছে…");
    showStatus("recovery-verify-status", "");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: recoveryTokenHash,
        type: "recovery"
      });
      if (error) throw error;

      if (!isAuthorizedUser(data.user)) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("এই ইমেইলটি অ্যাডমিন অ্যাকাউন্টের সঙ্গে মেলে না।");
      }

      recoverySessionReady = true;
      showPasswordForm();
    } catch (error) {
      verifyInProgress = false;
      showStatus("recovery-verify-status", friendlyAuthError(error), "error");
    } finally {
      setBusy("verify-recovery-button", false);
    }
  });

  $("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = $("admin-password").value;
    setBusy("login-button", true, "যাচাই হচ্ছে…");
    showStatus("login-status", "");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password
      });
      if (error) throw error;

      if (!isAuthorizedUser(data.user)) {
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("এই Gmail অ্যাডমিন ব্যবহারের জন্য অনুমোদিত নয়।");
      }

      $("admin-password").value = "";
      showView("success");
    } catch (error) {
      showStatus("login-status", friendlyAuthError(error), "error");
    } finally {
      setBusy("login-button", false);
    }
  });

  $("forgot-button").addEventListener("click", async () => {
    setBusy("forgot-button", true, "ইমেইল পাঠানো হচ্ছে…");
    showStatus("login-status", "");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, {
        redirectTo: callbackUrl()
      });
      if (error) throw error;

      showStatus(
        "login-status",
        "রিসেট ইমেইল পাঠানোর অনুরোধ গ্রহণ করা হয়েছে। Inbox ও Spam দেখুন। ইমেইলের সর্বশেষ লিংক খুলে Continue চাপুন; তারপর নতুন পাসওয়ার্ড দুবার লিখুন।",
        "success"
      );
    } catch (error) {
      showStatus("login-status", friendlyAuthError(error), "error");
    } finally {
      setBusy("forgot-button", false);
    }
  });

  $("password-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!recoverySessionReady) {
      showStatus("password-status", "আগে ইমেইলের রিসেট লিংকটি যাচাই করুন।", "error");
      return;
    }

    const password = $("new-password").value;
    const confirmation = $("confirm-password").value;

    if (password.length < 10) {
      showStatus("password-status", "নিরাপত্তার জন্য কমপক্ষে ১০ অক্ষরের পাসওয়ার্ড দিন।", "error");
      return;
    }
    if (password !== confirmation) {
      showStatus("password-status", "দুটি পাসওয়ার্ড এক হয়নি। আবার মিলিয়ে লিখুন।", "error");
      return;
    }

    setBusy("save-password-button", true, "সংরক্ষণ হচ্ছে…");
    showStatus("password-status", "");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      $("password-form").reset();
      recoverySessionReady = false;

      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      clearCallbackUrl();
      showView("login");

      showStatus(
        "login-status",
        signOutError
          ? "পাসওয়ার্ড পরিবর্তন হয়েছে। নিরাপত্তার জন্য এই পেজটি বন্ধ করে আবার Admin Login খুলুন, তারপর নতুন পাসওয়ার্ড দিয়ে প্রবেশ করুন।"
          : "পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে আলাদা করে লগইন করুন।",
        "success"
      );
    } catch (error) {
      showStatus("password-status", friendlyAuthError(error), "error");
    } finally {
      setBusy("save-password-button", false);
    }
  });

  $("logout-button").addEventListener("click", async () => {
    const button = $("logout-button");
    button.disabled = true;
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      clearCallbackUrl();
      showView("login");
      showStatus("login-status", "আপনি নিরাপদভাবে লগআউট করেছেন।", "success");
    } catch (error) {
      showStatus("login-status", friendlyAuthError(error), "error");
    } finally {
      button.disabled = false;
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    Promise.resolve()
      .then(() => syncSessionToScreen(event, session))
      .catch((error) => {
        showView("login");
        showStatus("login-status", friendlyAuthError(error), "error");
      });
  });
})();
