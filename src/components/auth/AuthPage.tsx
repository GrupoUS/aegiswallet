import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      {/* Card usando classes daisyUI */}
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary mb-2">
              AegisWallet
            </h1>
            <p className="text-base-content/70">
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </p>
          </div>
          
          {/* Form Content */}
          {isLogin ? <LoginForm /> : <RegisterForm />}
          
          {/* Toggle Button */}
          <div className="mt-4 text-center">
            <button
              className="btn btn-link text-sm"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin 
                ? "Não tem uma conta? Cadastre-se" 
                : "Já tem uma conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
