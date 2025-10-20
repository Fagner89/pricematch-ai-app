import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Store, Edit } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface Loja {
  id: string;
  nome: string;
  cep: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

const ListagemLojas = () => {
  const navigate = useNavigate();
  const [lojas, setLojas] = useState<Loja[]>([]);

  useEffect(() => {
    const dadosLoja = localStorage.getItem("dadosLoja");
    if (dadosLoja) {
      setLojas([JSON.parse(dadosLoja)]);
    }
  }, []);

  const handleBack = () => {
    navigate("/cadastros");
  };

  const handleNovoLoja = () => {
    navigate("/cadastro-loja");
  };

  const handleEditLoja = (loja: Loja) => {
    navigate("/cadastro-loja", { state: { loja } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
          >
            <ArrowLeft className="h-8 w-8 text-foreground" />
          </Button>
          
          <h1 className="text-base sm:text-lg font-bold text-primary">
            Cadastro da Loja
          </h1>
          
          {lojas.length === 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNovoLoja}
              className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
            >
              <Plus className="h-8 w-8 text-foreground" />
            </Button>
          )}
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
                <BreadcrumbPage>Lojas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {lojas.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma loja cadastrada</p>
                <Button onClick={handleNovoLoja} className="mt-4">
                  Cadastrar Primeira Loja
                </Button>
              </CardContent>
            </Card>
          ) : (
            lojas.map((loja) => (
              <Card key={loja.id} className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center">
                        <Store className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground">
                          {loja.nome}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          CEP: {loja.cep}
                        </p>
                        {loja.endereco && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {loja.endereco}, {loja.bairro}
                          </p>
                        )}
                        {loja.cidade && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {loja.cidade} - {loja.uf}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditLoja(loja)}
                      className="shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default ListagemLojas;