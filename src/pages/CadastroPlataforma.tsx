import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handlePercentageInput, parsePercentageToDecimal, formatPercentageInput } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { storage } from "@/lib/storage";

const CadastroPlataforma = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const editPlataforma = location.state?.plataforma;
  const [formData, setFormData] = useState({ nome: "", taxa: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editPlataforma) {
      setFormData({ nome: editPlataforma.nome, taxa: formatPercentageInput(editPlataforma.taxa.toString()) });
    }
  }, [editPlataforma]);

  const savePlataforma = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formData.taxa) newErrors.taxa = "Taxa é obrigatória";

    // Check for duplicates
    const dadosPlataformas = JSON.parse(await storage.getItem("plataformas") || "[]");
    const nomeLower = formData.nome.trim().toLowerCase();
    
    const duplicateNome = dadosPlataformas.find((p: any) => 
      p.nome.toLowerCase() === nomeLower && (!editPlataforma || p.id !== editPlataforma.id)
    );
    
    if (duplicateNome) {
      newErrors.nome = "Já existe uma plataforma com este nome";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Erro ao salvar",
        description: Object.values(newErrors)[0],
        variant: "destructive"
      });
      return false;
    }

    if (editPlataforma) {
      const index = dadosPlataformas.findIndex((p: any) => p.id === editPlataforma.id);
      if (index !== -1) {
        dadosPlataformas[index] = {
          ...dadosPlataformas[index],
          nome: formData.nome.trim(),
          taxa: parsePercentageToDecimal(formData.taxa)
        };
      }
    } else {
      dadosPlataformas.push({
        id: Date.now().toString(),
        nome: formData.nome.trim(),
        taxa: parsePercentageToDecimal(formData.taxa)
      });
    }

    await storage.setItem("plataformas", JSON.stringify(dadosPlataformas));
    return true;
  };

  const handleSave = async () => {
    if (await savePlataforma()) {
      toast({
        title: "Plataforma salva!",
        description: "A plataforma foi cadastrada com sucesso"
      });
      navigate("/listagem-plataformas");
    }
  };

  const handleBack = () => {
    navigate("/listagem-plataformas");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-muted min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Button>
          
          <h1 className="text-base sm:text-lg font-bold text-primary">
            Plataformas
          </h1>
          
          <div className="w-10 sm:w-11"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 safe-area-bottom">
        <div className="max-w-lg mx-auto p-3 sm:p-4 space-y-4">
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
                <BreadcrumbPage>{editPlataforma ? "Editar Plataforma" : "Cadastro de Plataforma"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Card className="shadow-lg border-0" style={{ borderRadius: '3px' }}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome da plataforma"
                    className={`w-full h-12 px-4 border rounded text-sm ${errors.nome ? 'border-red-500' : 'border-gray-300'}`}
                    style={{ borderRadius: '3px', color: '#666666' }}
                  />
                  {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.taxa}
                    onChange={(e) => handlePercentageInput(e.target.value, (value) => setFormData(prev => ({ ...prev, taxa: value })))}
                    placeholder="Taxa (%)"
                    className={`w-full h-12 px-4 border rounded text-sm ${errors.taxa ? 'border-red-500' : 'border-gray-300'}`}
                    style={{ borderRadius: '3px', color: '#666666' }}
                  />
                  {errors.taxa && <p className="text-red-500 text-xs mt-1">{errors.taxa}</p>}
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleSave} className="w-full h-12 font-bold" style={{ backgroundColor: '#180F33', borderRadius: '3px' }}>
                  {editPlataforma ? "Atualizar Plataforma" : "Salvar Plataforma"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CadastroPlataforma;