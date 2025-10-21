import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Beaker, Trash2, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCentsToBRL, decimalToCents } from "@/lib/monetary";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface Insumo {
  id: string;
  nome: string;
  codigo?: string;
  unidade: string;
  preco_cents?: number; // New format
  preco?: number; // Legacy format for compatibility
}

const ListagemInsumos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const dadosInsumos = localStorage.getItem("insumos");
    if (dadosInsumos) {
      setInsumos(JSON.parse(dadosInsumos));
    }
  }, []);

  const handleBack = () => {
    navigate("/cadastros");
  };

  const handleNovoInsumo = () => {
    navigate("/cadastro-insumo");
  };

  const handleEditInsumo = (id: string) => {
    navigate(`/cadastro-insumo?edit=${id}`);
  };

  const handleDeleteInsumo = (id: string) => {
    const updatedInsumos = insumos.filter(i => i.id !== id);
    setInsumos(updatedInsumos);
    localStorage.setItem("insumos", JSON.stringify(updatedInsumos));
    
    toast({
      title: "Insumo removido!",
      description: "O insumo foi excluído com sucesso"
    });
  };

  const filteredInsumos = insumos.filter((i) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      i.nome.toLowerCase().includes(term) ||
      (i.codigo ? i.codigo.toLowerCase().includes(term) : false)
    );
  });

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
            Insumos
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNovoInsumo}
            className="hover:bg-muted min-w-[52px] min-h-[52px] p-3"
          >
            <Plus className="h-8 w-8 text-foreground" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 pb-6 safe-area-bottom">
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
                <BreadcrumbPage>Insumos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Busca rápida */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou código"
              className="w-full h-11 sm:h-12 pl-10 pr-3 border border-border rounded-sm text-sm text-foreground"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {filteredInsumos.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum insumo encontrado</p>
                {insumos.length === 0 && (
                  <Button onClick={handleNovoInsumo} className="mt-4">
                    Cadastrar Primeiro Insumo
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredInsumos.map((insumo) => (
              <Card key={insumo.id} className="shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center">
                        <Beaker className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
                      </div>
                       
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground">
                          {insumo.nome}
                        </h3>
                        {insumo.codigo && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Código: {insumo.codigo}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Unidade: {insumo.unidade}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-foreground">
                            {formatCentsToBRL(
                              insumo.preco_cents !== undefined 
                                ? insumo.preco_cents 
                                : decimalToCents(insumo.preco || 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditInsumo(insumo.id)}
                        className="shrink-0 text-primary hover:text-primary/80"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteInsumo(insumo.id)}
                        className="shrink-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default ListagemInsumos;