import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PrecificaLogo from "@/components/PrecificaLogo";

const Index = () => {
  const navigate = useNavigate();

  const handleAccess = () => {
    navigate("/dashboard");
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col justify-between items-center px-4 sm:px-6 py-4 safe-area"
      style={{
        backgroundImage: `url('/lovable-uploads/precificai.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Logo Section */}
      <div className="relative z-10">
        <PrecificaLogo />
      </div>
      
      {/* Access Button and Footer */}
      <div className="relative z-10 w-full max-w-sm space-y-4 sm:space-y-6">
        <Button 
          variant="access" 
          size="lg"
          onClick={handleAccess}
          className="w-full text-base sm:text-lg py-3 sm:py-4 h-12 sm:h-14 font-semibold"
        >
          ACESSAR
        </Button>
        
        <footer className="text-center space-y-1">
          <p className="text-precifica-gray text-xs sm:text-sm">
            © 2025 Precific.aí
          </p>
          <p className="text-precifica-gray text-xs sm:text-sm">
            Um produto Nextsoft Soluções em Tecnologia
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
