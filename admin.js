import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";

(() => {
  "use strict";

  const SUPABASE_URL = "https://ucwaoytakqldicdtoran.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wpp9kVHNg5pZeGRY0Eoxaw_iyyQez9Q";
  const ADMIN_EMAIL = "ecogrocerbdgreen@gmail.com";
  const SETUP_COMPLETE_KEY = "ecogrocer-admin-password-initialized-v1";

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "implicit"
    }
  });

  const $ = (id) => document.getElementById(id);
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const hashType = hash.get("type") || "";
  let flowMode = query.get("flow") || (hashType === "recovery" ? "recovery" :
    (hashType === "magiclink" || hashType === "email" ? "setup" : ""));

  function showView(name) {
    $("login-view").classList.toggle("hidden", name !== "login");
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

  function callbackUrl(flow) {
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("flow", flow);
    return url.toString();
  }

  function clearCallbackUrl() {
    flowMode = "";
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function showPasswordForm(isFirstSetup) {
    showView("password");
    $("password-heading").textContent = isFirstSetup ? "প্রথম পাসওয়ার্ড তৈরি করুন" : "নতুন পাসওয়ার্ড সেট করুন";
    $("password-copy").textContent = isFirstSetup
      ? "আপনার ইমেইল যাচাই হয়েছে। এখন অ্যাডমিন অ্যাকাউন্টের জন্য নিজের পাসওয়ার্ড তৈরি করুন।"
      : "আপনার ইমেইল যাচাই হয়েছে। এখন একটি নতুন পাসওয়ার্ড দিন।";
    showStatus("password-status", "");
  }

  function isAuthorizedUser(user) {
    return String(user?.email || "").trim().toLowerCase() === ADMIN_EMAIL;
  }

  async function syncSessionToScreen(event, session) {
    if (!session?.user) {
      if (!flowMode) showView("login");
      return;
    }

    if (!isAuthorizedUser(session.user)) {
      await supabase.auth.signOut();
      showView("login");
      showStatus("login-status", "এই Gmail অ্যাডমিন ব্যবহারের জন্য অনুমোদিত নয়।", "error");
      return;
    }

    if (event === "PASSWORD_RECOVERY" || flowMode === "recovery" || flowMode === "setup") {
      showPasswordForm(flowMode === "setup");
      return;
    }

    showView("success");
  }

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
        await supabase.auth.signOut();
        throw new Error("এই Gmail অ্যাডমিন ব্যবহারের জন্য অনুমোদিত নয়।");
      }

      $("admin-password").value = "";
      showView("success");
    } catch (error) {
      showStatus("login-status", error.message || "লগইন করা যায়নি। আবার চেষ্টা করুন।", "error");
    } finally {
      setBusy("login-button", false);
    }
  });

  $("forgot-button").addEventListener("click", async () => {
    setBusy("forgot-button", true, "ইমেইল পাঠানো হচ্ছে…");
    showStatus("login-status", "");

    try {
      if (localStorage.getItem(SETUP_COMPLETE_KEY) === "1") {
        const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, {
          redirectTo: callbackUrl("recovery")
        });
        if (error) throw error;
        showStatus("login-status", "পাসওয়ার্ড রিসেট লিংক আপনার Gmail-এ পাঠানো হয়েছে। Inbox ও Spam ফোল্ডার দেখুন।", "success");
      } else {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: ADMIN_EMAIL,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: callbackUrl("setup")
          }
        });
        if (error) throw error;

        if (data?.session && isAuthorizedUser(data.user)) {
          showPasswordForm(true);
        } else {
          showStatus("login-status", "প্রথমবারের অ্যাকাউন্ট যাচাইয়ের নিরাপদ লিংক আপনার Gmail-এ পাঠানো হয়েছে। ইমেইলের লিংকে ক্লিক করে পাসওয়ার্ড তৈরি করুন।", "success");
        }
      }
    } catch (error) {
      showStatus("login-status", error.message || "ইমেইল পাঠানো যায়নি। Supabase Auth-এর URL ও Email সেটিংস পরীক্ষা করুন।", "error");
    } finally {
      setBusy("forgot-button", false);
    }
  });

  $("password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
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

      localStorage.setItem(SETUP_COMPLETE_KEY, "1");
      $("password-form").reset();

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        clearCallbackUrl();
        showView("success");
        showStatus("password-status", "পাসওয়ার্ড পরিবর্তন হয়েছে। আপনার সেশন বন্ধ করতে লগআউট বাটন ব্যবহার করুন।", "success");
        return;
      }

      clearCallbackUrl();
      showView("login");
      showStatus("login-status", "পাসওয়ার্ড সফলভাবে তৈরি/রিসেট হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।", "success");
    } catch (error) {
      showStatus("password-status", error.message || "পাসওয়ার্ড সংরক্ষণ করা যায়নি। ইমেইলের লিংকটি মেয়াদোত্তীর্ণ হলে আবার রিসেট করুন।", "error");
    } finally {
      setBusy("save-password-button", false);
    }
  });

  $("logout-button").addEventListener("click", async () => {
    const button = $("logout-button");
    button.disabled = true;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearCallbackUrl();
      showView("login");
      showStatus("login-status", "আপনি নিরাপদভাবে লগআউট করেছেন।", "success");
    } catch (error) {
      showStatus("login-status", error.message || "লগআউট করা যায়নি।", "error");
    } finally {
      button.disabled = false;
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    Promise.resolve().then(() => syncSessionToScreen(event, session)).catch((error) => {
      showView("login");
      showStatus("login-status", error.message || "অ্যাকাউন্ট যাচাই করা যায়নি।", "error");
    });
  });
})();