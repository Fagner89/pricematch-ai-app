import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const ListagemMargem = () => {
  const navigate = useNavigate();
  const [margem, setMargem] = useState<any>(null);

  const loadMargem = () => {
    const storedMargem = localStorage.getItem("margem");
    if (storedMargem) {
      try {
        setMargem(JSON.parse(storedMargem));
      } catch (error) {
        console.error("Erro ao carregar margem:", error);
      }
    }
  };

  useEffect(() => {
    loadMargem();
  }, []);

  // Recarrega quando a página fica visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadMargem();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/cadastros")}
            className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
          >
            <ArrowLeft className="h-8 w-8 text-foreground" />
          </Button>

          <h1 className="text-base sm:text-lg font-bold text-primary">
            Margem
          </h1>

          {!margem && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/cadastro-margem")}
              className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
            >
              <Plus className="h-8 w-8 text-foreground" />
            </Button>
          )}
          {margem && <div className="w-[52px]"></div>}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 p-3 sm:p-4 pb-6 safe-area-bottom">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/cadastros">Cadastros</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Margem</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {margem ? (
            <Card className="shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">%</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground">
                        Configuração de Margem
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Margem: {margem.margem}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Custo Indireto: {margem.custoIndireto || "0,0%"}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/cadastro-margem?modo=editar")}
                    className="shrink-0 text-primary hover:text-primary/80"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <span className="font-bold text-lg text-muted-foreground">%</span>
                </div>
                <p className="text-muted-foreground">Nenhuma margem cadastrada</p>
                <Button onClick={() => navigate("/cadastro-margem")} className="mt-4">
                  Cadastrar Primeira Margem
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ListagemMargem;