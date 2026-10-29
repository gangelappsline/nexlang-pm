import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../../assets/images/bg_login.png";
import { fetchCurrentUser, loginUser } from "../../api/auth";
import {
  getAuthToken,
  setAuthToken,
  setAuthUser,
  clearAuthToken,
} from "../../utils/auth-storage";
import LogoFull from '../../assets/images/logos/logo_full.png';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const token = getAuthToken();
  const navigate = useNavigate();

  const { data: currentUser, isError, error } = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => fetchCurrentUser(token),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (currentUser && !isError) {
      setAuthUser(currentUser);
      
      // Set default project ID in session storage
      const defaultProjectId = import.meta.env.VITE_DEFAULT_PROJECT_ID;
      if (defaultProjectId) {
        sessionStorage.setItem('selectedProjectId', defaultProjectId);
      }
      
      navigate("/admin/dashboard", { replace: true });
    }
  }, [currentUser, isError, navigate]);

  useEffect(() => {
    if (isError && error?.status === 401) {
      clearAuthToken();
    }
  }, [error, isError]);

  const {
    mutate: submitLogin,
    isPending: isLoginPending,
    isError: isLoginErrorState,
  } = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      setLoginError("");
      
      if (data?.data.access_token) {
        setAuthToken(data.data.access_token);
      }

      if (data?.data.user) {
        setAuthUser(data.data.user);
      } else if (data?.data.access_token) {
        try {
          const user = await fetchCurrentUser(data.data.access_token);
          setAuthUser(user);
        } catch (fetchError) {
          console.error("No se pudo cargar el usuario.", fetchError);
          setAuthUser({ email, id: "unknown" });
        }
      }

      // Set default project ID in session storage
      const defaultProjectId = import.meta.env.VITE_DEFAULT_PROJECT_ID;
      if (defaultProjectId) {
        sessionStorage.setItem('selectedProjectId', defaultProjectId);
      }

      navigate("/admin/dashboard", { replace: true });
    },
    onError: (error) => {
      console.error("Login error:", error);
      setLoginError("No pudimos iniciar sesion. Verifica tus credenciales.");
    },
  });

  const handleLogin = (event) => {
    event.preventDefault();
    if (!email || !password) {
      setLoginError("Por favor completa todos los campos.");
      return;
    }
    submitLogin({ email, password });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-linear-to-br from-slate-950/60 via-blue-900/50 to-emerald-600/25"
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-w-7xl mx-auto min-h-screen items-center justify-end px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/90 p-8 shadow-[0_30px_80px_rgba(5,23,45,0.35)] backdrop-blur">
          <div className="space-y-2 text-center">
            <img src={LogoFull} alt="Logo" className="mx-auto block w-8/12"  />
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Project Management
            </h1>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleLogin}>
            <label
              className="block text-sm font-semibold text-slate-700"
              htmlFor="email"
            >
              Email
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder=""
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
              />
            </label>

            <label
              className="block text-sm font-semibold text-slate-700"
              htmlFor="password"
            >
              Password
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder=""
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-200"
              />
            </label>

            {(isLoginErrorState || loginError) && (
              <p className="text-sm text-red-600">
                {loginError || "We couldn't log you in. Please check your credentials."}
              </p>
            )}

            <button
              className="h-12 w-full rounded-xl bg-linear-to-br from-emerald-400 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isLoginPending}
            >
              {isLoginPending ? "Sending..." : "Log In"}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm font-semibold text-blue-900">
            <button type="button" className="transition hover:text-blue-600">
              Forgot your password?
            </button>
            <button type="button" className="transition hover:text-blue-600">
              Need Help?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
