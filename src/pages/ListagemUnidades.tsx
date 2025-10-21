import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Ruler, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { storage } from "@/lib/storage";

interface Unidade {
  id: string;
  nome: string;
  sigla: string;
}

const ListagemUnidades = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  useEffect(() => {
    (async () => {
      const dadosUnidades = await storage.getItem("unidades");
      if (dadosUnidades) {
        setUnidades(JSON.parse(dadosUnidades));
      }
    })();
  }, []);

  const handleBack = () => {
    navigate("/cadastros");
  };

  const handleNovaUnidade = () => {
    navigate("/cadastro-unidade");
  };

  const handleDeleteUnidade = async (id: string) => {
    const updatedUnidades = unidades.filter(u => u.id !== id);
    setUnidades(updatedUnidades);
    await storage.setItem("unidades", JSON.stringify(updatedUnidades));
    
    toast({
      title: "Unidade removida!",
      description: "A unidade foi excluída com sucesso"
    });
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
            Unidade de Medida
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNovaUnidade}
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
                <BreadcrumbPage>Unidades</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {unidades.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="p-6 text-center">
                <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma unidade cadastrada</p>
                <Button onClick={handleNovaUnidade} className="mt-4">
                  Cadastrar Primeira Unidade
                </Button>
              </CardContent>
            </Card>
          ) : (
            unidades.map((unidade) => (
              <Card key={unidade.id} className="shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center">
                        <Ruler className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground">
                          {unidade.nome}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Sigla: {unidade.sigla}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUnidade(unidade.id)}
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

export default ListagemUnidades;