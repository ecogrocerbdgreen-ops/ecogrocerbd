import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";

(() => {
  "use strict";

  const SUPABASE_URL = "https://ucwaoytakqldicdtoran.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wpp9kVHNg5pZeGRY0Eoxaw_iyyQez9Q";
  const ADMIN_EMAIL = "ecogrocerbdgreen@gmail.com";

  // Only password-based sign-in is accepted. URL tokens and recovery links
  // are deliberately ignored; the browser never receives an admin secret key.
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "implicit"
    }
  });

  const $ = (id) => document.getElementById(id);

  function showView(name) {
    const isAdmin = name === "success";
    $("login-view").classList.toggle("hidden", isAdmin);
    $("success-view").classList.toggle("hidden", !isAdmin);
    $("login-intro").classList.toggle("hidden", isAdmin);
    document.querySelector(".layout").classList.toggle("admin-mode", isAdmin);
  }

  function showStatus(message, kind = "") {
    const target = $("login-status");
    target.textContent = message;
    target.className = "status" + (kind ? " " + kind : "");
  }

  function setBusy(busy) {
    const button = $("login-button");
    button.disabled = busy;
    button.textContent = busy ? "যাচাই হচ্ছে…" : "লগইন করুন →";
  }

  function isAuthorizedUser(user) {
    return String(user?.email || "").trim().toLowerCase() === ADMIN_EMAIL;
  }

  function friendlyAuthError(error) {
    const combined = (String(error?.code || "") + " " + String(error?.message || "")).toLowerCase();
    if (combined.includes("invalid_login_credentials") ||
        combined.includes("invalid_credentials") ||
        combined.includes("email or password")) {
      return "Gmail অথবা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।";
    }
    if (combined.includes("too many requests") || combined.includes("rate limit")) {
      return "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।";
    }
    return error?.message || "লগইন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।";
  }

  $("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = $("admin-password").value;
    setBusy(true);
    showStatus();

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
      showStatus();
    } catch (error) {
      showStatus(friendlyAuthError(error), "error");
    } finally {
      setBusy(false);
    }
  });

  $("logout-button").addEventListener("click", async () => {
    const button = $("logout-button");
    button.disabled = true;
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      showView("login");
      $("admin-password").value = "";
      showStatus("আপনি নিরাপদভাবে লগআউট করেছেন।", "success");
    } catch (error) {
      showStatus(friendlyAuthError(error), "error");
    } finally {
      button.disabled = false;
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (!session?.user) {
      showView("login");
      return;
    }
    if (!isAuthorizedUser(session.user)) {
      showView("login");
      showStatus("এই Gmail অ্যাডমিন ব্যবহারের জন্য অনুমোদিত নয়।", "error");
      void supabase.auth.signOut({ scope: "local" });
      return;
    }
    if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      showView("success");
    }
  });
})();
